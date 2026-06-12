import axios from "axios";

// Using OpenAlex API as a fallback to Semantic Scholar since it has generous free tiers without API keys
const OPENALEX_URL = "https://api.openalex.org";

export interface Paper {
  paperId: string;
  title: string;
  abstract: string | null;
  year: number | null;
  authors: { authorId: string; name: string }[];
  citationCount: number;
  referenceCount: number;
  isOpenAccess: boolean;
  openAccessPdf: { url: string; status: string } | null;
  fieldsOfStudy: string[];
  url: string;
  venue: string | null;
}

// Helper to reconstruct abstract from inverted index
const reconstructAbstract = (invertedIndex: Record<string, number[]> | null): string | null => {
  if (!invertedIndex) return null;
  const words: { word: string; pos: number }[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push({ word, pos });
    }
  }
  words.sort((a, b) => a.pos - b.pos);
  return words.map((w) => w.word).join(" ");
};

const mapOpenAlexToPaper = (work: any): Paper => {
  return {
    paperId: work.id ? work.id.replace("https://openalex.org/", "") : Math.random().toString(36).substring(7),
    title: work.title || "Untitled",
    abstract: reconstructAbstract(work.abstract_inverted_index),
    year: work.publication_year || null,
    authors: (work.authorships || []).map((a: any) => ({
      authorId: a.author?.id ? a.author.id.replace("https://openalex.org/", "") : `author-${Math.random().toString(36).substring(7)}`,
      name: a.author?.display_name || "Unknown Author",
    })),
    citationCount: work.cited_by_count || 0,
    referenceCount: work.referenced_works_count || 0,
    isOpenAccess: work.open_access?.is_oa || false,
    openAccessPdf: work.open_access?.oa_url ? { url: work.open_access.oa_url, status: "AVAILABLE" } : null,
    fieldsOfStudy: (work.concepts || []).map((c: any) => c.display_name),
    url: work.doi || work.id || "",
    venue: work.primary_location?.source?.display_name || null,
  };
};

export const searchPapers = async (
  query: string,
  limit: number = 20,
  offset: number = 0,
  filters?: { openAccess?: boolean; yearRange?: string; ieeeOnly?: boolean }
): Promise<{ data: Paper[]; total: number }> => {
  try {
    const page = Math.floor(offset / limit) + 1;
    
    // Build openalex filters string
    let apiFilter = "";
    const filterParts = [];
    if (filters?.openAccess) filterParts.push("is_oa:true");
    if (filters?.yearRange && filters.yearRange !== 'All') {
      const year = filters.yearRange.replace('Since ', '');
      filterParts.push(`publication_year:>${year}`);
    }
    if (filterParts.length > 0) {
      apiFilter = filterParts.join(",");
    }

    const searchQuery = filters?.ieeeOnly ? `${query} IEEE` : query;

    const response = await axios.get(`${OPENALEX_URL}/works`, {
      params: {
        search: searchQuery,
        per_page: limit,
        page: page,
        ...(apiFilter ? { filter: apiFilter } : {})
      },
    });
    
    const results = response.data.results.map(mapOpenAlexToPaper);
    return {
      data: results,
      total: response.data.meta.count,
    };
  } catch (error) {
    console.error("[ResearchAPI] Search error:", error);
    throw error;
  }
};

export const getPaperDetails = async (paperId: string): Promise<Paper> => {
  try {
    const response = await axios.get(`${OPENALEX_URL}/works/${paperId}`);
    return mapOpenAlexToPaper(response.data);
  } catch (error) {
    console.error("[ResearchAPI] Get Details error:", error);
    throw error;
  }
};
