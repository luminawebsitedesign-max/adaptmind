-- Add new onboarding state columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS welcome_form_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS welcome_tutorial_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS primary_use TEXT,
ADD COLUMN IF NOT EXISTS user_notes TEXT;