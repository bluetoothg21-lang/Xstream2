'use client';
import { createClient } from '@/lib/supabase/client';

export interface MediaPayload {
  mediaId: string;
  mediaType: 'movie' | 'tv' | 'episode';
  title: string;
  posterUrl?: string;
  genre?: string;
  year?: string;
  rating?: string;
}

function isSchemaError(error: any): boolean {
  if (!error) return false;
  if (error.code && typeof error.code === 'string') {
    const errorClass = error.code.substring(0, 2);
    if (errorClass === '42' || errorClass === '08') return true;
    if (errorClass === '23') return false;
  }
  if (error.message) {
    const schemaErrorPatterns = [
      /relation.*does not exist/i,
      /column.*does not exist/i,
      /function.*does not exist/i,
      /syntax error/i,
    ];
    return schemaErrorPatterns.some((p) => p.test(error.message));
  }
  return false;
}

export const userListsService = {
  // ---- FAVORITES ----
  async addFavorite(userId: string, media: MediaPayload) {
    const supabase = createClient();
    const { error } = await supabase.from('user_favorites').insert({
      user_id: userId,
      media_id: media.mediaId,
      media_type: media.mediaType === 'episode' ? 'tv' : media.mediaType,
      title: media.title,
      poster_url: media.posterUrl || '',
      genre: media.genre || '',
      year: media.year || '',
      rating: media.rating || '',
    });
    if (error && isSchemaError(error)) throw error;
    return !error;
  },

  async removeFavorite(userId: string, mediaId: string, mediaType: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('media_type', mediaType);
    if (error && isSchemaError(error)) throw error;
    return !error;
  },

  async isFavorite(userId: string, mediaId: string, mediaType: string): Promise<boolean> {
    const supabase = createClient();
    const { data } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
      .maybeSingle();
    return !!data;
  },

  // ---- WATCHLIST ----
  async addToWatchlist(userId: string, media: MediaPayload) {
    const supabase = createClient();
    const { error } = await supabase.from('user_watchlist').insert({
      user_id: userId,
      media_id: media.mediaId,
      media_type: media.mediaType === 'episode' ? 'tv' : media.mediaType,
      title: media.title,
      poster_url: media.posterUrl || '',
      genre: media.genre || '',
      year: media.year || '',
      rating: media.rating || '',
    });
    if (error && isSchemaError(error)) throw error;
    return !error;
  },

  async removeFromWatchlist(userId: string, mediaId: string, mediaType: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('media_type', mediaType);
    if (error && isSchemaError(error)) throw error;
    return !error;
  },

  async isInWatchlist(userId: string, mediaId: string, mediaType: string): Promise<boolean> {
    const supabase = createClient();
    const { data } = await supabase
      .from('user_watchlist')
      .select('id')
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
      .maybeSingle();
    return !!data;
  },

  // ---- RATINGS ----
  async rateMedia(userId: string, media: MediaPayload, userRating: number) {
    const supabase = createClient();
    const { error } = await supabase.from('user_ratings').upsert(
      {
        user_id: userId,
        media_id: media.mediaId,
        media_type: media.mediaType,
        title: media.title,
        poster_url: media.posterUrl || '',
        genre: media.genre || '',
        year: media.year || '',
        rating: media.rating || '',
        user_rating: userRating,
      },
      { onConflict: 'user_id,media_id,media_type' }
    );
    if (error && isSchemaError(error)) throw error;
    return !error;
  },

  async getUserRating(userId: string, mediaId: string, mediaType: string): Promise<number | null> {
    const supabase = createClient();
    const { data } = await supabase
      .from('user_ratings')
      .select('user_rating')
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
      .maybeSingle();
    return data?.user_rating ?? null;
  },
};
