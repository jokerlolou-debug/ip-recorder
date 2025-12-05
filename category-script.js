// Data untuk kategori terpilih
let currentCategory = null;
let recordsData = {};
let currentRecords = [];
let editingRecord = null;

// Inisialisasi semasa halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initializeCategory();
    loadRecords();
});

// Inisialisasi kategori
function initializeCategory() {
    // Pastikan pengguna telah log masuk
    if (sessionStorage.getItem('authenticated') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    currentCategory = sessionStorage.getItem('selectedCategory') || 'jenayah';
    
    const categoryNames = {
        jenayah: 'Jenayah',
        komersil: 'Komersil',
        narkotik: 'Narkotik',
        trafik: 'Trafik',
        pengurusan: 'Pengurusan',
        balai: 'Balai'
    };
    
    document.getElementById('categoryTitle').textContent = categoryNames[currentCategory];
    document.title = `IP RECORDER - ${categoryNames[currentCategory]}`;
}

// Muatkan rekod dari localStorage
function loadRecords() {
    if (localStorage.getItem('ipRecorderData')) {
        recordsData = JSON.parse(localStorage.getItem('ipRecorderData'));
    }
    
    currentRecords = recordsData[currentCategory] || [];
    displayRecords(currentRecords);
    updateStats();
}

// Paparkan rekod dalam jadual
function displayRecords(records) {
    const tbody = document.getElementById('recordsTableBody');
    const noResults = document.getElementById('noResults');
    
    tbody.innerHTML = '';
    
    if (records.length === 0) {
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    records.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.id}</td>
            <td>${record.ip}</td>
            <td><span class="status-badge status-${getStatusClass(record.status)}">${record.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="openEditModal(${record.id})">Edit</button>
                    <button class="btn-barcode" onclick="openBarcodeModal('${record.barcode}', '${record.ip}')">QR</button>
                    <button class="btn-print" onclick="printQR('${record.barcode}', '${record.ip}')">Cetak</button>
                    <button class="btn-delete" onclick="deleteRecord(${record.id})">Hapus</button>
                </div>
            </td>
            <td>${formatTimestamp(record.timestamp)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Format timestamp ISO kepada paparan yang mesra
function formatTimestamp(isoString) {
    if (!isoString) return '';
    try {
        const dt = new Date(isoString);
        // Format: YYYY-MM-DD HH:MM:SS
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        const hh = String(dt.getHours()).padStart(2, '0');
        const mm = String(dt.getMinutes()).padStart(2, '0');
        const ss = String(dt.getSeconds()).padStart(2, '0');
        return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
    } catch (e) {
        return isoString;
    }
}

// Dapatkan kelas CSS untuk status
function getStatusClass(status) {
    switch(status) {
        case 'Aktif': return 'active';
        case 'Tidak Aktif': return 'inactive';
        case 'Disiasat': return 'investigating';
        case 'Dipantau': return 'monitoring';
        default: return 'active';
    }
}

// Kemas kini statistik
function updateStats() {
    document.getElementById('totalRecords').textContent = currentRecords.length;
    
    const activeCount = currentRecords.filter(r => r.status === 'Aktif').length;
    document.getElementById('activeRecords').textContent = activeCount;
}

// Cari rekod
function searchRecords() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayRecords(currentRecords);
        return;
    }
    
    const filtered = currentRecords.filter(r => 
        r.ip.toLowerCase().includes(searchTerm) || 
        String(r.id).includes(searchTerm) ||
        r.barcode.toLowerCase().includes(searchTerm) ||
        r.status.toLowerCase().includes(searchTerm)
    );
    
    displayRecords(filtered);
}

// Buka modal edit
function openEditModal(recordId) {
    editingRecord = currentRecords.find(r => r.id === recordId);
    
    if (editingRecord) {
        document.getElementById('editIP').value = editingRecord.ip;
        document.getElementById('editStatus').value = editingRecord.status;
        document.getElementById('modalTitle').textContent = 'Edit Rekod';

        // Janakan QR code
        generateQR('editQR', editingRecord.barcode, 160);

        document.getElementById('editModal').style.display = 'block';
    }
}

// Buka modal untuk menambah rekod baru
function openAddModal() {
    editingRecord = null;
    document.getElementById('editIP').value = '';
    document.getElementById('editStatus').value = 'Aktif';
    document.getElementById('modalTitle').textContent = 'Tambah Rekod';

    const nextId = getNextId();
    const barcodeValue = `${currentCategory.toUpperCase().substring(0,3)}-${String(nextId).padStart(6,'0')}`;

    // Tunjukkan QR jangkaan untuk rekod baru
    generateQR('editQR', barcodeValue, 160);

    document.getElementById('editModal').style.display = 'block';
}

// Dapatkan ID seterusnya (maksimum 100000)
function getNextId() {
    if (!currentRecords || currentRecords.length === 0) return 1;
    const maxId = currentRecords.reduce((acc, r) => r.id > acc ? r.id : acc, 0);
    return maxId + 1;
}

// Tutup modal edit
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editingRecord = null;
}

// Simpan rekod yang telah diedit
function saveEditRecord() {
    const ipValue = document.getElementById('editIP').value.trim();
    const statusValue = document.getElementById('editStatus').value;

    if (!ipValue) {
        alert('Sila masukkan Nombor IP.');
        return;
    }

    if (editingRecord) {
        editingRecord.ip = ipValue;
        editingRecord.status = statusValue;
        // Kemas kini timestamp kepada masa kini
        editingRecord.timestamp = new Date().toISOString();
        
        // Simpan ke localStorage
        recordsData[currentCategory] = currentRecords;
        localStorage.setItem('ipRecorderData', JSON.stringify(recordsData));
        
        displayRecords(currentRecords);
        updateStats();
        closeEditModal();
        
        alert('Rekod berjaya dikemaskini!');
        return;
    }

    // Menambah rekod baru
    const newId = getNextId();
    if (newId > 100000) {
        alert('Tidak dapat menambah rekod: had 100000 telah dicapai.');
        return;
    }

    const newBarcode = `${currentCategory.toUpperCase().substring(0,3)}-${String(newId).padStart(6,'0')}`;
    const newRecord = {
        id: newId,
        ip: ipValue,
        status: statusValue,
        barcode: newBarcode,
        timestamp: new Date().toISOString()
    };

    currentRecords.push(newRecord);
    recordsData[currentCategory] = currentRecords;
    localStorage.setItem('ipRecorderData', JSON.stringify(recordsData));

    displayRecords(currentRecords);
    updateStats();
    closeEditModal();
    alert('Rekod baru berjaya ditambah!');
}

// Buka modal barcode
function openBarcodeModal(barcodeValue, ipAddress) {
    document.getElementById('barcodeText').textContent = `IP: ${ipAddress} | QR: ${barcodeValue}`;

    // Hasilkan QR penuh
    generateQR('fullQR', barcodeValue, 260);

    document.getElementById('barcodeModal').style.display = 'block';
}

// Tutup modal barcode
function closeBarcodeModal() {
    document.getElementById('barcodeModal').style.display = 'none';
}

// Hapus rekod
function deleteRecord(recordId) {
    if (confirm('Adakah anda pasti mahu menghapus rekod ini?')) {
        currentRecords = currentRecords.filter(r => r.id !== recordId);
        
        // Simpan ke localStorage
        recordsData[currentCategory] = currentRecords;
        localStorage.setItem('ipRecorderData', JSON.stringify(recordsData));
        
        displayRecords(currentRecords);
        updateStats();
        
        alert('Rekod berjaya dihapus!');
    }
}

// Kembali ke halaman utama
function goBack() {
    window.location.href = 'index.html';
}

function logoutFromCategory() {
    sessionStorage.removeItem('authenticated');
    sessionStorage.removeItem('selectedCategory');
    window.location.href = 'index.html';
}

// Tutup modal apabila klik di luar modal
window.onclick = function(event) {
    const editModal = document.getElementById('editModal');
    const barcodeModal = document.getElementById('barcodeModal');
    
    if (event.target === editModal) {
        editModal.style.display = 'none';
    }
    if (event.target === barcodeModal) {
        barcodeModal.style.display = 'none';
    }
}

// Membenarkan pencarian dengan menekan Enter
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('searchInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            searchRecords();
        }
    });
});

