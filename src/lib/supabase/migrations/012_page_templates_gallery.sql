-- 012: Page templates gallery — 100+ full-page website templates for the public gallery
CREATE TABLE IF NOT EXISTS public.page_templates_gallery (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  category    text NOT NULL DEFAULT 'landing',
  industry    text NOT NULL DEFAULT 'general',
  style       text NOT NULL DEFAULT 'modern',
  html        text NOT NULL DEFAULT '',
  css         text NOT NULL DEFAULT '',
  preview_url text,
  tags        text[] NOT NULL DEFAULT '{}',
  sort_order  integer NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'draft'
    CHECK (status = ANY (ARRAY['draft','approved','archived'])),
  featured    boolean NOT NULL DEFAULT false,
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_templates_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_templates_gallery FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.page_templates_gallery DISABLE ROW LEVEL SECURITY';
END $$;

GRANT ALL ON public.page_templates_gallery TO anon, authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_ptg_status_sort ON public.page_templates_gallery (status, sort_order);
CREATE INDEX IF NOT EXISTS idx_ptg_category ON public.page_templates_gallery (category) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_ptg_industry ON public.page_templates_gallery (industry) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_ptg_tags ON public.page_templates_gallery USING gin (tags);
