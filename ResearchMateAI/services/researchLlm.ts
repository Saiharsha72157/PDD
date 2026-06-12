import api from './api';

export const generateSummary = async (abstract: string, mode: "Short" | "Detailed" | "Executive") => {
  try {
    const response = await api.post('/generate-summary', { abstract, mode });
    return response.data.text;
  } catch (error) {
    console.error('[API] Failed to generate summary:', error);
    throw new Error('Failed to generate summary.');
  }
};

export const generateInsights = async (text: string) => {
  try {
    const response = await api.post('/generate-insights', { text });
    return response.data;
  } catch (error) {
    console.error('[API] Failed to generate insights:', error);
    throw new Error('Failed to generate insights.');
  }
};

export const generateLiteratureReview = async (papers: any[]) => {
  try {
    const abstracts = papers.map(p => `- ${p.title}: ${p.abstract}`).join('\n\n');
    const response = await api.post('/generate-literature-review', { abstracts_text: abstracts });
    return response.data.text;
  } catch (error) {
    console.error('[API] Failed to generate literature review:', error);
    throw new Error('Failed to generate literature review.');
  }
};

export const generateCitation = (paper: any, format: "IEEE" | "APA" | "MLA" | "Chicago" | "Harvard") => {
  const authors = paper.authors?.map((a: any) => a.name).join(", ") || "Unknown Authors";
  const year = paper.year || "n.d.";
  const title = paper.title || "Unknown Title";
  const venue = paper.venue || "Unpublished";
  
  if (format === "IEEE") {
    return `${authors}, "${title}," ${venue}, ${year}.`;
  }
  if (format === "APA") {
    return `${authors} (${year}). ${title}. ${venue}.`;
  }
  if (format === "MLA") {
    return `${authors}. "${title}." ${venue} (${year}).`;
  }
  if (format === "Chicago") {
    return `${authors}. "${title}." ${venue} (${year}).`;
  }
  if (format === "Harvard") {
    return `${authors} (${year}) '${title}', ${venue}.`;
  }
  
  return `${authors}. "${title}." ${venue} (${year}).`;
};