// Helper: jana QR code dalam elemen
function generateQR(elementId, text, size) {
    const container = document.getElementById(elementId);
    if (!container) return;
    // Kosongkan kandungan lama
    container.innerHTML = '';
    // Perpustakaan qrcode.js akan memasukkan elemen <img> atau <table>
    try {
        new QRCode(container, {
            text: String(text),
            width: size,
            height: size
        });
    } catch (e) {
        // jika ada ralat, tunjuk teks ringkas
        container.textContent = String(text);
    }
}

// Cetak QR: jana QR dalam container sementara, buka tetingkap cetak dan panggil print
function printQR(barcodeValue, ipAddress) {
    const tmpId = 'tmpPrintQR';
    let tmp = document.getElementById(tmpId);
    if (!tmp) {
        tmp = document.createElement('div');
        tmp.id = tmpId;
        tmp.style.position = 'fixed';
        tmp.style.left = '-9999px';
        tmp.style.top = '-9999px';
        document.body.appendChild(tmp);
    }
    tmp.innerHTML = '';
    // Generate a larger QR for printing
    generateQR(tmpId, barcodeValue, 400);

    // Wait a bit for QR to render
    setTimeout(() => {
        const img = tmp.querySelector('img');
        let contentHtml = '';
        if (img && img.src) {
            contentHtml = `<img src="${img.src}" style="max-width:100%;height:auto;">`;
        } else {
            // fallback: use innerHTML (table) if img not available
            contentHtml = tmp.innerHTML;
        }

        const w = window.open('', '_blank');
        const meta = `IP: ${ipAddress} | QR: ${barcodeValue}`;
        w.document.write(`<!doctype html><html><head><title>Print QR</title><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;font-family:Arial;} .meta{margin-top:12px;font-size:14px;color:#333;text-align:center;}</style></head><body>${contentHtml}<div class="meta">${meta}</div><script>window.onload=function(){setTimeout(()=>{window.print();},200);};</script></body></html>`);
        w.document.close();

        // Cleanup the temporary container after a short delay
        setTimeout(() => {
            if (tmp && tmp.parentNode) tmp.parentNode.removeChild(tmp);
        }, 2000);
    }, 300);
}

// Cetak QR yang dipaparkan di modal penuh
function printCurrentQR() {
    const full = document.getElementById('fullQR');
    if (!full) return;
    const img = full.querySelector('img');
    let contentHtml = '';
    if (img && img.src) {
        contentHtml = `<img src="${img.src}" style="max-width:100%;height:auto;">`;
    } else {
        contentHtml = full.innerHTML;
    }
    const barcodeText = document.getElementById('barcodeText')?.textContent || '';
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html><head><title>Print QR</title><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;font-family:Arial;} .meta{margin-top:12px;font-size:14px;color:#333;text-align:center;}</style></head><body>${contentHtml}<div class="meta">${barcodeText}</div><script>window.onload=function(){setTimeout(()=>{window.print();},200);};</script></body></html>`);
    w.document.close();
}
