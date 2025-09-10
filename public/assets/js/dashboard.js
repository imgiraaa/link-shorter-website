import { supabase } from './supabaseClient.js';

// Cek autentikasi (Auth Guard)
let currentUser = null;
async function checkAuth() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
        window.location.href = '/login.html'; // Redirect ke login jika tidak ada sesi
        return;
    }
    currentUser = data.session.user;
    document.getElementById('user-email').textContent = currentUser.email;
    fetchLinks();
}

// Elemen DOM
const linksContainer = document.getElementById('links-container');
const loadingIndicator = document.getElementById('loading-indicator');
const addLinkButton = document.getElementById('add-link-button');
const modal = document.getElementById('link-modal');
const modalContent = modal.querySelector('.modal-content');
const modalTitle = document.getElementById('modal-title');
const linkForm = document.getElementById('link-form');
const cancelButton = document.getElementById('cancel-button');
const modalError = document.getElementById('modal-error');
const logoutButton = document.getElementById('logout-button');
const saveButton = document.getElementById('save-button');

// Fungsi untuk mengambil dan menampilkan semua link
async function fetchLinks() {
    loadingIndicator.style.display = 'block';
    linksContainer.innerHTML = ''; // Clear previous table content

    const { data: links, error } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', currentUser.id) // Hanya ambil link milik pengguna yang login
        .order('created_at', { ascending: false });

    if (error) {
        linksContainer.innerHTML = '<p class="text-red-500 text-center py-10">Gagal memuat link.</p>';
        console.error(error);
        return;
    }

    loadingIndicator.style.display = 'none';

    if (links.length === 0) {
        linksContainer.innerHTML = '<p class="text-slate-500 text-center py-10">Anda belum membuat link apapun. Klik "Tambah Link Baru" untuk memulai.</p>';
        return;
    }

    const tableHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Link Pendek</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">URL Asli</th>
                        <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Klik</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-slate-200">
                    ${links.map(link => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <a href="/${link.slug}" target="_blank" class="text-blue-600 font-medium hover:underline">hostvara.my.id/${link.slug}</a>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-slate-500 max-w-xs truncate" title="${link.original_url}">${link.original_url}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-slate-500 text-center font-semibold">${link.click_count}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button class="text-orange-600 hover:text-orange-900 edit-button" data-id="${link.id}">Edit</button>
                                <button class="text-red-600 hover:text-red-900 ml-4 delete-button" data-id="${link.id}">Hapus</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    linksContainer.innerHTML = tableHTML;
}

// Fungsi untuk membuka dan menutup modal
function toggleModal(show, isEdit = false, link = null) {
    if (show) {
        linkForm.reset();
        modalError.classList.add('hidden');
        document.getElementById('link-id').value = '';
        if (isEdit && link) {
            modalTitle.textContent = 'Edit Link';
            document.getElementById('link-id').value = link.id;
            document.getElementById('original-url').value = link.original_url;
            document.getElementById('slug').value = link.slug;
            document.getElementById('expires-at').value = link.expires_at ? new Date(link.expires_at).toISOString().slice(0, 16) : '';
        } else {
            modalTitle.textContent = 'Tambah Link Baru';
        }
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalContent.classList.remove('scale-95', 'opacity-0');
        }, 10);
    } else {
        modal.classList.add('opacity-0');
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

// Event Listeners
addLinkButton.addEventListener('click', () => toggleModal(true));
cancelButton.addEventListener('click', () => toggleModal(false));
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        toggleModal(false);
    }
});

linkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    modalError.classList.add('hidden');
    saveButton.disabled = true;
    saveButton.textContent = 'Menyimpan...';

    const linkId = document.getElementById('link-id').value;
    const original_url = document.getElementById('original-url').value;
    let slug = document.getElementById('slug').value.trim();
    const expires_at = document.getElementById('expires-at').value || null;

    if (!slug) {
        slug = Math.random().toString(36).substring(2, 8);
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
        modalError.textContent = 'Slug hanya boleh berisi huruf, angka, tanda hubung (-), dan garis bawah (_).';
        modalError.classList.remove('hidden');
        saveButton.disabled = false;
        saveButton.textContent = 'Simpan';
        return;
    }

    const linkData = { original_url, slug, expires_at };
    let error;

    if (linkId) {
        ({ error } = await supabase.from('links').update(linkData).eq('id', linkId));
    } else {
        linkData.user_id = currentUser.id; // Hanya tambahkan user_id saat membuat link baru
        ({ error } = await supabase.from('links').insert([linkData]));
    }

    if (error) {
        console.error(error);
        modalError.textContent = error.message.includes('duplicate key value') 
            ? 'Slug ini sudah digunakan. Silakan pilih yang lain.' 
            : 'Terjadi kesalahan: ' + error.message;
        modalError.classList.remove('hidden');
    } else {
        toggleModal(false);
        fetchLinks();
    }
    
    saveButton.disabled = false;
    saveButton.textContent = 'Simpan';
});

linksContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-button')) {
        const id = e.target.dataset.id;
        if (confirm('Apakah Anda yakin ingin menghapus link ini secara permanen?')) {
            const { error } = await supabase.from('links').delete().eq('id', id);
            if (error) {
                alert('Gagal menghapus link: ' + error.message);
            } else {
                fetchLinks();
            }
        }
    }
    if (e.target.classList.contains('edit-button')) {
        const id = e.target.dataset.id;
        const { data: link, error } = await supabase.from('links').select('*').eq('id', id).single();
        if (error) {
            alert('Gagal mengambil data link: ' + error.message);
        } else {
            toggleModal(true, true, link);
        }
    }
});

logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/login.html';
});

// Jalankan checkAuth saat halaman dimuat
document.addEventListener('DOMContentLoaded', checkAuth);