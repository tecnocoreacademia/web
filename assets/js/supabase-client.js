const SUPABASE_URL = "https://kzqnrfyuzcnqqjnsqtes.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Bu0THNHhyqM834euvk8W4w_iMTz4FGP";

// Cliente global disponible en cualquier HTML tras cargar la librería CDN
window.tcSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
