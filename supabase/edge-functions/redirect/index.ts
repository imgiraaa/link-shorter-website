import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Redirect function is running!");

// Deno.serve akan menangani request yang masuk
Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Dapatkan 'slug' dari URL, contoh: hostvara.my.id/UjianSekolah -> slug = "UjianSekolah"
    const url = new URL(req.url);
    const slug = url.pathname.slice(1);

    if (!slug) {
      // Jika tidak ada slug, mungkin redirect ke halaman utama atau halaman error
      return new Response("Halaman utama.", { status: 200, headers: { 'Content-Type': 'text/html' } });
    }

    // 2. Cari slug di database Supabase
    const { data, error } = await supabaseClient
      .from('links')
      .select('original_url, expires_at')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      // Jika tidak ditemukan, redirect ke halaman 404 atau expired
      return new Response("Link tidak ditemukan.", { status: 404, headers: { 'Content-Type': 'text/html' } });
    }

    // 3. Cek apakah link sudah kedaluwarsa
    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (data.expires_at && now > expiresAt) {
      // Redirect ke halaman expired
      return new Response("Link sudah kedaluwarsa.", { status: 410, headers: { 'Content-Type': 'text/html' } });
    }

    // 4. Jika semua aman, redirect ke URL asli
    return Response.redirect(data.original_url, 301);

  } catch (error) {
    console.error(error);
    return new Response("Terjadi kesalahan internal.", { status: 500 });
  }
});
