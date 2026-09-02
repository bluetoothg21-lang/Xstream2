-- =============================================
-- User Lists Features Migration
-- Tables: user_profiles, user_favorites, user_watchlist, user_ratings
-- =============================================

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Favorites Table
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    title TEXT NOT NULL,
    poster_url TEXT DEFAULT '',
    genre TEXT DEFAULT '',
    year TEXT DEFAULT '',
    rating TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Watchlist Table
CREATE TABLE IF NOT EXISTS public.user_watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    title TEXT NOT NULL,
    poster_url TEXT DEFAULT '',
    genre TEXT DEFAULT '',
    year TEXT DEFAULT '',
    rating TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Ratings Table
CREATE TABLE IF NOT EXISTS public.user_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv', 'episode')),
    title TEXT NOT NULL,
    poster_url TEXT DEFAULT '',
    genre TEXT DEFAULT '',
    year TEXT DEFAULT '',
    user_rating INTEGER NOT NULL CHECK (user_rating >= 1 AND user_rating <= 10),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_media_type ON public.user_favorites(media_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_favorites_unique ON public.user_favorites(user_id, media_id, media_type);

CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON public.user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_media_type ON public.user_watchlist(media_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_watchlist_unique ON public.user_watchlist(user_id, media_id, media_type);

CREATE INDEX IF NOT EXISTS idx_user_ratings_user_id ON public.user_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_media_type ON public.user_ratings(media_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_ratings_unique ON public.user_ratings(user_id, media_id, media_type);

-- 6. Trigger function for user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- 7. Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 8. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies

-- user_profiles
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- user_favorites
DROP POLICY IF EXISTS "users_manage_own_user_favorites" ON public.user_favorites;
CREATE POLICY "users_manage_own_user_favorites"
ON public.user_favorites
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- user_watchlist
DROP POLICY IF EXISTS "users_manage_own_user_watchlist" ON public.user_watchlist;
CREATE POLICY "users_manage_own_user_watchlist"
ON public.user_watchlist
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- user_ratings
DROP POLICY IF EXISTS "users_manage_own_user_ratings" ON public.user_ratings;
CREATE POLICY "users_manage_own_user_ratings"
ON public.user_ratings
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 10. Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_user_profiles_updated ON public.user_profiles;
CREATE TRIGGER on_user_profiles_updated
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_user_ratings_updated ON public.user_ratings;
CREATE TRIGGER on_user_ratings_updated
    BEFORE UPDATE ON public.user_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
