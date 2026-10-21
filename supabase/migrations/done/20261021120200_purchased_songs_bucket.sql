-- Run after 20261021120100_purchases.sql.
-- Private bucket for files a customer has purchased. There is no read policy
-- for anon or authenticated, so the browser cannot download these objects.
-- A later server route will check public.purchases, then create a short-lived
-- signed URL with the service role key.
-- Example previews in public/examples stay on the website. Do not upload those here.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'purchased-songs',
  'purchased-songs',
  false,
  52428800,
  array['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
