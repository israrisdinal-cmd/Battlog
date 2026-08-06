// --- Konstanta & Helper Utama ---
const LOKASI_KEY = 'battlog_lokasi_history';

// Fungsi sanitasi lokasi dasar
function sanitizeLocation(loc) {
  if (!loc) return '';
  return String(loc).trim();
}

// Mengambil dan memvalidasi riwayat lokasi dari localStorage
function getLokasiHistory() {
  try {
    let rawStr = localStorage.getItem(LOKASI_KEY);
    if (!rawStr) return [];
    
    let raw = JSON.parse(rawStr);
    if (!Array.isArray(raw)) return [];
    
    // Pastikan hanya mengambil data berupa string dan bersih dari string objek
    return raw.filter(item => typeof item === 'string' && !item.includes('[object'));
  } catch (e) {
    return [];
  }
}

// Migrasi dan pembersihan data riwayat lokasi yang rusak atau format lama
function migrateLokasiHistoryObjects() {
  try {
    let rawStr = localStorage.getItem(LOKASI_KEY);
    if (!rawStr) return;
    
    let raw;
    try {
      raw = JSON.parse(rawStr);
    } catch (e) {
      // Jika JSON rusak total, reset ke array kosong
      localStorage.setItem(LOKASI_KEY, JSON.stringify([]));
      return;
    }

    // Jika bukan array, reset ke array kosong
    if (!Array.isArray(raw)) {
      localStorage.setItem(LOKASI_KEY, JSON.stringify([]));
      return;
    }

    // Bersihkan dan simpan kembali
    const cleaned = getLokasiHistory();
    localStorage.setItem(LOKASI_KEY, JSON.stringify(cleaned));
    console.log('[BattLog] Migrasi & pembersihan lokasi riwayat selesai.');
  } catch (e) {
    console.warn('[BattLog] Gagal migrasi lokasi history:', e.message);
  }
}

// Jalankan migrasi saat skrip dimuat
migrateLokasiHistoryObjects();

// Menyimpan lokasi baru ke riwayat
function saveLokasiToHistory(loc) {
  if (!loc) return;
  if (typeof loc !== 'string') loc = String(loc);
  loc = sanitizeLocation(loc);
  if (!loc || loc.includes('[object')) return;
  
  let hist = getLokasiHistory();
  // Hapus duplikat secara case-insensitive
  hist = hist.filter(item => String(item).toLowerCase() !== loc.toLowerCase());
  // Masukkan ke urutan teratas
  hist.unshift(loc);
  // Batasi maksimal 20 item tersimpan
  if (hist.length > 20) hist = hist.slice(0, 20);
  
  try {
    localStorage.setItem(LOKASI_KEY, JSON.stringify(hist));
    renderLokasiSuggestions();
  } catch (e) {
    console.warn('[BattLog] Gagal menyimpan riwayat lokasi:', e.message);
  }
}

// Mencegah kerusakan atribut HTML akibat karakter khusus / tanda kutip
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Merender elemen datalist saran lokasi
function renderLokasiSuggestions() {
  let datalist = document.getElementById('lokasi-suggestions');
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = 'lokasi-suggestions';
    document.body.appendChild(datalist);
  }
  const hist = getLokasiHistory();
  datalist.innerHTML = hist.map(loc => `<option value="${escapeHtml(loc)}">`).join('');
}

// Inisialisasi listener dan pengikatan elemen saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  migrateLokasiHistoryObjects();
  renderLokasiSuggestions();
  
  const inputLokasi = document.getElementById('f_lokasi');
  if (inputLokasi && !inputLokasi.getAttribute('list')) {
    inputLokasi.setAttribute('list', 'lokasi-suggestions');
  }
});