-- Mangi : stockage des images, semaines 3-4
-- À exécuter dans Supabase, « SQL Editor », après schema.sql. Une seule fois.

-- Dossier public pour les planches (chaque utilisateur écrit dans son propre dossier).
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

create policy "publier ses images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "voir les images" on storage.objects
  for select to public
  using (bucket_id = 'posts');

create policy "supprimer ses images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

-- Note : les images sont publiques pour l'instant. La protection des contenus payants
-- (floutage et accès après achat) arrive en semaine 6.
