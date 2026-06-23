-- Add source tracking, admin_note, and updated_at to contact_enquiries.
-- source distinguishes website form submissions from the legacy /contact page.

ALTER TABLE public.contact_enquiries ADD COLUMN IF NOT EXISTS source text DEFAULT 'contact_form';
ALTER TABLE public.contact_enquiries ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE public.contact_enquiries ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS contact_enquiries_source_idx ON public.contact_enquiries (source);
