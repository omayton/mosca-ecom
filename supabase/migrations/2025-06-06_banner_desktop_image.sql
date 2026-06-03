-- Migration: Add desktop_image_url and mobile_image_url to banners
-- desktop_image_url: full banner image for desktop (AI or upload)
-- mobile_image_url: separate banner image for mobile uploads

ALTER TABLE banners ADD COLUMN IF NOT EXISTS desktop_image_url TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;
