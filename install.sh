#!/bin/bash

# Skrip ini akan membuat struktur folder dan file dasar untuk proyek Link Shortener.

echo "Membuat struktur proyek untuk Link Shortener..."

# Membuat direktori utama dan subdirektori
mkdir -p public/admin public/assets/js public/assets/css supabase/edge-functions/redirect
echo "Direktori berhasil dibuat."

# --- Halaman Admin ---
cat << 'EOF' > public/admin/index.html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Admin - Link Shortener</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-50">
    <!-- Konten Dashboard akan kita buat di sini -->
    <div class="p-8">
        <h1 class="text-3xl font-bold text-slate-800">Dashboard Admin</h1>
        <p class="text-slate-600">Selamat datang! Kelola semua link Anda dari sini.</p>
    </div>

    <!-- Script untuk Supabase & logika dashboard -->
    <script type="module" src="../assets/js/dashboard.js"></script>
</body>
</html>
EOF
echo "File public/admin/index.html (Dashboard) berhasil dibuat."

# --- Halaman Login Admin ---
cat << 'EOF' > public/login.html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Admin</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-50 flex items-center justify-center min-h-screen">
    <!-- Konten Form Login akan kita buat di sini -->
    <div class="p-8 bg-white rounded-lg shadow-md w-96">
        <h2 class="text-2xl font-bold text-center text-slate-800">Admin Login</h2>
    </div>

    <!-- Script untuk Supabase & logika auth -->
    <script type="module" src="assets/js/auth.js"></script>
</body>
</html>
EOF
echo "File public/login.html (Login) berhasil dibuat."

# --- Halaman Pengalihan (Interstitial) ---
cat << 'EOF' > public/redirect.html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mengalihkan...</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-50 flex items-center justify-center min-h-screen">
    <!-- Konten Halaman Pengalihan akan kita buat di sini -->
    <div class="p-8 bg-white rounded-lg shadow-md text-center">
        <h2 class="text-2xl font-bold text-slate-800">Anda akan dialihkan...</h2>
        <p id="destination-url" class="text-slate-600 my-4 break-all"></p>
        <a id="redirect-button" href="#" class="inline-block bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">Lanjutkan</a>
    </div>

    <!-- Script untuk Supabase & logika redirect -->
    <script type="module" src="assets/js/redirect.js"></script>
</body>
</html>
EOF
echo "File public/redirect.html (Halaman Pengalihan) berhasil dibuat."

# --- Halaman Expired ---
cat << 'EOF' > public/expired.html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Link Kedaluwarsa</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-50 flex items-center justify-center min-h-screen">
    <div class="p-8 bg-white rounded-lg shadow-md text-center">
        <h2 class="text-2xl font-bold text-orange-600">Link Kedaluwarsa</h2>
        <p class="text-slate-600 my-4">Maaf, link yang Anda tuju sudah tidak berlaku lagi.</p>
    </div>
</body>
</html>
EOF
echo "File public/expired.html (Halaman Expired) berhasil dibuat."

# --- File JavaScript ---
touch public/assets/js/auth.js
touch public/assets/js/dashboard.js
touch public/assets/js/redirect.js
echo "File-file JavaScript berhasil dibuat."

# --- Supabase Edge Function (INTI DARI SISTEM) ---
cat << 'EOF' > supabase/edge-functions/redirect/index.ts
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
EOF
echo "Kerangka Supabase Edge Function berhasil dibuat."

echo -e "\n\n"
echo "=========================================="
echo "   Struktur Proyek Link Shortener Selesai!   "
echo "=========================================="
echo -e "\nLangkah selanjutnya:"
echo "1. Baca file 'README.md' yang saya berikan untuk panduan lengkap setup."
echo "2. Buat proyek di Supabase dan dapatkan API keys Anda."
echo "3. Gunakan 'schema.sql' untuk membuat tabel di database."
echo "4. Deploy Edge Function ke Supabase."
echo "5. Deploy folder 'public' ke Vercel/Netlify."
echo ""
EOF


