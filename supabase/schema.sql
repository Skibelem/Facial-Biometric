-- ==============================================================================
-- PROJECT: Design and Implementation of a Secure Biometric Authentication System
-- PHASE 4 UPGRADE: Secure Server-Side Biometric Authentication RPC Function & RLS
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. DATABASE TABLES CREATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    date_registered TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.facial_biometric (
    biometric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    facial_template TEXT NOT NULL,
    capture_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.authentication_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    login_date DATE NOT NULL DEFAULT CURRENT_DATE,
    login_time TIME NOT NULL DEFAULT CURRENT_TIME,
    status TEXT NOT NULL
);

-- ==============================================================================
-- 2. INDEXES FOR QUERY OPTIMIZATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_facial_biometric_user ON public.facial_biometric(user_id);
CREATE INDEX IF NOT EXISTS idx_authentication_log_user ON public.authentication_log(user_id);
CREATE INDEX IF NOT EXISTS idx_authentication_log_date ON public.authentication_log(login_date);

-- ==============================================================================
-- 3. SUPABASE AUTH USER SYNCHRONIZATION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (user_id, full_name, email, date_registered)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Registered User'),
        NEW.email,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. SECURE SERVER-SIDE FACIAL BIOMETRIC MATCHING RPC FUNCTION
-- Performs 1:N Euclidean distance matching server-side inside PostgreSQL
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.verify_biometric_login(
    p_live_descriptor TEXT,
    p_threshold DOUBLE PRECISION DEFAULT 0.6
)
RETURNS JSONB AS $$
DECLARE
    v_rec RECORD;
    v_live_arr JSONB;
    v_tmpl_arr JSONB;
    v_dist DOUBLE PRECISION;
    v_min_dist DOUBLE PRECISION := 999.0;
    v_matched_user_id UUID := NULL;
    v_matched_name TEXT := NULL;
    v_matched_email TEXT := NULL;
    v_elem_count INT;
    i INT;
    v_diff DOUBLE PRECISION;
    v_sum DOUBLE PRECISION;
BEGIN
    -- Parse input live descriptor string as JSONB array
    BEGIN
        v_live_arr := p_live_descriptor::jsonb;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'matched', FALSE,
            'message', 'Invalid live descriptor format.',
            'distance', 1.0,
            'threshold', p_threshold
        );
    END;

    -- Iterate through all enrolled facial templates in public.facial_biometric
    FOR v_rec IN 
        SELECT fb.user_id, fb.facial_template, COALESCE(u.full_name, 'Enrolled User') AS full_name, COALESCE(u.email, '') AS email
        FROM public.facial_biometric fb
        LEFT JOIN public.users u ON u.user_id = fb.user_id
    LOOP
        BEGIN
            v_tmpl_arr := v_rec.facial_template::jsonb;
            v_sum := 0.0;
            v_elem_count := LEAST(jsonb_array_length(v_live_arr), jsonb_array_length(v_tmpl_arr));
            
            -- Compute Euclidean distance
            FOR i IN 0..(v_elem_count - 1) LOOP
                v_diff := (v_live_arr->>i)::double precision - (v_tmpl_arr->>i)::double precision;
                v_sum := v_sum + (v_diff * v_diff);
            END LOOP;
            
            v_dist := |/ v_sum; -- Square root
            
            IF v_dist < v_min_dist THEN
                v_min_dist := v_dist;
                IF v_dist <= p_threshold THEN
                    v_matched_user_id := v_rec.user_id;
                    v_matched_name := v_rec.full_name;
                    v_matched_email := v_rec.email;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Skip malformed template rows safely
            CONTINUE;
        END;
    END LOOP;

    -- Handle match decision & record audit log
    IF v_matched_user_id IS NOT NULL THEN
        INSERT INTO public.authentication_log (user_id, login_date, login_time, status)
        VALUES (v_matched_user_id, CURRENT_DATE, CURRENT_TIME, 'SUCCESS');

        RETURN jsonb_build_object(
            'matched', TRUE,
            'user_id', v_matched_user_id,
            'full_name', v_matched_name,
            'email', v_matched_email,
            'distance', ROUND(v_min_dist::numeric, 4),
            'threshold', p_threshold
        );
    ELSE
        INSERT INTO public.authentication_log (user_id, login_date, login_time, status)
        VALUES (NULL, CURRENT_DATE, CURRENT_TIME, 'FAILED_VERIFICATION');

        RETURN jsonb_build_object(
            'matched', FALSE,
            'distance', CASE WHEN v_min_dist = 999.0 THEN 1.0 ELSE ROUND(v_min_dist::numeric, 4) END,
            'threshold', p_threshold,
            'message', 'No matching biometric profile found.'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions on RPC function to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.verify_biometric_login(TEXT, DOUBLE PRECISION) TO anon, authenticated, service_role;

-- ==============================================================================
-- 5. SUPABASE STORAGE BUCKET FOR FACIAL CAPTURES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'facial-captures',
    'facial-captures',
    FALSE,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 10485760;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) & SECURITY POLICIES
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facial_biometric ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authentication_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow biometric template reading for 1:N matching & verification
CREATE POLICY "Allow reading facial templates for biometric matching"
    ON public.facial_biometric FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can insert own biometric record"
    ON public.facial_biometric FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own biometric record"
    ON public.facial_biometric FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own authentication logs"
    ON public.authentication_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow inserting authentication logs"
    ON public.authentication_log FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Users can upload facial capture images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'facial-captures' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view own facial capture images"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'facial-captures' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
