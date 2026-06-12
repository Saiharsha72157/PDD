/**
 * Analysis response types from the backend
 */

export interface GroupStat {
  n: number;
  mean: number | null;
  std: number | null;
  sem: number | null;
}

export interface Graph {
  image?: string;
  error?: string;
  type: string;
  column?: string;
  columns?: string[];
}

export interface Statistics {
  error?: string;
  type: "numeric" | "categorical";
  count: number;
  missing: number;
  mean?: number | null;
  median?: number | null;
  std?: number | null;
  min?: number | null;
  max?: number | null;
  "25%"?: number | null;
  "50%"?: number | null;
  "75%"?: number | null;
  kurtosis?: number | null;
  skewness?: number | null;
  variance?: number | null;
  unique?: number;
  top?: string | number | null;
  freq?: number;
  top_values?: Array<[string | number, number]>;
  most_common?: string | number | null;
  value_counts?: Record<string, number>;
}

export interface AnalysisResult {
  success: boolean;
  file_name?: string;
  source?: string;
  rows?: number;
  columns?: number;
  group_col?: string;
  groups?: string[];
  parameters?: string[];
  comparison_stats?: Record<string, Record<string, GroupStat>>;
  comparison_graph?: string;
  
  // CSV/Dataset analysis additions
  correlation?: {
    columns: string[];
    matrix: number[][];
  };
  numeric_columns?: string[];
  graphs?: {
    histograms: Graph[];
    bar_charts: Graph[];
    pie_charts: Graph[];
    scatter_plots: Graph[];
    box_plot?: Graph;
    heatmap?: Graph;
  };
  summary?: {
    total_rows: number;
    total_columns: number;
    numeric_columns: number;
    categorical_columns: number;
    total_missing: number;
    memory_usage: string;
    missing_percentage: number;
  };
  statistics?: Record<string, Statistics>;
}

export interface ManualDataRequest {
  column_names: string[];
  rows: (string | number | null)[][];
}

export interface AnalysisError {
  detail?: string;
  message?: string;
}
