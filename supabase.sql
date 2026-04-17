-- Skema SQL untuk Supabase
-- Jalankan kode ini di SQL Editor pada proyek Supabase Anda.

CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS keychain_items (
  id text PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  resi text,
  name text,
  textColor text,
  outlineColor text,
  bgColor text,
  fontFamily text,
  useOutline boolean,
  outlineWidth integer,
  textScale integer,
  textPosX real,
  textPosY real,
  transformX real,
  transformY real,
  transformScale real,
  transformRotate real,
  imgW integer,
  imgH integer,
  imageData text 
);

-- Aktifkan RLS jika ingin membuat lebih secure, tapi untuk permulaan saya bypass dulu
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE keychain_items ENABLE ROW LEVEL SECURITY;
