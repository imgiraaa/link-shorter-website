import { supabase } from './supabaseClient.js';

const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const submitButton = loginForm.querySelector('button[type="submit"]');

// Cek apakah pengguna sudah login saat halaman dimuat
async function checkUser() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
        // Jika sudah login, langsung redirect ke dashboard
        window.location.href = '/admin/';
    }
}

// Jalankan pengecekan saat halaman dimuat
checkUser();

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Tampilkan status loading
    submitButton.disabled = true;
    submitButton.textContent = 'Memproses...';
    errorMessage.classList.add('hidden');

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            throw error;
        }

        // Jika berhasil, redirect ke halaman admin
        window.location.href = '/admin/';

    } catch (error) {
        errorMessage.textContent = 'Email atau password salah. Silakan coba lagi.';
        errorMessage.classList.remove('hidden');
    } finally {
        // Kembalikan tombol ke kondisi semula
        submitButton.disabled = false;
        submitButton.textContent = 'Masuk';
    }
});


