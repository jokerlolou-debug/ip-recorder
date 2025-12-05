// Inisialisasi data
let recordsData = {
    jenayah: [],
    komersil: [],
    narkotik: [],
    trafik: [],
    pengurusan: [],
    balai: []
};

// Inisialisasi semasa halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Jika sudah log masuk pada session semasa, teruskan muat data
    if (sessionStorage.getItem('authenticated') === 'true') {
        loadData();
        updateCategoryCounts();
    } else {
        // Tunjukkan overlay login
        showLoginOverlay();
        // Sediakan Enter key untuk input login
        const userInput = document.getElementById('loginUsername');
        const passInput = document.getElementById('loginPassword');
        if (userInput) userInput.addEventListener('keypress', function(e){ if (e.key === 'Enter') checkLogin(); });
        if (passInput) passInput.addEventListener('keypress', function(e){ if (e.key === 'Enter') checkLogin(); });
    }
});

// Valid credentials (client-side only)
const VALID_USERNAME = 'KOTET';
const VALID_PASSWORD = '12345';

function showLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    const home = document.getElementById('homeContent');
    if (overlay) overlay.style.display = 'flex';
    if (home) home.style.display = 'none';
}

function hideLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    const home = document.getElementById('homeContent');
    if (overlay) overlay.style.display = 'none';
    if (home) home.style.display = 'block';
}

function logout() {
    // Clear authentication and show login overlay again
    sessionStorage.removeItem('authenticated');
    // Clear any selected category
    sessionStorage.removeItem('selectedCategory');
    // Show overlay and hide content
    showLoginOverlay();
    const err = document.getElementById('loginError');
    if (err) err.textContent = '';
    // Clear login inputs
    const userInput = document.getElementById('loginUsername');
    const passInput = document.getElementById('loginPassword');
    if (userInput) userInput.value = '';
    if (passInput) passInput.value = '';
}

function checkLogin() {
    const user = (document.getElementById('loginUsername') || {}).value || '';
    const pass = (document.getElementById('loginPassword') || {}).value || '';
    const err = document.getElementById('loginError');
    if (user === VALID_USERNAME && pass === VALID_PASSWORD) {
        sessionStorage.setItem('authenticated', 'true');
        if (err) err.textContent = '';
        hideLoginOverlay();
        loadData();
        updateCategoryCounts();
    } else {
        if (err) err.textContent = 'Username atau password salah.';
    }
}

// Muatkan data dari localStorage
function loadData() {
    // Mulakan dengan set kosong untuk membenarkan pengguna menambah rekod manual
    recordsData = {
        jenayah: [],
        komersil: [],
        narkotik: []
    };

    // Timpa localStorage supaya semua jadual bermula kosong sebagaimana dikehendaki
    saveData();
}

// Janakan data sampel
function generateSampleData(category, count) {
    const statuses = ['Aktif', 'Tidak Aktif', 'Disiasat', 'Dipantau'];
    const data = [];
    
    for (let i = 1; i <= count; i++) {
        data.push({
            id: i,
            ip: generateRandomIP(),
            status: statuses[Math.floor(Math.random() * statuses.length)],
            barcode: `${category.toUpperCase().substring(0, 3)}-${String(i).padStart(6, '0')}`
        });
    }
    
    return data;
}

// Janakan IP rawak
function generateRandomIP() {
    return Array.from({length: 4}, () => Math.floor(Math.random() * 256)).join('.');
}

// Simpan data ke localStorage
function saveData() {
    localStorage.setItem('ipRecorderData', JSON.stringify(recordsData));
}

// Kemas kini bilangan rekod di kartu
function updateCategoryCounts() {
    document.getElementById('jenayah-count').textContent = recordsData.jenayah.length + ' rekod';
    document.getElementById('komersil-count').textContent = recordsData.komersil.length + ' rekod';
    document.getElementById('narkotik-count').textContent = recordsData.narkotik.length + ' rekod';
    // Kategori tambahan
    const trafikEl = document.getElementById('trafik-count');
    const pengurusanEl = document.getElementById('pengurusan-count');
    const balaiEl = document.getElementById('balai-count');
    if (trafikEl) trafikEl.textContent = recordsData.trafik.length + ' rekod';
    if (pengurusanEl) pengurusanEl.textContent = recordsData.pengurusan.length + ' rekod';
    if (balaiEl) balaiEl.textContent = recordsData.balai.length + ' rekod';
}

// Navigasi ke kategori
function goToCategory(category) {
    // Simpan kategori yang dipilih dalam sessionStorage
    sessionStorage.setItem('selectedCategory', category);
    
    // Buka halaman kategori
    window.location.href = 'category.html';
}
