-- Custom domain support for tenants.
-- Tenants can map their own domain (e.g. mybusiness.com) to their site.

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS custom_domain text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS domain_verified boolean DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS tenants_custom_domain_idx
  ON public.tenants (custom_domain) WHERE custom_domain IS NOT NULL;
