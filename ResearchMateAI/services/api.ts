import axios, { AxiosInstance, AxiosError } from "axios";
import { AnalysisResult, ManualDataRequest } from "../types/analysis";
import { supabase } from "./supabase";

// Render Deployment URL
const BASE_URL = "https://researchmateai-backend.onrender.com";

// Create Axios instance with configuration
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds for analysis
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - dynamically fetches and attaches the Supabase user JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("[API] Failed to retrieve Supabase session JWT:", err);
    }

    console.log("[API] Request:", {
      method: config.method,
      url: config.url,
      timeout: config.timeout,
    });
    return config;
  },
  (error: AxiosError) => {
    console.error("[API] Request error:", error.message);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("[API] Response success:", {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as any;

    // Check if the error is a timeout or gateway cold-start symptom (status 502, 503, 504 or ECONNABORTED)
    const isTimeoutOrGateway =
      error.code === "ECONNABORTED" ||
      !error.response ||
      [502, 503, 504].includes(error.response?.status);

    if (isTimeoutOrGateway && config && !config._retry) {
      config._retry = true;
      console.warn(`[API] Cold-start timeout/gateway error detected at ${config.url}. Retrying request in 3 seconds to let server spin up...`);
      
      // Wait for 3 seconds to give the Render server container time to finish booting
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return api(config);
    }

    // Handle common errors
    if (!error.response) {
      console.error("[API] Network Error:", {
        message: error.message,
        code: error.code,
      });
    } else {
      console.error("[API] Server Error:", {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data,
      });
    }
    return Promise.reject(error);
  }
);

// Types
export interface GenerateTitlesRequest {
  department: string;
  domain: string;
}

export interface ProjectItem {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  algorithms: string[];
  summary: string;
  dataset: string;
  best_algorithms_explanation: string;
}

export interface GenerateTitlesResponse {
  projects: ProjectItem[];
}

// API Methods
export const generateTitles = async (
  data: GenerateTitlesRequest
): Promise<GenerateTitlesResponse> => {
  try {
    console.log("[API] generateTitles called with:", data);

    // Validate input
    if (!data || typeof data !== "object") {
      throw new Error("Invalid request data");
    }

    if (!data.department || typeof data.department !== "string") {
      throw new Error("Department is required");
    }

    if (!data.domain || typeof data.domain !== "string") {
      throw new Error("Domain is required");
    }

    const response = await api.post<GenerateTitlesResponse>(
      "/generate-titles",
      data
    );

    if (!response.data || !Array.isArray(response.data.projects)) {
      throw new Error("Invalid response format from server");
    }

    console.log("[API] generateTitles success:", response.data.projects.length);
    return response.data;
  } catch (error) {
    console.error("[API] generateTitles error:", error);
    throw error;
  }
};

/**
 * Upload and analyze a CSV file with comprehensive statistics and graphs
 */
export const uploadCSV = async (file: {
  uri: string;
  name: string;
  size?: number;
  type?: string;
}): Promise<AnalysisResult> => {
  try {
    console.log("[API] uploadCSV called with file:", file.name);

    // Validate file
    if (!file || !file.uri || !file.name) {
      throw new Error("Invalid file object");
    }

    const formData = new FormData();

    try {
      // Create a blob from the file URI
      const response = await fetch(file.uri);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }

      const blob = await response.blob();

      if (!blob || blob.size === 0) {
        throw new Error("File is empty");
      }

      // Append the file to form data
      formData.append("file", blob, file.name);

      console.log("[API] File prepared for upload:", {
        name: file.name,
        size: blob.size,
      });
    } catch (fetchError) {
      console.error("[API] Error preparing file:", fetchError);
      throw new Error("Could not read file. Please try another file.");
    }

    // Make the request with multipart/form-data
    const apiResponse = await axios.post<AnalysisResult>(
      `${BASE_URL}/analyze-csv`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
      }
    );

    if (!apiResponse.data) {
      throw new Error("No response data from server");
    }

    console.log("[API] uploadCSV success");
    return apiResponse.data;
  } catch (error) {
    console.error("[API] uploadCSV error:", error);
    throw error;
  }
};

/**
 * Analyze manually entered data with comprehensive statistics and graphs
 */
export const analyzeManualData = async (
  data: ManualDataRequest
): Promise<AnalysisResult> => {
  try {
    console.log("[API] analyzeManualData called");

    if (!data || typeof data !== "object") {
      throw new Error("Invalid request data");
    }

    const response = await api.post<AnalysisResult>(
      "/analyze-manual-data",
      data
    );

    if (!response.data) {
      throw new Error("No response data from server");
    }

    console.log("[API] analyzeManualData success");
    return response.data;
  } catch (error) {
    console.error("[API] analyzeManualData error:", error);
    throw error;
  }
};

/**
 * Generic error handler for API calls
 * Extracts meaningful error messages from various error types
 */
