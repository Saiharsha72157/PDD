import { supabase } from './supabase';
import { Paper } from './researchApi';

/**
 * Get all favorite papers for the current user from Supabase
 */
export const getFavorites = async (): Promise<Paper[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('research_favorites')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map database rows back to Paper interface
    return (data || []).map(row => ({
      paperId: row.paper_id,
      title: row.title,
      abstract: row.abstract,
      year: row.year,
      authors: row.authors || [],
      citationCount: row.citation_count,
      referenceCount: row.reference_count,
      isOpenAccess: row.is_open_access,
      openAccessPdf: row.open_access_pdf,
      fieldsOfStudy: row.fields_of_study || [],
      url: row.url,
      venue: row.venue
    }));
  } catch (e) {
    console.error('Error getting favorites from Supabase', e);
    return [];
  }
};

/**
 * Toggle a paper's favorite status in Supabase
 */
export const toggleFavorite = async (paper: Paper): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Authentication required");

    // Check if it already exists
    const { data: existing, error: fetchErr } = await supabase
      .from('research_favorites')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('paper_id', paper.paperId)
      .maybeSingle();

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      throw fetchErr;
    }

    if (existing) {
      // Remove favorite
      const { error: deleteErr } = await supabase
        .from('research_favorites')
        .delete()
        .eq('id', existing.id);
      
      if (deleteErr) throw deleteErr;
      return false; // No longer favorite
    } else {
      // Add favorite
      const { error: insertErr } = await supabase
        .from('research_favorites')
        .insert({
          user_id: session.user.id,
          paper_id: paper.paperId,
          title: paper.title,
          abstract: paper.abstract,
          year: paper.year,
          authors: paper.authors,
          citation_count: paper.citationCount,
          reference_count: paper.referenceCount,
          is_open_access: paper.isOpenAccess,
          open_access_pdf: paper.openAccessPdf,
          fields_of_study: paper.fieldsOfStudy,
          url: paper.url,
          venue: paper.venue
        });
        
      if (insertErr) throw insertErr;
      return true; // Is now favorite
    }
  } catch (e) {
    console.error('Error toggling favorite in Supabase', e);
    return false;
  }
};

/**
 * Check if a paper is favored by the current user
 */
export const isFavorite = async (paperId: string): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { data, error } = await supabase
      .from('research_favorites')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('paper_id', paperId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (e) {
    console.error('Error checking favorite status', e);
    return false;
  }
};
