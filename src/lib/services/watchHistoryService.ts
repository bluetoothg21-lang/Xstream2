import { createClient } from '../supabase/client';
import { getMovieDetails, getTVDetails } from './tmdbService';

export interface ProgressPayload {
  mediaId: string;
  mediaType: 'movie' | 'tv';
  currentTime: number;
  duration: number;
}

export interface HydratedWatchProgress {
  id: string;
  media_id: string;
  media_type: 'movie' | 'tv';
  current_time: number;
  duration: number;
  progress_percent: number;
  updated_at: string;
  title: string;
  img: string;
  genre: string;
  year: string;
  rating: string;
}

export const watchHistoryService = {
  async upsertProgress({ mediaId, mediaType, currentTime, duration }: ProgressPayload) {
    if (!mediaId || !Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) return null;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const progressPercent = Math.min(Math.max(Math.round((currentTime / duration) * 100), 0), 100);

    if (progressPercent >= 95) {
      await supabase
        .from('watch_progress')
        .delete()
        .match({ user_id: user.id, media_id: mediaId, media_type: mediaType });
      return null;
    }

    const { data, error } = await supabase
      .from('watch_progress')
      .upsert({
        user_id: user.id,
        media_id: mediaId,
        media_type: mediaType,
        current_time: currentTime,
        duration,
        progress_percent: progressPercent,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,media_id,media_type' })
      .select()
      .single();

    if (error) {
      console.error('Database progression sync failed:', error.message);
      return null;
    }
    return data;
  },

  async getHydratedWatchHistory(): Promise<HydratedWatchProgress[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: rawHistory, error } = await supabase
      .from('watch_progress')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error || !rawHistory) return [];

    const hydrated = await Promise.all(rawHistory.map(async (record) => {
      const details = record.media_type === 'tv'
        ? await getTVDetails(Number(record.media_id))
        : await getMovieDetails(Number(record.media_id));
      if (!details) return null;

      const isTV = record.media_type === 'tv';
      const title = isTV
        ? (details as NonNullable<Awaited<ReturnType<typeof getTVDetails>>>).name
        : (details as NonNullable<Awaited<ReturnType<typeof getMovieDetails>>>).title;
      const year = isTV
        ? (details as NonNullable<Awaited<ReturnType<typeof getTVDetails>>>).firstAirDate.slice(0, 4)
        : (details as NonNullable<Awaited<ReturnType<typeof getMovieDetails>>>).releaseDate.slice(0, 4);
      return {
        ...record,
        media_type: record.media_type as 'movie' | 'tv',
        title,
        img: details.img,
        genre: details.genres?.[0] || '',
        year,
        rating: details.rating,
      } as HydratedWatchProgress;
    }));

    return hydrated.filter((item): item is HydratedWatchProgress => item !== null);
  },
};