export const handleApiError = (error: unknown): string => {
  console.error("[API] handleApiError called with:", error);

  try {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        const data = error.response.data as any;
        const message =
          data?.message ||
          data?.detail ||
          data?.error ||
          `Server Error: ${error.response.status}`;

        console.error("[API] Server error response:", message);
        return message;
      } else if (error.request) {
        // Request made but no response
        console.error("[API] No response from server");
        return "No response from server. Please check your internet connection.";
      } else {
        // Error in request setup
        console.error("[API] Request setup error:", error.message);
        return error.message || "Failed to send request";
      }
    } else if (error instanceof Error) {
      console.error("[API] Generic error:", error.message);
      return error.message;
    } else {
      console.error("[API] Unknown error type:", error);
      return "An unexpected error occurred. Please try again.";
    }
  } catch (handlerError) {
    console.error("[API] Error handler crashed:", handlerError);
    return "An error occurred while processing your request.";
  }
};

/**
 * Health check to verify API connection
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    console.log("[API] Health check initiated");
    const response = await api.get("/health", { timeout: 5000 });
    console.log("[API] Health check passed");
    return response.status === 200;
  } catch (error) {
    console.error("[API] Health check failed:", error);
    return false;
  }
};

export interface Dataset {
  title: string;
  url: string;
  size: string;
  last_updated: string;
  vote_count: number;
  description: string;
  source: string;
}

/**
 * Dynamically searches Kaggle (and future provider) datasets by query
 */
export const searchDatasets = async (
  query: string,
  provider: string = "kaggle",
  page: number = 1,
  limit: number = 20
): Promise<Dataset[]> => {
  try {
    console.log("[API] searchDatasets called with query:", query, "provider:", provider);
    const response = await api.get<Dataset[]>("/search-datasets", {
      params: {
        query,
        provider,
        page,
        limit,
      },
    });
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid response format from server");
    }
    console.log("[API] searchDatasets success, fetched:", response.data.length);
    return response.data;
  } catch (error) {
    console.error("[API] searchDatasets error:", error);
    throw error;
  }
};

import { currentLanguage, setCurrentLanguage } from "./localization";
export { currentLanguage, setCurrentLanguage };


export interface ParaphraseRequest {
  text: string;
  mode: string;
  language?: string;
}

export interface ParaphraseResponse {
  paraphrased_text: string;
}

/**
 * Paraphrases text using different writing modes using the local QuillBot-style engine
 */
export const paraphraseText = async (
  data: ParaphraseRequest
): Promise<ParaphraseResponse> => {
  try {
    console.log("[API] local paraphraseText called with mode:", data.mode, "language:", currentLanguage);

    if (!data || typeof data !== "object") {
      throw new Error("Invalid request data");
    }

    if (!data.text || typeof data.text !== "string") {
      throw new Error("Text is required");
    }

    if (!data.mode || typeof data.mode !== "string") {
      throw new Error("Paraphrasing mode is required");
    }

    const payload = {
      ...data,
      language: currentLanguage,
    };

    const response = await api.post<ParaphraseResponse>(
      "/paraphrase",
      payload
    );

    if (!response.data || typeof response.data.paraphrased_text !== "string") {
      throw new Error("Invalid response format from server");
    }

    // Dynamic Database Sync: Save to Supabase if the user is authenticated!
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const resData = response.data as any;
        await supabase.from("paraphrase_history").insert({
          user_id: session.user.id,
          original_text: data.text,
          paraphrased_text: resData.paraphrased_text,
          mode: data.mode,
          score: resData.score || 9.0,
          favorite: false
        });
      }
    } catch (dbErr) {
      console.warn("[API] Failed to auto-save paraphrase history to Supabase:", dbErr);
    }

    console.log("[API] local paraphraseText success");
    return response.data;
  } catch (error) {
    console.error("[API] local paraphraseText error:", error);
    throw error;
  }
};

export interface HistoryRecord {
  id: string;
  timestamp: string;
  original_text: string;
  paraphrased_text: string;
  mode: string;
  score: number;
  favorite: boolean;
}

/**
 * Fetches all paraphrasing history records directly from Supabase
 */
export const getParaphraseHistory = async (): Promise<HistoryRecord[]> => {
  try {
    console.log("[API] getParaphraseHistory called (Supabase)");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from("paraphrase_history")
      .select("*")
      .eq("user_id", session.user.id)
      .order("timestamp", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[API] getParaphraseHistory error:", error);
    throw error;
  }
};

/**
 * Fetches all starred/favorite paraphrasing records directly from Supabase
 */
export const getParaphraseFavorites = async (): Promise<HistoryRecord[]> => {
  try {
    console.log("[API] getParaphraseFavorites called (Supabase)");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from("paraphrase_history")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("favorite", true)
      .order("timestamp", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[API] getParaphraseFavorites error:", error);
    throw error;
  }
};

/**
 * Toggles favorite state of a history entry in Supabase
 */
export const toggleParaphraseFavorite = async (id: string): Promise<HistoryRecord> => {
  try {
    console.log("[API] toggleParaphraseFavorite called for ID:", id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Authentication required");

    // 1. Fetch current favorite status
    const { data: current, error: fetchErr } = await supabase
      .from("paraphrase_history")
      .select("favorite")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;

    // 2. Toggle favorite status
    const { data, error } = await supabase
      .from("paraphrase_history")
      .update({ favorite: !current.favorite })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[API] toggleParaphraseFavorite error:", error);
    throw error;
  }
};

/**
 * Deletes a paraphrasing history entry from Supabase
 */
export const deleteParaphraseHistory = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log("[API] deleteParaphraseHistory called for ID:", id);
    const { error } = await supabase
      .from("paraphrase_history")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true, message: "History entry deleted successfully." };
  } catch (error) {
    console.error("[API] deleteParaphraseHistory error:", error);
    throw error;
  }
};

