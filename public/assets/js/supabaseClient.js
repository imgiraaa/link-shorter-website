import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://vqofbshdzvjtkarcibib.supabase.co"; // Supabase Url
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxb2Zic2hkenZqdGthcmNpYmliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDM5NDIsImV4cCI6MjA3MzA3OTk0Mn0.gCzXZ-0mHXV4PjgvHmBlbtRd05kbGooUD8jKDuEzajM"; // Supabase Anon key

export const supabase = createClient(supabaseUrl, supabaseKey);
