-- Builder content tables: section templates, reference sites, color palettes.
-- Used by the super admin to curate content for the website builder.

CREATE TABLE IF NOT EXISTS public.section_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  section_type text NOT NULL DEFAULT 'hero',
  description text DEFAULT '',
  html        text NOT NULL DEFAULT '',
  css         text NOT NULL DEFAULT '',
  preview_url text,
  tags        text[] NOT NULL DEFAULT '{}',
  sort_order  int NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','archived')),
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reference_sites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text DEFAULT '',
  industry    text NOT NULL DEFAULT 'general',
  html        text NOT NULL DEFAULT '',
  css         text NOT NULL DEFAULT '',
  thumbnail_url text,
  sort_order  int NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','archived')),
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.color_palettes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  colors      jsonb NOT NULL DEFAULT '{}',
  industry    text NOT NULL DEFAULT 'all',
  sort_order  int NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','archived')),
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.section_templates TO service_role;
GRANT ALL ON public.reference_sites TO service_role;
GRANT ALL ON public.color_palettes TO service_role;