export interface GrammarIssue {
  type: string;
  message: string;
  severity: "warning" | "error";
  position?: number;
}

export interface ReadabilityMetrics {
  score: number;
  level: "Easy" | "Moderate" | "Complex";
}

export interface ToneMetrics {
  tone: string;
  confidence: number;
}

export interface WritingSuggestion {
  type: string;
  message: string;
  context?: string;
}

export interface WritingAnalysisResponse {
  grammar: GrammarIssue[];
  readability: ReadabilityMetrics;
  tone: ToneMetrics;
  suggestions: WritingSuggestion[];
}

/**
 * Invokes modular grammar, readability, tone, and stylistic suggestion engines.
 */
export const analyzeWriting = async (text: string): Promise<WritingAnalysisResponse> => {
  try {
    console.log("[API] analyzeWriting initiated");
    if (!text || typeof text !== "string") {
      throw new Error("Text content is required for intelligence analysis.");
    }
    const response = await api.post<WritingAnalysisResponse>("/writing-analysis", { text });
    console.log("[API] analyzeWriting completed successfully");
    return response.data;
  } catch (error) {
    console.error("[API] analyzeWriting error:", error);
    throw error;
  }
};

/**
 * Regenerate comparative grouped bar chart with custom labels
 */
export const regenerateChart = async (data: {
  groups: string[];
  parameters: string[];
  comparison_stats: Record<string, Record<string, any>>;
  group_col: string;
  title: string;
  xlabel: string;
  ylabel: string;
}): Promise<{ success: boolean; comparison_graph: string }> => {
  try {
    console.log("[API] regenerateChart called with title:", data.title);
    const response = await api.post("/regenerate-chart", data);
    return response.data;
  } catch (error) {
    console.error("[API] regenerateChart error:", error);
    throw error;
  }
};

export interface TitleBookmark {
  id: string;
  user_id: string;
  title: string;
  department: string;
  domain: string;
  difficulty: string;
  algorithms: string[];
  summary: string;
  dataset: string;
  best_algorithms_explanation: string;
  timestamp: string;
}

/**
 * Fetches all bookmarked title plans directly from Supabase
 */
export const getTitleBookmarks = async (): Promise<TitleBookmark[]> => {
  try {
    console.log("[API] getTitleBookmarks called");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from("title_bookmarks")
      .select("*")
      .eq("user_id", session.user.id)
      .order("timestamp", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[API] getTitleBookmarks error:", error);
    throw error;
  }
};

/**
 * Saves a generated research title bookmark in Supabase
 */
export const addTitleBookmark = async (
  bookmark: Omit<TitleBookmark, "id" | "user_id" | "timestamp">
): Promise<TitleBookmark> => {
  try {
    console.log("[API] addTitleBookmark called for:", bookmark.title);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Authentication required");

    const { data, error } = await supabase
      .from("title_bookmarks")
      .insert({
        user_id: session.user.id,
        ...bookmark
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[API] addTitleBookmark error:", error);
    throw error;
  }
};

/**
 * Deletes a bookmarked research title from Supabase
 */
export const removeTitleBookmark = async (title: string): Promise<void> => {
  try {
    console.log("[API] removeTitleBookmark called for:", title);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Authentication required");

    const { error } = await supabase
      .from("title_bookmarks")
      .delete()
      .eq("user_id", session.user.id)
      .eq("title", title);

    if (error) throw error;
  } catch (error) {
    console.error("[API] removeTitleBookmark error:", error);
    throw error;
  }
};

/**
 * Proactively pings the backend server to trigger wake-up from sleep (cold starts) in the background
 */
export const warmUpBackend = async (): Promise<void> => {
  try {
    console.log("[API] Proactive warm-up ping initiated via silent background fetch");
    fetch("https://researchmateai-backend.onrender.com/health").catch(() => {});
  } catch (err) {
    // Completely silent fallback
  }
};

export interface SupportTicketRequest {
  ticket_type: string;
  email: string;
  message: string;
}

/**
 * Submits a help/support ticket which the backend emails to the admin
 */
export const submitSupportTicket = async (data: SupportTicketRequest): Promise<{ success: boolean; message: string }> => {
  try {
    console.log("[API] submitSupportTicket called for email:", data.email);
    const response = await api.post("/submit-support-ticket", data);
    return response.data;
  } catch (error) {
    console.error("[API] submitSupportTicket error:", error);
    throw error;
  }
};

export default api;
