window.Intl=window.Intl||{};Intl.t=function(s){return(Intl._locale&&Intl._locale[s])||s;};

// ===== NEXT BLOCK =====

// --- PUSAT DATA SIGAN (Terintegrasi) ---
const SIGAN_HUB_KEY = 'sigan_hub_data';
const SiganData = {
    save: (key, value) => {
        try{
            const data = JSON.parse(localStorage.getItem(SIGAN_HUB_KEY) || '{}');
            data[key] = value;
            try{ localStorage.setItem(SIGAN_HUB_KEY, JSON.stringify(data)); }catch(e){ console.warn('[SiGan Hub] quota penuh', e.message); }
            console.log(`SiGan: Menyimpan ${key} ke Hub`);
        }catch(e){ console.warn('[SiGan Hub] save fail', e.message); }
    },
    get: (key) => {
        try{
            const data = JSON.parse(localStorage.getItem(SIGAN_HUB_KEY) || '{}');
            return data[key];
        }catch(e){ return undefined; }
    }
};

function kirimDataBaterai(nilaiPersen) {
    if (nilaiPersen !== undefined && nilaiPersen !== null) {
        SiganData.save('persen_baterai', nilaiPersen);
        console.log("SiGan: Data baterai " + nilaiPersen + "% terkirim.");
    }
}

function simpanKeRiwayatHarianHub(entry, calc) {
    try {
        const RIWAYAT_HUB_KEY = 'sigan_riwayat_harian';
        let riwayatHub = JSON.parse(localStorage.getItem(RIWAYAT_HUB_KEY) || '[]');
        const dataBaru = {
            id: entry.id,
            date: entry.tanggal,
            km_awal: entry.km_awal,
            km_akhir: entry.km_akhir,
            dist: calc.jarak,
            batt_used: (entry.batt_awal - entry.batt_akhir),
            wh_per_km: calc.wh_per_km,
            amount: calc.biaya,
            note: `BattLog: ${entry.lokasi || 'Jalan'} (${entry.batt_awal}% ke ${entry.batt_akhir}%)`
        };
        riwayatHub = riwayatHub.filter(item => item.id !== entry.id);
        riwayatHub.unshift(dataBaru);
        localStorage.setItem(RIWAYAT_HUB_KEY, JSON.stringify(riwayatHub));
        console.log("SiGan: Riwayat harian tersinkronisasi ke Hub", dataBaru);
    } catch (e) {
        console.error("SiGan: Gagal menyinkronkan riwayat ke Hub", e);
    }
}

function kirimPesan(tujuan, isi) {
    const paket = {
        dari: 'BattLog',
        tujuan: tujuan, 
        pesan: isi,
        timestamp: new Date().getTime()
    };
    localStorage.setItem('sigan_hub', JSON.stringify(paket));
}

window.addEventListener('storage', (event) => {
    if (event.key === 'sigan_hub' && event.newValue) {
        try {
            const data = JSON.parse(event.newValue);
            if (data.tujuan === 'BattLog') {
                console.log("Pesan diterima dari " + data.dari + ": " + data.pesan);
                if(typeof showToast === 'function') {
                    showToast("Pesan dari " + data.dari + ": " + data.pesan, 'warning');
                }
            }
        } catch(e) { console.error("Error parsing hub data", e); }
    }
});

// ===== NEXT BLOCK =====

// Service Worker v1.5 - robust registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then(reg => {
          console.log('[BattLog SW] Terdaftar, scope:', reg.scope);
          // Check for updates periodically
          setInterval(() => reg.update().catch(()=>{}), 60 * 60 * 1000);
        })
        .catch(err => {
          console.warn('[BattLog SW] Gagal mendaftar (normal jika file:// atau offline):', err.message);
        });
    });
  }

// ===== NEXT BLOCK =====

// === MIGRASI OTOMATIS v1.0 -> v1.1 - BATTLOG & LAPKEU STANDARD ===
(function(){
  try{
    const map = {
      'maka_log_v1': 'battlog_log_v1',
      'maka_log_v1_lokasi_history': 'battlog_lokasi_history',
      'maka_cross_sigan_goride': 'lapkeu_cross_goride',
      'maka_cross_sigan_income': 'lapkeu_cross_income',
      'maka_cross_sigan_km': 'lapkeu_cross_km',
      'maka_cross_summary': 'battlog_summary',
      'sigan_cross_ev_cost': 'battlog_ev_cost',
      'sigan_riwayat_harian': 'battlog_riwayat_harian',
      'siganData': 'lapkeuData',
      'siganShiftData': 'lapkeu_shift',
      'siganGlobalTarget': 'lapkeu_global_target',
      'sigan_hub_data': 'lapkeu_hub_data',
      'sigan_hub_data_from_sigan': 'lapkeu_hub_from_lapkeu',
      'sigan_hub_last_update': 'lapkeu_hub_last_update',
      'maka_soh_baseline': 'battlog_soh_baseline',
      'maka_soh_baseline_is_fallback': 'battlog_soh_baseline_is_fallback',
      'maka_soh_total_samples': 'battlog_soh_total_samples',
      'maka_soh_history': 'battlog_soh_history',
      'maka_soh_ai': 'battlog_soh_ai',
      'maka_soh_ai_debug': 'battlog_soh_ai_debug',
      'maka_charger_history': 'battlog_charger_history',
      'maka_bms_history': 'battlog_bms_history',
      'maka_chat_id': 'battlog_chat_id',
      'factory_cap_kwh': 'battlog_factory_cap',
      'factory_range_km': 'battlog_factory_range',
      'factory_calib_km': 'battlog_factory_calib_km',
      'factory_calib_soh': 'battlog_factory_calib_soh',
      'sigan_universal_sync': 'lapkeu_universal_sync',
      'sigan_sempurna': 'lapkeu_sempurna',
    };
    for(let oldKey in map){
      let newKey = map[oldKey];
      try{
        if(!localStorage.getItem(newKey) && localStorage.getItem(oldKey)){
          localStorage.setItem(newKey, localStorage.getItem(oldKey));
          console.log('[MIGRASI] '+oldKey+' -> '+newKey);
        }
      }catch(e){}
    }
    // Migrasi isi lake
    try{
      let lakeRaw = localStorage.getItem('UNIVERSAL_LAKE_V1');
      if(lakeRaw){
        let lake = JSON.parse(lakeRaw); let changed=false;
        if(lake.sigan && !lake.lapkeu){ lake.lapkeu = lake.sigan; changed=true; }
        if(lake.maka && !lake.battlog){ lake.battlog = lake.maka; changed=true; }
        // cross keys
        if(lake.cross){
          const crossMap = {
            'maka_log_v1': 'battlog_log_v1',
            'maka_log_v1_lokasi_history': 'battlog_lokasi_history',
            'maka_cross_sigan_goride': 'lapkeu_cross_goride',
            'maka_cross_sigan_income': 'lapkeu_cross_income',
            'maka_cross_sigan_km': 'lapkeu_cross_km',
            'maka_cross_summary': 'battlog_summary',
            'sigan_cross_ev_cost': 'battlog_ev_cost',
            'sigan_riwayat_harian': 'battlog_riwayat_harian',
            'siganData': 'lapkeuData',
            'siganShiftData': 'lapkeu_shift',
            'siganGlobalTarget': 'lapkeu_global_target',
            'sigan_hub_data': 'lapkeu_hub_data',
            'sigan_hub_data_from_sigan': 'lapkeu_hub_from_lapkeu',
            'sigan_hub_last_update': 'lapkeu_hub_last_update',
            'maka_soh_baseline': 'battlog_soh_baseline',
            'maka_soh_baseline_is_fallback': 'battlog_soh_baseline_is_fallback',
            'maka_soh_total_samples': 'battlog_soh_total_samples',
            'maka_soh_history': 'battlog_soh_history',
            'maka_soh_ai': 'battlog_soh_ai',
            'maka_soh_ai_debug': 'battlog_soh_ai_debug',
            'maka_charger_history': 'battlog_charger_history',
            'maka_bms_history': 'battlog_bms_history',
            'maka_chat_id': 'battlog_chat_id',
            'factory_cap_kwh': 'battlog_factory_cap',
            'factory_range_km': 'battlog_factory_range',
            'factory_calib_km': 'battlog_factory_calib_km',
            'factory_calib_soh': 'battlog_factory_calib_soh',
            'sigan_universal_sync': 'lapkeu_universal_sync',
            'sigan_sempurna': 'lapkeu_sempurna',
          };
          for(let o in crossMap){ if(lake.cross[o] && !lake.cross[crossMap[o]]){ lake.cross[crossMap[o]] = lake.cross[o]; changed=true; } }
          if(lake.sigan){ for(let o in crossMap){ if(lake.sigan[o] && !lake.sigan[crossMap[o]]){ lake.sigan[crossMap[o]] = lake.sigan[o]; changed=true; } } }
        }
        if(changed){ localStorage.setItem('UNIVERSAL_LAKE_V1', JSON.stringify(lake)); console.log('[MIGRASI] Lake migrated'); }
      }
    }catch(e){}
  }catch(e){ console.log('migrasi err',e); }
})();

// ===== NEXT BLOCK =====

// === MONTHLY FILTER FOR BATTLOG v1.5.11 ===
    function generateEkonomiPeriodButtons(){
        const container = document.getElementById('ekonomiPeriodContainer');
        if(!container) return;
        const now = new Date();
        const months = [];
        // Hari Ini
        months.push({value: 'harian', label: 'Hari Ini', isActive: true});
        // Bulan ini + 2 bulan kebelakang
        for(let i=0; i<3; i++){
            let d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            let yyyy = d.getFullYear();
            let mm = String(d.getMonth()+1).padStart(2,'0');
            let value = `${yyyy}-${mm}`;
            let monthName = d.toLocaleDateString('id-ID', {month: 'short'});
            let label = `${monthName} ${yyyy}`;
            if(i===0) label = `${d.toLocaleDateString('id-ID', {month: 'long'})} (Bulan Ini)`;
            // Capitalize
            label = label.charAt(0).toUpperCase() + label.slice(1);
            months.push({value, label, isActive: false});
        }
        // Check existing data months to include if not in last 3
        try{
            let existingMonths = new Set();
            if(typeof entries !== 'undefined' && entries.length){
                entries.forEach(e=>{
                    if(e.tanggal && e.tanggal.length>=7){
                        existingMonths.add(e.tanggal.slice(0,7));
                    }
                });
            }
            existingMonths.forEach(ym=>{
                if(!months.find(m=>m.value===ym)){
                    let [y,m] = ym.split('-');
                    let d = new Date(parseInt(y), parseInt(m)-1, 1);
                    let label = d.toLocaleDateString('id-ID', {month: 'short', year: 'numeric'});
                    label = label.charAt(0).toUpperCase() + label.slice(1);
                    months.push({value: ym, label, isActive: false});
                }
            });
        }catch(e){}
        // Sort: harian first, then monthly descending, then all last
        const monthlyOnly = months.filter(m=>m.value!=='harian').sort((a,b)=>{
            if(a.value==='all' || b.value==='all') return 0;
            return b.value.localeCompare(a.value);
        });
        const finalMonths = [months.find(m=>m.value==='harian'), ...monthlyOnly.slice(0,4), {value: 'all', label: 'Semua', isActive: false}];
        
        container.innerHTML = '';
        finalMonths.forEach((m,idx)=>{
            if(!m) return;
            let btn = document.createElement('button');
            btn.className = 'pill' + (m.isActive ? ' active' : '');
            btn.textContent = m.label;
            btn.onclick = function(){ setEkonomiPeriod(m.value, this); };
            btn.dataset.value = m.value;
            container.appendChild(btn);
        });
        console.log('[BattLog Monthly] Buttons generated', finalMonths.map(m=>m.value));
    }
    // Generate on load
    document.addEventListener('DOMContentLoaded', generateEkonomiPeriodButtons);
    setTimeout(generateEkonomiPeriodButtons, 300);

// ===== NEXT BLOCK =====

(function(){
      const KEY='battlog_ringkas_hidden';
      window.toggleRingkas=function(){
        const box=document.getElementById('ringkasBox');
        const pills=document.getElementById('ringkasPills');
        const badge=document.getElementById('ringkasBadge');
        const btn=document.getElementById('btnToggleRingkas');
        if(!box) return;
        const isHidden=box.style.display==='none';
        if(isHidden){
          box.style.display='block';
          if(pills) pills.style.display='flex';
          if(badge) badge.style.display='none';
          if(btn) btn.innerHTML='👁️';
          localStorage.setItem(KEY,'0');
        } else {
          box.style.display='none';
          if(pills) pills.style.display='none';
          if(badge) badge.style.display='inline-block';
          if(btn) btn.innerHTML='🙈';
          localStorage.setItem(KEY,'1');
        }
      };
      // restore state
      try{
        const hidden=localStorage.getItem(KEY)==='1';
        if(hidden){
          setTimeout(()=>{
            const box=document.getElementById('ringkasBox');
            const pills=document.getElementById('ringkasPills');
            const badge=document.getElementById('ringkasBadge');
            const btn=document.getElementById('btnToggleRingkas');
            if(box){ box.style.display='none'; }
            if(pills){ pills.style.display='none'; }
            if(badge){ badge.style.display='inline-block'; }
            if(btn){ btn.innerHTML='🙈'; }
          }, 200);
        }
      }catch(e){}
    })();

// ===== NEXT BLOCK =====

// === CORE FIXED MINIMAL - LAYOUT TETAP, LOGIKA DIBENERIN ===
// === CONFIG TERPUSAT (V1.5) - ganti magic number di sini ===
const BATTLOG_CONFIG = {
  version: '1.5',
  defaultCapKwh: 4.0,
  defaultFactoryRangeKm: 115,
  defaultTarifRumah: 1444,
  defaultTarifSpklu: 2466,
  // AVG km/jam GoRide
  maxTripKmFromSigan: 100,          // filter odometer nyasar
  maxShiftDurationMin: 1080,        // 18 jam
  defaultMuterPct: 0.25,            // 25%
  maxMuterPct: 0.60,
  fallbackMuterPct: 0.30,
  maxAvgKmJam: 60,
  // SoH & efisiensi
  deepCycleMinDrop: 50,
  deepCycleMinKm: 10,
  deepCycleMaxBattEnd: 35,
  deepCycleMinBattAfter: 99,
  whKmClampMax: 80,
  // BMS default factors
  bmsFactorLargeCap: 1.1,
  bmsFactorFast: 1.38,
  bmsFactorNormal: 1.15,
  // localStorage safety
  maxHistoryItems: 500
};

const LS_KEY = 'battlog_log_v1';
const BMS_KEY = 'battlog_bms_history';
const SOH_KEY = 'battlog_soh_history';
let entries = []; try { entries = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch(e){}
let editId = null; let usageChart = null;
function isSpklu(e){ if(!e) return false; const t=String(e.tarif??''); const l=(e.lokasi||'').toLowerCase(); return t==='2466' || l.includes('spklu') || l.includes('spblu'); }
function sanitizeLocation(loc){ if(!loc) return ""; return loc.trim().toLowerCase().replace(/\b\w/g, c=>c.toUpperCase()); }
const API_BASE = 'https://maka-cavalry-bot.israrisdinal.workers.dev';
// SECURITY: Jangan hardcode chat_id. Hanya ambil dari Telegram WebApp atau localStorage yang sudah diset user.
const DEFAULT_CHAT_ID = null; // dulu: '1190249363' - dihapus untuk privasi

async function apiPost(entry, jamSelesaiDinamis=null){
  if(!API_BASE.includes('workers.dev')) return false;
  try{
    const chat_id = API_CHAT_ID; 
    let jam_selesai = jamSelesaiDinamis;
    if(!jam_selesai) {
      const jamSelesaiEl = document.getElementById('c_jam_selesai');
      jam_selesai = (jamSelesaiEl && jamSelesaiEl.textContent !== '–') ? jamSelesaiEl.textContent : null;
    }

    const res = await fetch(API_BASE + '/api/log', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({...entry, chat_id, jam_selesai}) 
    });
    return res.ok;
  }catch(e){ return false; }
}

let API_CHAT_ID = localStorage.getItem('battlog_chat_id') || DEFAULT_CHAT_ID;
if(!API_CHAT_ID){ console.warn('[BattLog] Tidak ada chat_id Telegram. Notifikasi Telegram dinonaktifkan sampai user login via Telegram Mini App.'); }

// === Safe localStorage helpers (quota protection) ===
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn('[BattLog] localStorage penuh. Mencoba membersihkan data lama...');
      try {
        // Hapus data non-kritis
        const keysToClean = ['battlog_soh_ai_debug', 'battlog_charger_history', 'battlog_lokasi_history'];
        keysToClean.forEach(k => localStorage.removeItem(k));
        // Trim entries jika terlalu banyak
        if (entries && entries.length > BATTLOG_CONFIG.maxHistoryItems) {
          entries = entries.slice(0, BATTLOG_CONFIG.maxHistoryItems);
          try{ localStorage.setItem(LS_KEY, JSON.stringify(entries)); }catch(_){}
        }
        localStorage.setItem(key, value);
        if (typeof showToast === 'function') showToast('Storage penuh - data lama dibersihkan', 'warning');
        return true;
      } catch (e2) {
        console.error('[BattLog] Gagal menulis setelah cleanup', e2);
        if (typeof showToast === 'function') showToast('Storage penuh! Hapus beberapa riwayat manual.', 'error');
        return false;
      }
    }
    console.error('[BattLog] localStorage error', e);
    return false;
  }
}

// === FIX V1.5.2: Atomic lake merge biar tidak tabrakan dengan Lapkeu ===
function battlogAtomicLakeMerge(section, key, value){
  try{
    const LAKE_KEY='UNIVERSAL_LAKE_V1';
    let raw=localStorage.getItem(LAKE_KEY);
    let lake=raw?JSON.parse(raw):{_updated:0,_sources:{},sigan:{},maka:{},cross:{},sigan:{},lapkeu:{},battlog:{}};
    lake.sigan=lake.sigan||{}; lake.maka=lake.maka||{}; lake.cross=lake.cross||{}; lake._sources=lake._sources||{};
    lake.battlog=lake.battlog||lake.maka||{};
    lake.lapkeu=lake.lapkeu||lake.sigan||{};
    if(!lake[section]) lake[section]={};
    lake[section][key]=value;
    lake._updated=Date.now();
    lake._sources['battlog_v1_5_2']=Date.now();
    lake._source=Object.keys(lake._sources).join('+');
    try{ localStorage.setItem(LAKE_KEY, JSON.stringify(lake)); return true; }catch(e){ console.warn('[BattLog Lake] quota', e.message); return false; }
  }catch(e){ console.warn('[BattLog Lake] merge fail', e.message); return false; }
}

function safeGetItem(key, fallback = null) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (e) {
    return fallback;
  }
}
if(window.Telegram && window.Telegram.WebApp){ const w=window.Telegram.WebApp; w.ready(); w.expand(); if(w.initDataUnsafe && w.initDataUnsafe.user){ const u=w.initDataUnsafe.user; const tid=String(u.id||''); if(tid){ API_CHAT_ID=tid; localStorage.setItem('battlog_chat_id',tid); const d=document.getElementById('user-display'); if(d) d.textContent=`User: ${u.first_name||'Driver'} (${tid})`; } } else { const d=document.getElementById('user-display'); if(d) d.textContent='User: Mode Browser Offline'; } }

function showToast(msg,type='error'){ let c=document.getElementById('toast-container'); if(!c){ c=document.createElement('div'); c.id='toast-container'; document.body.appendChild(c);} const t=document.createElement('div'); t.className='maka-toast'; t.style.background=type==='error'?'#ff4d4d':(type==='warning'?'#ffdd53':'#2b8cff'); if(type==='warning') t.style.color='#0a1328'; t.textContent=msg; c.appendChild(t); setTimeout(()=>t.classList.add('show'),10); setTimeout(()=>{t.classList.remove('show'); setTimeout(()=>t.remove(),300);},3000); }
function bukaPeta(){ window.open("https://goo.gl/maps/NnLBbg1efPnP4f4f7?g_st=aw","_blank"); }
function switchView(name){ try{ document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); const el=document.getElementById('view-'+name); if(!el){ showToast('View tidak ditemukan: '+name,'error'); return;} el.classList.add('active'); document.querySelectorAll('.nav-item').forEach(n=>{ const oc=n.getAttribute('onclick')||''; n.classList.toggle('active',oc.includes("'"+name+"'")); }); document.getElementById('app')?.scrollTo({top:0, behavior:'instant'}); if(name==='riwayat'){ renderRingkas(); renderList(); } if(name==='dasbor'){ renderDasbor(); if(usageChart) setTimeout(()=>{try{usageChart.resize()}catch(e){}},50);} }catch(err){ showToast('switchView error: '+err.message,'error'); } }

function readForm(){ const g=id=>document.getElementById(id); const v_tarif=parseFloat(g('f_tarif').value); let v_cap; if(editId){ const orig=entries.find(x=>x.id===editId); v_cap=(orig&&Number(orig.cap_kwh)>0)?Number(orig.cap_kwh):(parseFloat(localStorage.getItem('battlog_factory_cap'))||4.0);} else { v_cap=parseFloat(localStorage.getItem('battlog_factory_cap'))||4.0; } return { cap_kwh:v_cap, tanggal:g('f_tanggal').value||new Date().toISOString().slice(0,10), km_awal:parseFloat(g('f_km_awal').value)||0, km_akhir:parseFloat(g('f_km_akhir').value)||0, batt_awal:parseFloat(g('f_batt_awal').value)||0, batt_akhir:parseFloat(g('f_batt_akhir').value)||0, batt_setelah:parseFloat(g('f_batt_setelah').value)||100, tarif:isNaN(v_tarif)?1444:v_tarif, biaya:g('f_biaya').value!==""?parseFloat(g('f_biaya').value):null, lokasi:sanitizeLocation(g('f_lokasi').value), charger:g('f_charger')?g('f_charger').value.trim():'', notif_status:g('f_notif_status')?g('f_notif_status').checked:true }; }

function calcEntry(e){ if(e.sumber==='battlog_auto_sync' || e.isSynthetic) return {jarak:0, energi_terpakai:0, energi_tepakai:0, wh_per_km:0, biaya:0, targetCas:100}; const cap=Number(e.cap_kwh)||4.0; const jarak=Math.max(0,(Number(e.km_akhir)||0)-(Number(e.km_awal)||0)); const used=Math.max(0,(Number(e.batt_awal)||0)-(Number(e.batt_akhir)||0)); const energi= (used/100)*cap; const wh=jarak>0?(energi*1000/jarak):0; let target=Number(e.batt_setelah)||100; const charged=Math.max(0,target-(Number(e.batt_akhir)||0)); const diisi=(charged/100)*cap; let biaya=0; if(e.biaya!==null&&e.biaya!==undefined) biaya=Number(e.biaya); else biaya=diisi*(Number(e.tarif)||0); return {jarak:+jarak.toFixed(2), energi_terpakai:energi, wh_per_km:wh, energi_diisi:diisi, biaya, targetCas:target}; }

function getCalibratedBmsFactor(spec){ if(!spec) return null; const key=spec.toLowerCase().replace(/\s+/g,''); try{ const d=localStorage.getItem(BMS_KEY); if(!d) return null; const p=JSON.parse(d); if(Array.isArray(p)) return null; const h=p[key]||[]; if(h.length>0){ const tot=h.reduce((a,b)=>a+b,0); return tot/h.length; } }catch(e){} return null; }
function renderCapDisplay(ov){ const el=document.getElementById('cap_kwh_display'); if(!el) return; const v=ov||parseFloat(localStorage.getItem('battlog_factory_cap'))||4.0; el.textContent=Number(v).toFixed(1)+' kWh'; }
function toggleSohSettings(){ const p=document.getElementById('soh_settings_panel'); const will=p.style.display==='none'; p.style.display=will?'block':'none'; if(will){ const capEl=document.getElementById('f_factory_cap'); const rangeEl=document.getElementById('f_factory_range'); const ck=document.getElementById('f_calib_km'); const cs=document.getElementById('f_calib_soh'); const sCap=localStorage.getItem('battlog_factory_cap'); const sRange=localStorage.getItem('battlog_factory_range'); const sCk=localStorage.getItem('battlog_factory_calib_km'); const sCs=localStorage.getItem('battlog_factory_calib_soh'); if(sCap) capEl.value=sCap; else if(entries.length){ const f=entries.find(e=>Number(e.cap_kwh)>0); if(f) capEl.value=f.cap_kwh; } if(sRange) rangeEl.value=sRange; if(sCk&&ck) ck.value=sCk; if(sCs&&cs) cs.value=sCs; } }
function saveFactorySpec(){ const cap=parseFloat(document.getElementById('f_factory_cap').value); const range=parseFloat(document.getElementById('f_factory_range').value); const ck=parseFloat(document.getElementById('f_calib_km')?.value); const cs=parseFloat(document.getElementById('f_calib_soh')?.value); if(!cap||cap<=0||!range||range<=0){ showToast('Isi kapasitas & jarak pabrik dengan angka valid dulu ya.','error'); return; } localStorage.setItem('battlog_factory_cap',cap.toString()); localStorage.setItem('battlog_factory_range',range.toString()); if(!isNaN(ck)&&ck>0&&!isNaN(cs)&&cs>0&&cs<=100){ localStorage.setItem('battlog_factory_calib_km',ck.toString()); localStorage.setItem('battlog_factory_calib_soh',cs.toString()); } else { localStorage.removeItem('battlog_factory_calib_km'); localStorage.removeItem('battlog_factory_calib_soh'); } document.getElementById('soh_settings_panel').style.display='none'; renderCapDisplay(); kalibrasiSohMover(); updateLiveCalc(); showToast('Pengaturan disimpan.','success'); }

function kalibrasiSohMover(){
  if(!localStorage.getItem('battlog_factory_cap')&&entries.length){ const f=entries.find(e=>Number(e.cap_kwh)>0); if(f) localStorage.setItem('battlog_factory_cap',f.cap_kwh.toString()); }
  const FACTORY_RANGE=parseFloat(localStorage.getItem('battlog_factory_range'))||115; const FACTORY_KM_PER_PCT=FACTORY_RANGE/100;
  if(!entries.length){ localStorage.setItem(SOH_KEY,JSON.stringify([])); localStorage.setItem('battlog_soh_baseline_is_fallback','1'); return; }
  const isDeepValid=(e)=>{ const ba=parseFloat(e.batt_awal)||0, bk=parseFloat(e.batt_akhir)||0, bs=parseFloat(e.batt_setelah)||0, jarak=(parseFloat(e.km_akhir)||0)-(parseFloat(e.km_awal)||0); const delta=ba-bk; const isCharge=(bk<=40&&bs>=95); const isDis=(delta>=40&&jarak>5); if(!isCharge||!isDis) return null; const kmPerPct=jarak/delta; if(kmPerPct<0.4||kmPerPct>2.5) return null; return kmPerPct; }; // FIX v1.5.11: threshold turun 50->40, charge 35/99->40/95 biar kalibrasi
  let all=[]; entries.forEach(e=>{ const v=isDeepValid(e); if(v!==null) all.push(v); });
  const sorted=[...entries].sort((a,b)=>new Date(a.tanggal||0)-new Date(b.tanggal||0)); let oldestValid=[]; sorted.forEach(e=>{ const v=isDeepValid(e); if(v!==null) oldestValid.push(v); });
  const hasBaseline=oldestValid.length>=3; let baseline=FACTORY_KM_PER_PCT; if(hasBaseline){ const take=Math.max(1,Math.floor(oldestValid.length*0.5)); const first=oldestValid.slice(0,take); baseline=first.reduce((a,b)=>a+b,0)/first.length; }
  localStorage.setItem('battlog_soh_baseline',baseline.toFixed(4)); localStorage.setItem('battlog_soh_baseline_is_fallback',hasBaseline?'0':'1'); localStorage.setItem('battlog_soh_total_samples',all.length.toString()); localStorage.setItem(SOH_KEY,JSON.stringify(all));
}

function hitungSoHAI(){
  try{
    const FACTORY_CAP=parseFloat(localStorage.getItem('battlog_factory_cap'))||4.0; const calibKm=parseFloat(localStorage.getItem('battlog_factory_calib_km')); const calibSoh=parseFloat(localStorage.getItem('battlog_factory_calib_soh')); if(!entries||!entries.length) return null;
    let maxOdo=0, whList=[], fast=0, slow=0, parsial=[]; entries.forEach(e=>{ try{ if(e.sumber==='battlog_auto_sync' || e.isSynthetic) return; const c=calcEntry(e); const ka=parseFloat(e.km_akhir)||0; if(ka>maxOdo) maxOdo=ka; if(c.jarak>0&&c.wh_per_km>0) whList.push(c.wh_per_km); const ch=(e.charger||'').toLowerCase(); const mm=ch.match(/(\d+(?:\.\d+)?)\s*ah/); const ah=mm?parseFloat(mm[1]):0; if(ah>=20) fast++; else if(ah>0) slow++; const bAk=parseFloat(e.batt_akhir)||0, bSe=parseFloat(e.batt_setelah)||0; if(bSe>bAk){ const d=bSe-bAk; const kwh=c.energi_diisi||0; if(d>=30&&kwh>0.2){ const cr=kwh/(d/100); if(cr>FACTORY_CAP*0.5&&cr<FACTORY_CAP*1.5) parsial.push(cr); } } }catch(_){} });
    const avgWh=whList.length?whList.reduce((a,b)=>a+b,0)/whList.length:35; const odo=maxOdo; const totalKwh=odo>0?(odo*avgWh/1000):0; const eq=FACTORY_CAP>0?totalKwh/FACTORY_CAP:0; const totalCh=fast+slow||1; const faktorC=(slow/totalCh)*0.85+(fast/totalCh)*1.18; const faktorSuhu=1.2, faktorDoD=0.85; // FIX v1.5.11: suhu 1.8->1.2 realistis tropis const degPerCycleLab=0.0067*faktorC*faktorSuhu*faktorDoD;
    let umurHari=400; try{ const oldest=[...entries].sort((a,b)=>new Date(a.tanggal)-new Date(b.tanggal))[0]; if(oldest) umurHari=Math.max(30,Math.floor((Date.now()-new Date(oldest.tanggal).getTime())/86400000)); }catch(_){}
    let sohFinal; if(!isNaN(calibKm)&&!isNaN(calibSoh)&&calibKm>0&&odo>0){ const deltaKm=Math.max(0,odo-calibKm); const eqAtCalib=(calibKm*avgWh/1000)/FACTORY_CAP; const degTotalAtCalib=100-calibSoh; const degCycleAtCalib=degTotalAtCalib*0.85; const degPerCycleReal=eqAtCalib>0?degCycleAtCalib/eqAtCalib:degPerCycleLab; const degPerCycleBlend=degPerCycleLab*0.2+degPerCycleReal*0.8; const deltaKwh=deltaKm*avgWh/1000; const deltaCycle=deltaKwh/FACTORY_CAP; const degKalDelta=0.008*(umurHari*(deltaKm/Math.max(1,odo)))*0.5; const penurunan=(deltaCycle*degPerCycleBlend)+degKalDelta; sohFinal=calibSoh-penurunan; localStorage.setItem('battlog_soh_ai_debug',JSON.stringify({deltaKm,deltaCycle:deltaCycle.toFixed(2),degPerCycleBlend:degPerCycleBlend.toFixed(5),penurunan:penurunan.toFixed(3)})); } else { const degKal=0.008*umurHari*0.9; sohFinal=100-(eq*degPerCycleLab)-degKal; }
    // FIX V1.5.11 SOH-FIX-SOH: parsial hanya dipakai kalau BELUM ada kalibrasi manual
    if(parsial.length>=3 && isNaN(calibKm)){ const avgCap=parsial.slice(-10).reduce((a,b)=>a+b,0)/Math.min(10,parsial.length); const sohP=(avgCap/FACTORY_CAP)*100; sohFinal=sohFinal*0.4+sohP*0.6; }
    // FIX V1.5.11 SOH-FIX-SOH: SoH tidak boleh melebihi kalibrasi jika odo sudah lewat kalibrasi
    if(!isNaN(calibKm)&&!isNaN(calibSoh)){
      if(odo>=calibKm && sohFinal>calibSoh){ sohFinal=calibSoh-0.01; }
      if(odo<calibKm){
        if(sohFinal < calibSoh) sohFinal = calibSoh;
        if(sohFinal > 100) sohFinal = 100;
      }
    }
    sohFinal=Math.min(100,Math.max(50,sohFinal)); localStorage.setItem('battlog_soh_ai',sohFinal.toFixed(2)); const elSoh=document.getElementById('stat_soh'), elProg=document.getElementById('soh_progress'), elNote=document.getElementById('soh_note'); if(elSoh&&elProg){ elSoh.textContent=sohFinal.toFixed(1)+'%'; elProg.style.width=sohFinal+'%'; if(sohFinal>=95) elSoh.style.color='#7dffb7'; else if(sohFinal>=85) elSoh.style.color='#2b8cff'; else elSoh.style.color='#ff4d4d'; let note=`AI: Odo ${Math.round(odo)}km • Selisih ${(odo-(calibKm||0)).toFixed(0)}km dari kalib • ${avgWh.toFixed(0)}Wh/km`; if(!isNaN(calibKm)) note+=` • Kalib ${calibKm}km/${calibSoh}%`; if(elNote) elNote.textContent=note; } return sohFinal; }catch(e){ console.log('SoH AI err',e.message); return null; }
}

function hitungPrediksiAIWhKm(filtered){
  let source=filtered&&filtered.length?filtered:entries; const valid=source.filter(e=>{ try{ const c=calcEntry(e); return c.wh_per_km>0&&c.wh_per_km<200; }catch(e){return false;} }); if(valid.length===0) return 0; const take=Math.min(valid.length,(typeof ekonomiPeriod!=='undefined'&&ekonomiPeriod==='harian')?3:7); const list=valid.slice(0,take).reverse(); let totB=0, totW=0; list.forEach((e,idx)=>{ const c=calcEntry(e); const b=idx+1; totW+=c.wh_per_km*b; totB+=b; }); return totB?totW/totB:0;
}
function getPeriodeLabel(){ 
        if(typeof ekonomiPeriod==='undefined') return 'SEMUA'; 
        if(ekonomiPeriod.includes('-')){
            try{
                const [y,m] = ekonomiPeriod.split('-');
                const d = new Date(parseInt(y), parseInt(m)-1, 1);
                let label = d.toLocaleDateString('id-ID', {month: 'long', year: 'numeric'});
                return label.charAt(0).toUpperCase() + label.slice(1);
            }catch(e){
                return ekonomiPeriod;
            }
        }
        const map={harian:'HARI INI','7hari':'7 HARI','14hari':'14 HARI','30hari':'30 HARI',all:'SEMUA'}; 
        return map[ekonomiPeriod]||ekonomiPeriod.toUpperCase(); 
    }

// v2.7.2: AVG km/jam dari odometer yang masuk ke jam onbid GoRide SiGan (jam_awal - jam_akhir per order)
// Sesuai ide user: SiGan nanti kirim jam_awal & jam_akhir, BattLog cocokan odometer yang masuk ke jam itu
function parseJamMenit(str){
  if(!str) return null;
  const s=String(str).trim();
  const m=s.match(/(\d{1,2})[:.](\d{2})/);
  if(!m) return null;
  let h=parseInt(m[1],10), mm=parseInt(m[2],10);
  if(isNaN(h)||isNaN(mm)) return null;
  if(h<0||h>23||mm<0||mm>59) return null;
  return h*60+mm;
}
function getSiganOrdersWithJam(){
  let orders=[];
  try{
    let rawFix=localStorage.getItem('lapkeu_cross_goride');
    if(rawFix){ try{ let p=JSON.parse(rawFix); if(Array.isArray(p)) orders=p; else if(p.data&&Array.isArray(p.data)) orders=p.data; }catch(e){} }
    if(!orders.length){
      let raw=localStorage.getItem('lapkeuData');
      if(raw){ let p=JSON.parse(raw); if(Array.isArray(p)) orders=p; else if(p.data&&Array.isArray(p.data)) orders=p.data; }
    }
    if(!orders.length){
      let lakeRaw=localStorage.getItem('UNIVERSAL_LAKE_V1');
      if(lakeRaw){
        let lake=JSON.parse(lakeRaw);
        if(lake.cross&&Array.isArray(lake.cross.maka_cross_sigan_goride) && lake.cross.maka_cross_sigan_goride.length) orders=lake.cross.maka_cross_sigan_goride;
        else if(lake.sigan&&Array.isArray(lake.sigan.siganData) && lake.sigan.siganData.length) orders=lake.sigan.siganData;
        else if(lake.cross&&Array.isArray(lake.cross.siganData)) orders=lake.cross.siganData;
        else if(lake.cross&&lake.cross.sigan_hub_data_from_sigan&&Array.isArray(lake.cross.sigan_hub_data_from_sigan.siganData)) orders=lake.cross.sigan_hub_data_from_sigan.siganData;
      }
    }
  }catch(e){ orders=[]; }
  return orders.map(o=>{
    const tanggal=o.tanggal||o.date||o.tgl||o.tanggal_ocr||'';
    let ja=o.jam_awal||o.jam_mulai||o.waktu_mulai||o.start||o.jam_start||o.time||null;
    let jk=o.jam_akhir||o.jam_selesai||o.waktu_selesai||o.end||o.jam_end||o.endTime||o.predictedEndTime||null;
    if(!ja&&jk&&String(jk).includes('-')){
      const parts=String(jk).split('-'); if(parts.length>=2){ ja=parts[0].trim(); jk=parts[1].trim(); }
    }
    if(o.jam&&String(o.jam).includes('-')&&!ja){
      const parts=String(o.jam).split('-'); if(parts.length>=2){ ja=parts[0].trim(); jk=parts[1].trim(); }
    }
    // FIX V1.5: hapus km_akhir (odometer) dari jarak trip, cap max 100km biar tidak kehitung odometer nyasar
    let rawKm = o.km||o.jarak_km||o.jarak||o.dist||o.distance||0;
    // cari yang masuk akal <100
    let km = Number(rawKm)||0;
    if(km>BATTLOG_CONFIG.maxTripKmFromSigan){
      // coba cari field lain yang lebih kecil
      let candidates=[o.dist,o.jarak,o.jarak_km,o.km,o.distance].map(v=>Number(v)||0).filter(v=>v>0&&v<=100);
      km = candidates.length?candidates[0]:0;
    }
    return {tanggal, jam_awal:ja, jam_akhir:jk, km, raw:o, date:o.date||tanggal};
  }).filter(o=>o.tanggal||o.date);
}




function parseTglRobust(str){
  if(!str) return null;
  str=String(str).trim();
  // YYYY-MM-DD
  let m=str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if(m){ return new Date(Number(m[1]), Number(m[2])-1, Number(m[3])); }
  // DD-MM-YYYY or DD/MM/YYYY
  let m2=str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if(m2){ return new Date(Number(m2[3]), Number(m2[2])-1, Number(m2[1])); }
  let d=new Date(str);
  return isNaN(d.getTime())?null:d;
}
function hitungAvgKmJamGoride(filtered){
  try{
    let source=filtered&&filtered.length?filtered:entries;
    let ordersGoride=getSiganOrdersWithJam(); // Goride only
    let ordersAll=getSiganOrdersForBattlog(); // all services
    let anchor=new Date(); anchor.setHours(0,0,0,0);
    let cutoff3=new Date(anchor); cutoff3.setDate(anchor.getDate()-2);

    // FIX V1.5: parsing tanggal robust YYYY-MM-DD & DD-MM-YYYY
    let gorideLast3=ordersGoride.filter(o=>{
      try{
        let d=parseTglRobust(o.tanggal); if(!d) return false;
        d.setHours(0,0,0,0);
        return d>=cutoff3 && d<=anchor;
      }catch(e){return false;}
    });
    if(gorideLast3.length===0 && ordersGoride.length>0){
      // fallback ambil 3 tanggal terbaru berdasarkan tanggal asli, bukan sort string
      let uniqDates=[...new Set(ordersGoride.map(o=>o.tanggal))].filter(Boolean)
        .map(t=>({raw:t, date:parseTglRobust(t)}))
        .filter(x=>x.date)
        .sort((a,b)=>b.date-a.date).slice(0,3).map(x=>x.raw);
      if(uniqDates.length===0) uniqDates=[...new Set(ordersGoride.map(o=>o.tanggal))].sort().reverse().slice(0,3);
      gorideLast3=ordersGoride.filter(o=>uniqDates.includes(o.tanggal));
    }
    let allLast3=ordersAll.filter(o=>{
      try{
        let d=parseTglRobust(o.tanggal||o.date); if(!d) return false;
        d.setHours(0,0,0,0);
        return d>=cutoff3 && d<=anchor;
      }catch(e){return false;}
    });
    if(allLast3.length===0 && ordersAll.length>0){
      let uniqDates=[...new Set(ordersAll.map(o=>o.tanggal||o.date))].filter(Boolean)
        .map(t=>({raw:t, date:parseTglRobust(t)}))
        .filter(x=>x.date)
        .sort((a,b)=>b.date-a.date).slice(0,3).map(x=>x.raw);
      if(uniqDates.length===0) uniqDates=[...new Set(ordersAll.map(o=>o.tanggal||o.date))].sort().reverse().slice(0,3);
      allLast3=ordersAll.filter(o=>uniqDates.includes(o.tanggal||o.date));
    }

    // === WAKTU EFEKTIF GORIDE (Σ jam akhir - jam awal) ===
    let totalJamGoride=0;
    let jamPerTglGoride={};
    gorideLast3.forEach(o=>{
      const sMin=parseJamMenit(o.jam_awal);
      const eMin=parseJamMenit(o.jam_akhir);
      if(sMin===null||eMin===null) return;
      let dur=eMin-sMin; if(dur<0) dur+=24*60; 
      // FIX V1.5: naikkan cap 12 jam -> 18 jam (1080 menit) biar shift panjang tidak kebuang
      if(dur<=0||dur>BATTLOG_CONFIG.maxShiftDurationMin) return;
      totalJamGoride+=dur/60;
      if(!jamPerTglGoride[o.tanggal]) jamPerTglGoride[o.tanggal]=0;
      jamPerTglGoride[o.tanggal]+=dur/60;
    });

    // === WAKTU ONLINE TOTAL (semua layanan) 3 hari ===
    let totalJamOnline=0;
    allLast3.forEach(o=>{
      const sMin=parseJamMenit(o.jam_awal);
      const eMin=parseJamMenit(o.jam_akhir);
      if(sMin===null||eMin===null) return;
      let dur=eMin-sMin; if(dur<0) dur+=24*60; 
      if(dur<=0||dur>BATTLOG_CONFIG.maxShiftDurationMin) return;
      totalJamOnline+=dur/60;
    });
    // fallback online dari shift
    if(totalJamOnline<=0.01){
      try{
        let shiftRaw=localStorage.getItem('lapkeu_shift');
        if(shiftRaw){
          let sd=JSON.parse(shiftRaw);
          Object.keys(jamPerTglGoride).forEach(tgl=>{
            let sh=sd[tgl];
            if(sh&&sh.start&&sh.end){
              let s=parseJamMenit(sh.start), e=parseJamMenit(sh.end);
              if(s!==null&&e!==null){ let d=e-s; if(d<0) d+=1440; totalJamOnline+=d/60; }
            }
          });
        }
      }catch(e){}
    }
    // FIX V1.5: jika hanya Goride, online = goride (ratio 1), bukan *1.5
    if(totalJamOnline<=0.01) totalJamOnline = totalJamGoride>0? totalJamGoride : 0;

    // === KM SESI BATTLOG di tanggal yang ada Goride ===
    let evPerTgl={};
    source.forEach(e=>{ if(!e.tanggal) return; if(!evPerTgl[e.tanggal]) evPerTgl[e.tanggal]=[]; evPerTgl[e.tanggal].push(e); });
    let commonDates=Object.keys(jamPerTglGoride);
    if(commonDates.length===0) commonDates=Object.keys(evPerTgl).sort().reverse().slice(0,3);

    let totalSesiKm=0;
    commonDates.forEach(tgl=>{
      (evPerTgl[tgl]||[]).forEach(ev=>{ try{ totalSesiKm+=calcEntry(ev).jarak||0; }catch(e){} });
    });

    // Total km Gojek Goride 3 hari
    let totalKmGojekGoride=0;
    gorideLast3.forEach(o=>{ 
      let k=Number(o.km||0);
      if(k>0 && k<=100) totalKmGojekGoride+=k; // FIX: filter km wajar
    });

    // Total km semua Lapkeu 3 hari (untuk hitung muter %)
    let totalKmAllLapkeu=0;
    allLast3.forEach(o=>{ 
      let k=Number(o.km||o.jarak_km||0);
      if(k>0 && k<=100) totalKmAllLapkeu+=k;
    });

    let avgMuterPct=0;
    if(totalSesiKm>0 && totalKmAllLapkeu>0){
      avgMuterPct=(totalSesiKm-totalKmAllLapkeu)/totalSesiKm;
      if(avgMuterPct<0) avgMuterPct=0;
      if(avgMuterPct>BATTLOG_CONFIG.maxMuterPct) avgMuterPct=BATTLOG_CONFIG.fallbackMuterPct; // FIX V1.5: cap 60% dan fallback dinamis 30% bukan 40.7% magic
    } else {
      avgMuterPct=BATTLOG_CONFIG.defaultMuterPct; // dari CONFIG
    }

    // === 2 CARA HITUNG KM REAL GORIDE ===
    let kmGorideRealProp=0;
    if(totalSesiKm>0 && totalJamOnline>0 && totalJamGoride>0){
      kmGorideRealProp=totalSesiKm * (totalJamGoride/totalJamOnline);
    }
    let kmGorideRealMurni=totalKmGojekGoride * (1+avgMuterPct);

    // FIX V1.5: ambil max prop vs murni, jangan lebih kecil dari tagihan
    let kmFinal=0;
    if(kmGorideRealProp>0 && kmGorideRealMurni>0) kmFinal=Math.max(kmGorideRealProp, kmGorideRealMurni);
    else kmFinal=kmGorideRealProp>0?kmGorideRealProp:kmGorideRealMurni;
    if(kmFinal < totalKmGojekGoride) kmFinal=kmGorideRealMurni;

    let avg=totalJamGoride>0?kmFinal/totalJamGoride:0;
    avg=Math.min(Math.max(avg,0),60);
    if(avg<=0.01 && kmFinal>0) avg=25;

    window._avgDebug={totalJamGoride, totalJamOnline, totalSesiKm, totalKmGojekGoride, totalKmAllLapkeu, kmGorideRealProp, kmGorideRealMurni, kmFinal, avg, commonDates, avgMuterPct};

    let detail=commonDates.map(tgl=>{
      let sesiKm=(evPerTgl[tgl]||[]).reduce((a,ev)=>{ try{return a+(calcEntry(ev).jarak||0);}catch(e){return a;}},0);
      return {tgl, jarak:sesiKm, jam:jamPerTglGoride[tgl]||0, mode:'PROP'};
    });

    return {
      avg, 
      totalKmMasuk:kmFinal, 
      totalJam:totalJamGoride, 
      isFresh:true, 
      usedDateLabel: commonDates.join(', ')+' (V1.5 FIX: '+kmFinal.toFixed(1)+' km / '+totalJamGoride.toFixed(2)+' jam, muter '+(avgMuterPct*100).toFixed(1)+'%)',
      detail, 
      jamPerTgl:jamPerTglGoride, 
      is3Hari:true, 
      isStrict:true,
      extra:{totalJamGoride, totalJamOnline, totalSesiKm, totalKmGojekGoride, kmGorideRealProp, kmGorideRealMurni, avgMuterPct}
    };
  }catch(e){ console.log('AVG baru err',e.message, e.stack); return {avg:0,totalKmMasuk:0,totalJam:0,isFresh:false,usedDateLabel:'-',detail:[]}; }
}

function hitungPrediksiAIKmJamFixed(filtered){ return hitungAvgKmJamGoride(filtered); }



function updateLiveCalc(){
  try{
    const e=readForm(); const c=calcEntry(e);
    const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
    const titleEl=document.getElementById('calc_title_kwh'); if(titleEl) titleEl.textContent=`HITUNG OTOMATIS (BATASAN ${e.cap_kwh} kWh)`;
    set('c_jarak',c.jarak?c.jarak+' km':'–'); set('c_energi',c.energi_terpakai?c.energi_terpakai.toFixed(3)+' kWh':'–'); set('c_whkm',c.wh_per_km?Math.round(c.wh_per_km)+' Wh/km':'–'); set('c_diisi',c.energi_diisi?c.energi_diisi.toFixed(3)+' kWh':'–'); set('c_biaya',fmtRp(c.biaya));
    if(e.charger&&e.batt_akhir<c.targetCas){
      const regex=/([\d.,]+)\s*v\s*([\d.,]+)\s*ah/i; const m=e.charger.match(regex);
      if(m){ const volt=Number(m[1])||0, amp=Number(m[2])||0, sisa=Math.max(0,c.targetCas-e.batt_akhir), needWh=sisa*((e.cap_kwh*1000)/100), watt=volt*amp; if(watt>0){ let f=getCalibratedBmsFactor(e.charger); let pre="⚙️ "; if(!f){ f=(e.cap_kwh>=10)?1.1:(amp>10?1.38:1.15); pre=""; } const h=(needWh/watt)*f; const totM=Math.round(h*60); const hh=Math.floor(totM/60), mm=totM%60; set('c_durasi',`${hh>0?hh+' jam ':''}${mm} menit`); let base=Date.now(); if(editId) base=Number(editId); const now=new Date(base); now.setMinutes(now.getMinutes()+totM); const jamStr=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'); set('c_jam_selesai',pre+jamStr+' ke '+c.targetCas+'%'); } else { set('c_durasi','–'); set('c_jam_selesai','–'); } } else { set('c_durasi','–'); set('c_jam_selesai','–'); }
    } else { set('c_durasi','Tidak mengecas'); set('c_jam_selesai','–'); }
  }catch(e){}
}

async function saveEntry(){
  const e=readForm(); if(e.km_akhir<e.km_awal){ showToast('Km Akhir harus >= Km Awal','error'); return; }
  if(e.batt_awal<=e.batt_akhir){ showToast('Batt Awal harus > Batt Akhir','error'); return; }
  if(e.batt_awal<0||e.batt_awal>100||e.batt_akhir<0||e.batt_akhir>100){ showToast('Baterai harus 0-100%','error'); return; }
  // RESTORED: Pemicu Update Baterai ke Pusat
  try{ kirimDataBaterai(e.batt_akhir); }catch(err){}

  localStorage.setItem('universal_custom_v',document.getElementById('f_custom_v').value); localStorage.setItem('universal_custom_ah',document.getElementById('f_custom_ah').value);
  const jamEl=document.getElementById('c_jam_selesai'); let estTeks=null; if(jamEl&&jamEl.textContent!=='–'&&!jamEl.textContent.includes('Tidak mengecas')) estTeks=jamEl.textContent.replace('⚙️ ','').split(' ke ')[0];
  const currentId=editId||Date.now().toString(); let waktuAsli=currentId; if(editId){ const orig=entries.find(x=>x.id===editId); if(orig&&orig.waktu_dibuat_asli) waktuAsli=orig.waktu_dibuat_asli; }
  const entryData={id:currentId,...e,estimasi_selesai:estTeks,waktu_dibuat_asli:waktuAsli}; if(entryData.biaya===null) delete entryData.biaya; const calc=calcEntry(e);
  // RESTORED: Sisipkan pengiriman data trip harian ke Hub sebelum array dimanipulasi
  try{ simpanKeRiwayatHarianHub(entryData, calc); }catch(err){}
  // simpan ke hub SiGan (existing)
  try{ const k='battlog_riwayat_harian'; let hub=JSON.parse(localStorage.getItem(k)||'[]'); const dataBaru={id:entryData.id,date:entryData.tanggal,km_awal:entryData.km_awal,km_akhir:entryData.km_akhir,dist:calc.jarak,batt_used:(entryData.batt_awal-entryData.batt_akhir),wh_per_km:calc.wh_per_km,amount:calc.biaya,note:`BattLog: ${entryData.lokasi||'Jalan'} (${entryData.batt_awal}% ke ${entryData.batt_akhir}%)`}; hub=hub.filter(it=>it.id!==entryData.id); hub.unshift(dataBaru); localStorage.setItem(k,JSON.stringify(hub)); }catch(err){}
  if(editId){ const i=entries.findIndex(x=>x.id===editId); if(i>=0){ if(entries[i].waktu_selesai_riil) entryData.waktu_selesai_riil=entries[i].waktu_selesai_riil; entries[i]=entryData; } editId=null; document.getElementById('saveBtn').textContent='Simpan Catatan'; document.getElementById('cancelEditBtn').style.display='none'; showToast('Catatan diperbarui!','success'); } else { entries.unshift(entryData); showToast('Catatan disimpan!','success'); }
  try{ localStorage.setItem(LS_KEY, JSON.stringify(entries)); }catch(_){} kalibrasiSohMover();
  let jamKirim=null; if(e.charger&&e.batt_akhir<calc.targetCas){ const regex=/([\d.,]+)\s*v\s*([\d.,]+)\s*ah/i; const m=e.charger.match(regex); if(m){ const volt=Number(m[1])||0, amp=Number(m[2])||0, sisa=Math.max(0,calc.targetCas-e.batt_akhir), needWh=sisa*((e.cap_kwh*1000)/100), watt=volt*amp; if(watt>0){ let f=getCalibratedBmsFactor(e.charger)||((e.cap_kwh>=10)?1.1:(amp>10?1.4:1.15)); const h=(needWh/watt)*f; const totM=Math.round(h*60); const targetExec=Number(waktuAsli)+(totM*60*1000); const now=new Date(Number(waktuAsli)); now.setMinutes(now.getMinutes()+totM); jamKirim=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')+' ke '+calc.targetCas+'%'; if(e.notif_status){ fetch(API_BASE+'/schedule-remind',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:API_CHAT_ID,waktuEksekusi:targetExec,pesan:`⚡ Pengisian Baterai Selesai!\n\nPengisian dari ${e.batt_akhir}% ke ${calc.targetCas}% telah selesai Silakan cabut charger!!`,batt_akhir:e.batt_akhir,batt_setelah:calc.targetCas,jam_selesai:jamKirim})}).then(r=>r.text().then(t=>{ console.log('[NOTIF] Worker response:', t); })).catch(err=>{ console.error('[NOTIF] Gagal:', err); }); } } } }
  resetForm(); renderAll(); switchView('dasbor'); 
  // RESTORED: apiPost ke worker /api/log
  try{ apiPost({...entryData, batt_setelah: calc.targetCas}, jamKirim).then(ok => { if(ok && e.lokasi) saveLokasiToHistory(e.lokasi); }).catch(err => console.log('Bg Sync error:', err)); }catch(err){ try{ if(e.lokasi) saveLokasiToHistory(e.lokasi); }catch(e2){} }
}



function resetForm(){ document.getElementById('entryForm').reset(); document.getElementById('f_tanggal').value=new Date().toISOString().slice(0,10); document.getElementById('f_tarif').value=1444; document.getElementById('f_tarif_preset').value='1444'; document.getElementById('f_custom_v').value=localStorage.getItem('universal_custom_v')||''; document.getElementById('f_custom_ah').value=localStorage.getItem('universal_custom_ah')||''; renderCapDisplay(); if(document.getElementById('f_notif_status')) document.getElementById('f_notif_status').checked=true; const v=document.getElementById('f_custom_v').value, ah=document.getElementById('f_custom_ah').value; document.getElementById('f_charger').value=(v&&ah)?`${v}v ${ah}ah`:''; editId=null; document.getElementById('saveBtn').textContent='Simpan Catatan'; document.getElementById('cancelEditBtn').style.display='none'; updateLiveCalc(); }
function startEdit(id){ const e=entries.find(x=>x.id===id); if(!e) return; editId=id; const s=(id,v)=>{ const el=document.getElementById(id); if(el) el.value=v??''; }; s('f_tanggal',e.tanggal); s('f_km_awal',e.km_awal); s('f_km_akhir',e.km_akhir); s('f_batt_awal',e.batt_awal); s('f_batt_akhir',e.batt_akhir); s('f_batt_setelah',e.batt_setelah); const t=e.tarif??1444; s('f_tarif',t); const pre=document.getElementById('f_tarif_preset'); if(pre) pre.value=(t===1444?'1444':(t===2466?'2466':(t===0?'0':'1444'))); s('f_biaya',e.biaya??''); s('f_lokasi',e.lokasi); renderCapDisplay(e.cap_kwh||4.0); if(document.getElementById('f_notif_status')) document.getElementById('f_notif_status').checked=e.notif_status!==false; const hc=document.getElementById('f_charger'); if(hc){ const val=e.charger||''; hc.value=val; const m=val.match(/([\d.,]+)\s*v\s*([\d.,]+)\s*ah/i); if(m){ s('f_custom_v',m[1]); s('f_custom_ah',m[2]); } else { s('f_custom_v',''); s('f_custom_ah',''); } } document.getElementById('saveBtn').textContent='Update Catatan'; document.getElementById('cancelEditBtn').style.display='block'; switchView('catat'); updateLiveCalc(); }
function cancelEdit(){ editId=null; resetForm(); }
function deleteEntry(id){ if(!confirm('Hapus catatan ini?')) return; entries=entries.filter(x=>x.id!==id); try{ localStorage.setItem(LS_KEY, JSON.stringify(entries)); }catch(_){} kalibrasiSohMover(); renderAll(); prefillTripStart(true); showToast('Catatan dihapus','success'); }

function simpanKoreksiBms(id){
  const inputEl=document.getElementById(`time_riil_${id}`); if(!inputEl) return; const jamRiil=inputEl.value; if(!jamRiil){ showToast('Isi waktu selesai cas dulu!','error'); return; }
  const idx=entries.findIndex(x=>x.id===id); if(idx<0) return; const e=entries[idx]; const calc=calcEntry(e); if(!e.charger||e.batt_akhir>=calc.targetCas){ showToast('Tidak ada proses cas valid.','error'); return; }
  const regex=/([\d.,]+)\s*v\s*([\d.,]+)\s*ah/i; const m=e.charger.match(regex); if(!m){ showToast('Format charger tidak didukung.','error'); return; }
  const volt=Number(m[1])||0, amp=Number(m[2])||0, sisa=Math.max(0,calc.targetCas-e.batt_akhir), needWh=sisa*(((e.cap_kwh||4.0)*1000)/100), watt=volt*amp; if(watt<=0){ showToast('Daya charger tidak valid.','error'); return; }
  const idealMenit=(needWh/watt)*60; const [hS,mS]=jamRiil.split(':').map(Number); let faktorLama=getCalibratedBmsFactor(e.charger)||((e.cap_kwh>=10)?1.1:(amp>10?1.38:1.15)); const predMenit=Math.round((needWh/watt)*faktorLama*60);
  const logDate=new Date(Number(e.waktu_dibuat_asli||e.id)); const realObj=new Date(logDate.getTime()); realObj.setHours(hS,mS,0,0); if(realObj<logDate) realObj.setDate(realObj.getDate()+1); let realMenit=Math.round((realObj-logDate)/(1000*60)); if(realMenit<=0||realMenit>1440) realMenit=predMenit;
  const faktorAktual=realMenit/idealMenit; if(faktorAktual<0.8||faktorAktual>2.5){ showToast('Koreksi diabaikan: selisih tidak sinkron.','error'); return; }
  entries[idx].waktu_selesai_riil=jamRiil; try{ localStorage.setItem(LS_KEY, JSON.stringify(entries)); }catch(_){}
  const key=e.charger.toLowerCase().replace(/\s+/g,''); let map={}; try{ const d=localStorage.getItem(BMS_KEY); if(d){ const p=JSON.parse(d); if(!Array.isArray(p)) map=p; } }catch(e){}
  const faktorAI=(faktorLama*0.7)+(faktorAktual*0.3); let hist=map[key]||[]; hist.unshift(faktorAI); hist=hist.slice(0,5); map[key]=hist; localStorage.setItem(BMS_KEY,JSON.stringify(map));
  showToast(`AI Belajar! Faktor baru ${e.charger.toUpperCase()}: ${faktorAI.toFixed(2)}`,'success'); renderList(); updateLiveCalc();
}

// FIXED list & muter
function renderList(){
  const q=(document.getElementById('searchBox').value||'').toLowerCase(); const box=document.getElementById('listBox'); const list=entries.filter(e=>!q||((e.charger||'')+' '+(e.lokasi||'')).toLowerCase().includes(q));
  if(!list.length){ box.innerHTML='<div class="maka-card text-[#6b7fa2] text-sm">Belum ada catatan.</div>'; return; }
  let kmMap={}; try{ const raw=localStorage.getItem('lapkeu_cross_km'); if(raw) kmMap=JSON.parse(raw); else { const lakeRaw=localStorage.getItem('UNIVERSAL_LAKE_V1'); if(lakeRaw){ const lake=JSON.parse(lakeRaw); if(lake&&lake.cross&&lake.cross.maka_cross_sigan_km) kmMap=lake.cross.maka_cross_sigan_km; } } }catch(e){}
  let entriesByDate={}; list.forEach(e=>{ if(!entriesByDate[e.tanggal]) entriesByDate[e.tanggal]=[]; entriesByDate[e.tanggal].push(e); });
  let muterPerEntry={};
  for(let tgl in entriesByDate){
    let dayList=entriesByDate[tgl];
    // real km hari itu = max-min, bukan sum dobel
    const sorted=dayList.slice().sort((a,b)=>(Number(a.km_awal)||0)-(Number(b.km_awal)||0));
    const minA=Math.min(...sorted.map(x=>Number(x.km_awal)||0)); const maxK=Math.max(...sorted.map(x=>Number(x.km_akhir)||0));
    let sumJarak=sorted.reduce((acc,ee)=>{ try{return acc+(calcEntry(ee).jarak||0);}catch(e){return acc;} },0);
    let totalEvDay=(maxK-minA>0&&maxK-minA<400)?(maxK-minA):Math.min(sumJarak,350);
    let totalSiganDay=kmMap[tgl]?Number(kmMap[tgl]||0):0;
    if(totalEvDay<=0.1||totalSiganDay<=0.1){ dayList.forEach(ee=>{ let ev=0; try{ev=calcEntry(ee).jarak||0;}catch(e){} muterPerEntry[ee.id]={evKm:ev,siganKm:0,muter:0,noSiGan:true}; }); continue; }
    let isAnomaly=totalSiganDay>totalEvDay; 
    dayList.forEach(ee=>{
      let evKm=0; try{evKm=calcEntry(ee).jarak||0;}catch(e){}
      let prop=totalEvDay>0?evKm/totalEvDay:0; let siganRaw=totalSiganDay*prop; let siganAlloc=isAnomaly?Math.min(siganRaw,evKm):siganRaw;
      let muter=isAnomaly?0:Math.max(0,evKm-siganAlloc); if(muter>100) muter=Math.min(muter,evKm*0.8);
      // cap 80% dari sesi
      if(muter>evKm*0.8) muter=evKm*0.8;
      muterPerEntry[ee.id]={evKm,siganKm:siganAlloc,siganRaw,muter,noSiGan:false,anomaly:isAnomaly,totalEvDay,totalSiganDay};
    });
  }
  box.innerHTML=list.map(e=>{ const c=calcEntry(e); const hasCh=e.charger&&e.batt_akhir<c.targetCas; const jamSaved=e.waktu_selesai_riil||''; const estInfo=e.estimasi_selesai?` <span style="color:#8aa0c6;">(Est AI: ${e.estimasi_selesai})</span>`:'';
    const mi=muterPerEntry[e.id]; let badge='';
    if(mi){ if(mi.noSiGan){ badge=`<div style="margin-top:8px; padding:6px 8px; background:rgba(255,138,128,0.08); border:1px dashed rgba(255,138,128,0.2); border-radius:8px; font-size:11px; color:#ff8a80;">⚠️ SiGan tgl ini jarak 0, muter tidak dihitung. Isi jarak di SiGan.</div>`; } else if(mi.anomaly){ badge=`<div style="margin-top:8px; padding:8px; background:rgba(255,138,128,0.12); border:1px solid rgba(255,138,128,0.3); border-radius:8px; font-size:11px;"><div style="display:flex; justify-content:space-between;"><span style="color:#8aa0c6;">📦 Sesi: ${mi.evKm.toFixed(1)} km</span><span style="color:#ff8a80;">SiGan: ${mi.siganRaw.toFixed(1)} km > Sesi!</span></div><div style="margin-top:4px; color:#ffdd53; font-weight:700;">⚠️ Data EV kurang, total EV ${mi.totalEvDay.toFixed(1)} km tapi SiGan ${mi.totalSiganDay.toFixed(1)} km. Muter dikunci 0.</div></div>`; } else { let pct=mi.evKm>0?(mi.muter/mi.evKm*100):0; let col=pct>50?'#ff8a80':pct>30?'#ffdd53':'#7dffb7'; badge=`<div style="margin-top:8px; padding:6px 8px; background:rgba(17,29,53,0.6); border:1px solid #1e2d4a; border-radius:8px; font-size:11px;"><div style="display:flex; justify-content:space-between;"><span style="color:#8aa0c6;">📦 Sesi: ${mi.evKm.toFixed(1)} km (km ${e.km_awal}→${e.km_akhir})</span><span style="color:#7dffb7;">Efektif: ${mi.siganKm.toFixed(1)} km</span></div><div style="margin-top:2px; color:${col}; font-weight:700;">↳ Muter: ${mi.muter.toFixed(1)} km (${pct.toFixed(1)}%)</div></div>`; } }
    const bmsComp=hasCh?`<div style="margin-top:10px; padding-top:8px; border-top:1px dashed #1e2d4a; display:flex; align-items:center; gap:8px;"><span style="font-size:11px; color:#8aa0c6; font-weight:600;">Jam Selesai Riil:</span><input type="time" id="time_riil_${e.id}" class="maka-input" style="width:100px; padding:4px 8px; font-size:12px; border-radius:8px;" value="${jamSaved}"><button onclick="simpanKoreksiBms('${e.id}')" class="pill" style="background:rgba(125,255,183,0.1); color:#7dffb7; border-color:rgba(125,255,183,0.2); font-size:11px;">${jamSaved?'✓ Update AI':'⚡ Ajarkan AI'}</button></div>`:'';
    return `<div class="maka-card"><div class="flex justify-between text-[12px] text-[#8aa0c6] mb-1"><span>${e.tanggal} • Sesi Cas</span><span>${c.jarak} km • ${Math.round(c.wh_per_km)||0} Wh/km</span></div><div class="font-semibold mb-1">${e.lokasi||'–'} <span style="color:#7dffb7"> ${fmtRp(c.biaya)}</span></div><div class="text-[13px] text-[#9ab8e6] mb-2">Kapasitas ${e.cap_kwh||4.0} kWh • Charger ${e.charger||'–'}${estInfo} • km ${e.km_awal}→${e.km_akhir}</div>${badge}<div class="flex gap-2 text-[12px] mt-2"><button onclick="startEdit('${e.id}')" class="pill">Edit</button><button onclick="deleteEntry('${e.id}')" class="pill-danger">Hapus</button></div>${bmsComp}</div>`;
  }).join('');
}

let ringkasMode='mingguan'; function setRingkas(mode,btn){ ringkasMode=mode; document.querySelectorAll('[data-r]').forEach(b=>b.classList.remove('active')); if(btn) btn.classList.add('active'); renderRingkas(); }
function renderRingkas(){ const box=document.getElementById('ringkasBox'); if(!box) return; if(!entries.length){ box.innerHTML='<div class="text-[#6b7fa2] text-center py-2">Belum ada data.</div>'; return; } const groups={}; entries.forEach(e=>{ const d=new Date(e.tanggal); let key; if(ringkasMode==='mingguan'){ key=`${d.getFullYear()}-W${getWeek(d)}`; } else if(ringkasMode==='bulanan'){ key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; } else { key=`${d.getFullYear()}`; } (groups[key] ||= []).push(e); }); const rows=Object.keys(groups).sort().reverse().slice(0,8).map(k=>{ let jarak=0, energi=0, rumah=0, spklu=0; groups[k].forEach(e=>{ if(e.sumber==='battlog_auto_sync' || e.isSynthetic) return; const c=calcEntry(e); jarak+=c.jarak; energi+=c.energi_terpakai; if(isSpklu(e)) spklu+=c.biaya; else rumah+=c.biaya; }); const avg=jarak>0?Math.round((energi*1000)/jarak):0; return `<div style="padding:8px 0;border-bottom:1px dashed rgba(255,255,255,.08)"><div style="display:flex;justify-content:space-between;font-weight:600;color:#eaf2ff"><span>${k}</span><span>${Math.round(jarak)} km • ${energi.toFixed(2)} kWh • ${avg} Wh/km</span></div><div style="display:flex;justify-content:flex-end;font-size:11px;color:#8aa0c6;margin-top:2px;gap:8px"><span>Rumah: <span style="color:#dbe8ff">${fmtRp(rumah)}</span></span><span>|</span><span>SPKLU: <span style="color:#7dffb7">${fmtRp(spklu)}</span></span></div></div>`; }).join(''); box.innerHTML=rows||'Belum ada data.'; }
function getWeek(d){ const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const day=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-day); const yearStart=new Date(Date.UTC(t.getUTCFullYear(),0,1)); return Math.ceil((((t-yearStart)/86400000)+1)/7); }

function renderDasbor(){
  window._personalKm={}; let anchor=new Date(); anchor.setHours(0,0,0,0); let cutoff=new Date(anchor); 
      if(typeof ekonomiPeriod!=='undefined'){ 
        if(ekonomiPeriod==='harian'){ cutoff=new Date(anchor); } 
        else if(ekonomiPeriod.includes('-')){
            try{
                const [y,m] = ekonomiPeriod.split('-').map(Number);
                cutoff = new Date(y, m-1, 1); cutoff.setHours(0,0,0,0);
                anchor = new Date(y, m, 0); anchor.setHours(0,0,0,0);
            }catch(e){ cutoff=new Date('2000-01-01'); }
        }
        else if(ekonomiPeriod==='7hari'){ cutoff.setDate(anchor.getDate()-6); } 
        else if(ekonomiPeriod==='14hari'){ cutoff.setDate(anchor.getDate()-13); } 
        else if(ekonomiPeriod==='30hari'){ cutoff.setDate(anchor.getDate()-29); } 
        else { cutoff=new Date('2000-01-01'); } 
      } else { cutoff=new Date('2000-01-01'); }
  let jarak=0, rumah=0, spklu=0, wh=0, n=0, totalEnergi=0, lastCap=(entries.find(x=>Number(x.cap_kwh)>0)?.cap_kwh||4.0), moving=[]; entries.forEach(e=>{ try{ if(e.sumber==='battlog_auto_sync' || e.isSynthetic) return; const d=new Date(e.tanggal); d.setHours(0,0,0,0); if(typeof ekonomiPeriod!=='undefined'&&ekonomiPeriod!=='all'&&(d<cutoff||d>anchor)) return; }catch(e){} const c=calcEntry(e); jarak+=c.jarak; totalEnergi+=c.energi_terpakai; if(isSpklu(e)) spklu+=c.biaya; else rumah+=c.biaya; if(c.wh_per_km){ wh+=c.wh_per_km; n++; moving.push(c.wh_per_km); } });
  const avgGlobal=n?(wh/n):0; let filtered=[]; entries.forEach(e=>{ try{ const d=new Date(e.tanggal); d.setHours(0,0,0,0); if(typeof ekonomiPeriod!=='undefined'&&ekonomiPeriod!=='all'&&(d<cutoff||d>anchor)) return; filtered.push(e); }catch(e){} });
  const avgMoving=hitungPrediksiAIWhKm(filtered.length?filtered:undefined)||0; const estimasi=avgMoving>0?((0.7*lastCap*1000)/avgMoving):0; // lastCap now from newest valid
  document.getElementById('stat_jarak').textContent=Math.round(jarak)+' km'; document.getElementById('stat_whkm').textContent=n?Math.round(avgGlobal)+' Wh/km':'– Wh/km'; document.getElementById('stat_biaya_rumah').textContent=fmtRp(rumah); document.getElementById('stat_biaya_spklu').textContent=fmtRp(spklu);
  // SiGan
  try{
    const safeParse=k=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):null; }catch(e){return null;} };
    const incomeMap=safeParse('lapkeu_cross_income')||{}; const kmMap=safeParse('lapkeu_cross_km')||{}; const shiftMap=safeParse('lapkeu_shift')||{};
    let totalIncome=0, totalKmEfektif=0; for(let t in incomeMap){ try{ const d=new Date(t); d.setHours(0,0,0,0); if(typeof ekonomiPeriod!=='undefined'&&ekonomiPeriod!=='all'&&(d<cutoff||d>anchor)) continue; totalIncome+=Number(incomeMap[t]||0); }catch(e){} } for(let t in kmMap){ try{ const d=new Date(t); d.setHours(0,0,0,0); if(typeof ekonomiPeriod!=='undefined'&&ekonomiPeriod!=='all'&&(d<cutoff||d>anchor)) continue; totalKmEfektif+=Number(kmMap[t]||0); }catch(e){} }
    const elStatus=document.getElementById('stat_integrasi_status'); if(totalIncome>0){ if(elStatus){ elStatus.textContent='Terhubung ✓ '+Object.keys(incomeMap).length+' hari'; elStatus.style.color='#7dffb7'; } } else { if(elStatus){ elStatus.textContent='Menunggu SiGan'; elStatus.style.color='#ff8a80'; } }
    // FIXED muter: max-min per hari
    let evPerTgl={}; filtered.forEach(e=>{ const t=e.tanggal; if(!t) return; if(!evPerTgl[t]) evPerTgl[t]=[]; evPerTgl[t].push(e); });
    let totalKmKerja=0; for(let t in evPerTgl){ const list=evPerTgl[t].sort((a,b)=>(Number(a.km_awal)||0)-(Number(b.km_awal)||0)); const minA=Math.min(...list.map(x=>Number(x.km_awal)||0)); const maxK=Math.max(...list.map(x=>Number(x.km_akhir)||0)); let sum=list.reduce((a,ee)=>{ try{return a+(calcEntry(ee).jarak||0);}catch(e){return a;} },0); let real=(maxK-minA>0&&maxK-minA<400)?(maxK-minA):Math.min(sum,350); totalKmKerja+=real; }
    let kmMuter=0, hariValid=0, hariTanpa=0; let debug=[];
    for(let tgl in evPerTgl){
      const list=evPerTgl[tgl].sort((a,b)=>(Number(a.km_awal)||0)-(Number(b.km_awal)||0)); const minA=Math.min(...list.map(x=>Number(x.km_awal)||0)); const maxK=Math.max(...list.map(x=>Number(x.km_akhir)||0)); let sum=list.reduce((a,ee)=>{ try{return a+(calcEntry(ee).jarak||0);}catch(e){return a;} },0); let evDay=(maxK-minA>0&&maxK-minA<400)?(maxK-minA):Math.min(sum,350);
      let siganDay=kmMap[tgl]?Number(kmMap[tgl]||0):0; try{ const d=new Date(tgl); d.setHours(0,0,0,0); if(typeof ekonomiPeriod!=='undefined'&&ekonomiPeriod!=='all'&&(d<cutoff||d>anchor)) continue; }catch(e){continue;}
      if(siganDay<=0.1){ hariTanpa++; debug.push({tgl,evDay,siganDay,muter:0,skip:true}); continue; }
      if(siganDay>evDay){ debug.push({tgl,evDay,siganDay,muter:0,skip:true,reason:'SiGan>EV'}); continue; }
      let m=Math.max(0,evDay-siganDay); if(m>100) m=Math.min(m,evDay*0.8); if(m>evDay*0.8) m=evDay*0.8; kmMuter+=m; hariValid++; debug.push({tgl,evDay,siganDay,muter:m,skip:false});
    }
    if(hariValid===0&&Object.keys(evPerTgl).length>0&&totalKmEfektif>0){ let totEv=totalKmKerja; if(totEv>0) kmMuter=Math.max(0,totEv-totalKmEfektif); if(kmMuter>totEv*0.8) kmMuter=totEv*0.5; }
    const eff=totalKmKerja>0&&totalKmEfektif>0?(totalKmEfektif/totalKmKerja*100):0;
    window._totalEvKerja=totalKmKerja; window._debugMuterPerTgl=debug; window._muterStats={hariValid,hariTanpaSiGan:hariTanpa,kmMuter,totalEv:jarak,totalSi:totalKmEfektif};
    let labaBersih=totalIncome-spklu; let labaPerKm=jarak>0?labaBersih/jarak:0; let rpPerKwh=totalEnergi>0?totalIncome/totalEnergi:0; let labaPerKwh=totalEnergi>0?labaBersih/totalEnergi:0; let avgEf=totalKmEfektif>0?totalIncome/totalKmEfektif:(jarak>0?totalIncome/jarak:0); let avgTot=jarak>0?totalIncome/jarak:0;
    const elMuter=document.getElementById('stat_km_muter'), elMuterSub=document.getElementById('stat_km_muter_sub'), elEff=document.getElementById('stat_eff_rute'), elEffSub=document.getElementById('stat_eff_rute_sub');
    if(elMuter){ if(totalKmEfektif<=0.1&&totalIncome>0){ elMuter.textContent='Jarak SiGan 0'; elMuter.style.color='#ff8a80'; } else if(window._muterStats&&hariValid===0&&hariTanpa>0){ elMuter.textContent='–'; } else { elMuter.textContent=Math.round(kmMuter)+' km'; elMuter.style.color='#ffb86b'; } }
    if(elMuterSub){ if(totalKmEfektif<=0.1){ elMuterSub.textContent='Isi jarak km di SiGan tiap order, jangan cuma nominal.'; } else { let personal=Math.max(0,jarak-totalKmKerja); elMuterSub.textContent=`${hariValid} hari valid, ${hariTanpa} tanpa jarak | ${Math.round(totalKmEfektif)} km efektif dari ${Math.round(totalKmKerja)} km kerja (total odometer ${Math.round(jarak)} km) | Muter ${Math.round(kmMuter)} km`; } }
    if(elEff) elEff.textContent=totalIncome>0?eff.toFixed(1)+'%':'–'; if(elEffSub){ let txt=''; if(eff>=85) txt='🔥 Sangat efisien'; else if(eff>=65) txt='💎 Cukup efisien'; else if(eff>=40) txt='⚠️ Banyak muter'; else if(totalIncome>0) txt='🚨 Muter dominan'; elEffSub.textContent=txt; elEff.style.color=eff>=75?'#7dffb7':eff>=50?'#ffdd53':'#ff8a80'; }
    window._battlogAIExtra={totalIncome,totalKmEfektif,kmMuter,effRute:eff,labaBersih,labaPerKm,rpPerKwh,labaPerKwh,avgRpPerKmEfektif:avgEf,totalEnergiKwh:totalEnergi,jarak,biayaSpklu:spklu,biayaRumah:rumah,avgWhKmGlobal:avgGlobal,periode:getPeriodeLabel(),tripCount:filtered.length,cutoff:cutoff.toISOString().slice(0,10),totalKmKerja};
  }catch(err){ console.log('SiGan err',err.message); }
  const estimasiEl=document.getElementById('stat_estimasi'), noteEl=document.getElementById('estimasi_note'); if(estimasi>0){ estimasiEl.textContent=Math.round(estimasi)+' km'; noteEl.textContent='Rentang 100% → 30% berdasarkan AI Moving Weighted'; } else { estimasiEl.textContent='– km'; noteEl.textContent='Menunggu data'; }
  try{ const hist=JSON.parse(localStorage.getItem(SOH_KEY)||'[]'); const elSoh=document.getElementById('stat_soh'), prog=document.getElementById('soh_progress'), note=document.getElementById('soh_note'); const FACTORY_SPEC=parseFloat(localStorage.getItem('battlog_factory_cap'))||4.0; const FACTORY_RANGE=parseFloat(localStorage.getItem('battlog_factory_range'))||115; const baseline=parseFloat(localStorage.getItem('battlog_soh_baseline'))||(FACTORY_RANGE/100); const isFall=localStorage.getItem('battlog_soh_baseline_is_fallback')==='1'; const totalSamples=parseInt(localStorage.getItem('battlog_soh_total_samples')||'0',10); if(hist.length>=1){ const avgKm=hist.reduce((a,b)=>a+b,0)/hist.length; const pct=(avgKm/baseline)*100; const clamped=Math.min(Math.max(pct,50),100); const rataKwh=(avgKm*FACTORY_SPEC)/(FACTORY_RANGE/100); elSoh.textContent=clamped.toFixed(1)+'%'; prog.style.width=clamped+'%'; const sumber=isFall?'klaim pabrik, sementara':'riwayat awalmu'; note.textContent=`Deep Cycle ${totalSamples} trip | ~${rataKwh.toFixed(2)} kWh | ${avgKm.toFixed(2)} km/% (Baseline: ${baseline.toFixed(2)} km/%, ${sumber})`; if(clamped>=95) elSoh.style.color='#7dffb7'; else if(clamped>=85) elSoh.style.color='#2b8cff'; else elSoh.style.color='#ff4d4d'; } else { elSoh.textContent='Menunggu Deep Cycle'; prog.style.width='0%'; note.textContent='Butuh 1 catatan batt_akhir ≤35% dicas 100% & jarak >10km'; } }catch(err){}
  try{ if(typeof hitungSoHAI==='function') hitungSoHAI(); }catch(e){}
  const avgMovingFiltered=hitungPrediksiAIWhKm(filtered); drawModernDigitalCluster(Math.round(avgMovingFiltered||avgMoving)); perbaruiAIInsightDasbor(avgMovingFiltered||avgMoving,filtered);
  const minD=document.getElementById('speedo_min'), maxD=document.getElementById('speedo_max'); if(moving.length>0){ const minV=Math.round(Math.min(...moving)), maxV=Math.round(Math.max(...moving)); if(minD) minD.textContent=minV; if(maxD) maxD.textContent=maxV; } else { if(minD) minD.textContent='–'; if(maxD) maxD.textContent='–'; }
  renderChart(); 
  // v2.7.2: AVG GoRide dari odometer yang masuk ke jam onbid, hijau = data hari ini, merah = pakai kemarin
  setTimeout(()=>{
    const res=hitungAvgKmJamGoride(filtered);
    const el=document.getElementById('stat_avg_kmjam');
    const parent=el?el.closest('div'):null;
    if(el){
      el.textContent=res.avg>0?res.avg.toFixed(1):'–';
      el.style.color=res.isFresh?'#7dffb7':'#ff8a80';
      let tip=`3 Hari GoRide: ${res.totalKmMasuk?res.totalKmMasuk.toFixed(1):0} km / ${res.totalJam?res.totalJam.toFixed(2):0} jam`;
      tip+=`\n${res.isFresh?'✅ Data 3 hari terupdate':'⚠️ Pakai data '+res.usedDateLabel} - ${res.isFresh?'hijau':'merah'}`;
      tip+=`\nDianggap gambaran keseluruhan 3 hari`;
      if(res.detail&&res.detail.length){ tip+=`\nDetail: ${res.detail.slice(0,3).map(d=>d.tgl+':'+(d.jarak||0)+'km').join(', ')}`; }
      el.title=tip;
      if(parent){
        parent.style.borderColor=res.isFresh?'rgba(125,255,183,0.25)':'rgba(255,77,77,0.3)';
        parent.style.background=res.isFresh?'#0d1e2a':'#1e1215';
      }
      let badge=document.getElementById('avg_fresh_badge');
      if(!badge && parent){
        badge=document.createElement('span');
        badge.id='avg_fresh_badge';
        badge.style.cssText='font-size:8px; font-weight:800; padding:2px 5px; border-radius:999px; margin-left:6px; vertical-align:middle;';
        el.parentNode.appendChild(badge);
      }
      if(badge){
        badge.textContent=res.isFresh?'● 3 HARI':'● '+res.usedDateLabel.slice(0,10);
        badge.style.background=res.isFresh?'rgba(125,255,183,0.15)':'rgba(255,77,77,0.15)';
        badge.style.color=res.isFresh?'#7dffb7':'#ff8a80';
        badge.title=res.isFresh?'Data GoRide 3 hari terakhir':'Pakai data '+res.usedDateLabel;
      }
    }
    // simpan ke hub untuk SiGan
    try{
      const payload={avg_km_jam_go: Number((res.avg||0).toFixed(2)), total_km_masuk: Number((res.totalKmMasuk||0).toFixed(2)), total_jam_go: Number((res.totalJam||0).toFixed(2)), isFresh: res.isFresh, usedDate: res.usedDateLabel, ts: Date.now()};
      localStorage.setItem('battlog_avg_km_jam_go', JSON.stringify(payload));
      if(typeof SiganData!=='undefined'&&SiganData.save){ SiganData.save('avg_km_jam_go', payload); }
    }catch(e){}
  },120);
}

function drawModernDigitalCluster(currentWhKm){
  const canvas=document.getElementById('speedoCanvas'); if(!canvas) return; const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height);
  const cx=canvas.width/2, cy=canvas.height-25, r=95, start=Math.PI*1.05, end=Math.PI*1.95, tot=end-start;
  ctx.lineWidth=4; ctx.strokeStyle='#1e2d4a'; ctx.lineCap='round'; ctx.beginPath(); ctx.arc(cx,cy,r,start,end); ctx.stroke();
  let col='#2b8cff'; if(currentWhKm>=0&&currentWhKm<=28) col='#7dffb7'; else if(currentWhKm>=29&&currentWhKm<=35) col='#2b8cff'; else if(currentWhKm>=36&&currentWhKm<=40) col='#ffdd53'; else if(currentWhKm>40) col='#ff4d4d';
  if(currentWhKm>0){ const clamped=Math.min(Math.max(currentWhKm,0),80); const ae=start+(tot*(clamped/80)); ctx.save(); ctx.lineWidth=5; ctx.strokeStyle=col; ctx.shadowColor=col; ctx.shadowBlur=6; ctx.lineCap='round'; ctx.beginPath(); ctx.arc(cx,cy,r,start,ae); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle='#5e759e'; ctx.font='700 10px Inter, sans-serif'; ctx.textAlign='center'; const xs=cx+Math.cos(start)*(r-14), ys=cy+Math.sin(start)*(r-14); ctx.fillText("0",xs,ys+3); const xe=cx+Math.cos(end)*(r-14), ye=cy+Math.sin(end)*(r-14); ctx.fillText("80",xe,ye+3);
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#ffffff'; ctx.font='900 48px Inter, sans-serif'; const disp=currentWhKm>0?currentWhKm:0; ctx.fillText(disp,cx,cy-25); ctx.fillStyle='#8aa0c6'; ctx.font='700 11px Inter, sans-serif'; ctx.fillText("AI WH / KM",cx,cy+12);
  const barW=120, barH=5, barX=cx-(barW/2), barY=cy+24; ctx.fillStyle='#152542'; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(barX,barY,barW,barH,3); else ctx.rect(barX,barY,barW,barH); ctx.fill(); if(currentWhKm>0){ const pct=Math.min(Math.max((80-currentWhKm)/80,0.05),1); ctx.fillStyle=col; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(barX,barY,barW*pct,barH,3); else ctx.rect(barX,barY,barW*pct,barH); ctx.fill(); }
}

let chartPeriod='harian'; let ekonomiPeriod='harian';
function setEkonomiPeriod(p,btn){ ekonomiPeriod=p; try{ const par=btn.parentElement; if(par) par.querySelectorAll('.pill').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }catch(e){} renderDasbor(); }
function setPeriod(p,btn){ chartPeriod=p; document.querySelectorAll('[data-period]').forEach(b=>b.classList.remove('active')); if(btn) btn.classList.add('active'); renderChart(); }
function renderChart(){
  try{
    const wrap=document.getElementById('chartWrap'); let ctxEl=document.getElementById('usageChart'); if(!wrap||!ctxEl) return;
    if(typeof Chart==='undefined'){ wrap.innerHTML='<div style="color:#6b7fa2;font-size:13px;padding:40px 0;text-align:center">Chart offline - koneksi CDN terputus</div><canvas id="usageChart" height="196" style="display:none"></canvas>'; return; }
    // if canvas was removed, recreate
    if(!document.getElementById('usageChart')){ wrap.innerHTML='<canvas id="usageChart" height="196" style="display: block; width: 100%; height: 196px;"></canvas>'; ctxEl=document.getElementById('usageChart'); }
    const groups={}; entries.forEach(e=>{ const d=new Date(e.tanggal); let key; if(chartPeriod==='harian') key=e.tanggal; else if(chartPeriod==='mingguan') key=`${d.getFullYear()}-W${getWeek(d)}`; else key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; const c=calcEntry(e); groups[key] ||= {jarak:0, energi:0}; groups[key].jarak+=c.jarak; groups[key].energi+=c.energi_terpakai; });
    const labels=Object.keys(groups).sort().slice(-8); const data=labels.map(k=>{ const g=groups[k]; return g.jarak>0?Math.round((g.energi*1000)/g.jarak):0; });
    if(usageChart){ usageChart.data.labels=labels; usageChart.data.datasets[0].data=data; usageChart.update(); } else { const ctx=ctxEl.getContext('2d'); const grad=ctx.createLinearGradient(0,0,0,200); grad.addColorStop(0,'rgba(43,140,255,1)'); grad.addColorStop(1,'rgba(43,140,255,0.05)'); usageChart=new Chart(ctxEl,{type:'bar',data:{labels,datasets:[{label:'Efisiensi (Wh/km)',data,backgroundColor:grad,borderColor:'#2b8cff',borderWidth:1,borderRadius:8,borderSkipped:'bottom',hoverBackgroundColor:'rgba(107,178,255,1)',barPercentage:0.6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(30,45,74,0.5)',drawBorder:false},ticks:{color:'#8aa0c6',font:{size:11}}},x:{grid:{display:false},ticks:{color:'#8aa0c6',font:{size:11}}}}}}); }
  }catch(e){ console.log('chart err',e); }
}
function fmtRp(n){ return 'Rp '+Math.round(n).toLocaleString('id-ID'); }
function renderAll(){ renderDasbor(); renderRingkas(); renderList(); }

function perbaruiAIInsightDasbor(avgWhKmMoving, filteredEntries){
  const box=document.getElementById('ai-insight-box'); const badge=document.getElementById('ai-periode-badge'); if(!box) return; if(badge) badge.textContent=getPeriodeLabel();
  if(!entries.length||avgWhKmMoving===0){ box.innerHTML="💡 <strong>Analisis AI:</strong> Siap memantau! Masukkan data trip awalmu. Buka SiGan sekali biar sinkron."; return; }
  const wh=Math.round(avgWhKmMoving); let status="", warna="", saran="";
  if(wh>=0&&wh<=28){ status="🍀 ECO SANGAT EFISIEN (0 - 28 Wh/km)"; warna="#7dffb7"; saran="Urut gas halus, discharge minim, cell adem."; } else if(wh>=29&&wh<=35){ status="💎 RITME NORMAL IDEAL (29 - 35 Wh/km)"; warna="#2b8cff"; saran="Seimbang! Efisiensi termal terbaik rute kota."; } else if(wh>=36&&wh<=40){ status="⚡ MODERAT / AGAK BOROS (36 - 40 Wh/km)"; warna="#ffdd53"; saran="Mulai boros, cek beban, macet, tekanan ban."; } else { status="⚠️ AGRESIF / HIGH DISCHARGE (41 - 80 Wh/km)"; warna="#ff4d4d"; saran="Dikuras deras! Gas spontan bikin panas cell."; }
  let extra=window._battlogAIExtra||{}; let periode=extra.periode||getPeriodeLabel(); let tripCount=extra.tripCount||(filteredEntries?filteredEntries.length:entries.length); let htmlExtra=`<div style="margin-top:2px; font-size:11px; color:#8aa0c6; margin-bottom:8px;">📅 Periode: <strong style="color:#dbe8ff;">${periode}</strong> • ${tripCount} trip • ${extra.jarak?Math.round(extra.jarak)+' km odometer':''}</div>`;
  if(extra.totalIncome&&extra.totalIncome>0){
    let muterPct=extra.jarak>0?(extra.kmMuter/extra.jarak*100):0; let labPerKm=Math.round(extra.labaPerKm||0); let rpKwh=Math.round(extra.rpPerKwh||0); let labaKwh=Math.round(extra.labaPerKwh||0); let effRute=(extra.effRute||0); let avgRpEff=Math.round(extra.avgRpPerKmEfektif||0);
    htmlExtra+=`<div style="padding-top:8px; border-top:1px dashed rgba(125,255,183,0.15);"><div style="font-weight:800; color:#7dffb7; font-size:12px; margin-bottom:6px;">💰 EKONOMI REAL (SiGan x BattLog) - ${periode}</div><div style="font-size:12px; line-height:1.6; color:#dbe8ff; display:flex; flex-direction:column; gap:4px;"><div>• Bruto <strong>${fmtRp(Math.round(extra.totalIncome))}</strong> dari <strong>${Math.round(extra.totalKmEfektif)} km</strong> efektif. Odometer kerja ${Math.round(extra.totalKmKerja||extra.jarak)} km → <strong>${effRute.toFixed(1)}% dibayar</strong></div><div>• Laba bersih (potong SPKLU) <strong>${fmtRp(Math.round(extra.labaBersih))}</strong> → <strong>Rp ${labPerKm.toLocaleString('id-ID')}/km total</strong> / <strong>Rp ${avgRpEff.toLocaleString('id-ID')}/km efektif</strong></div><div>• 1 kWh = <strong>${fmtRp(rpKwh)}</strong> bruto, laba <strong>${fmtRp(labaKwh)}/kWh</strong> • Pakai ${extra.totalEnergiKwh.toFixed(2)} kWh</div>`;
    if(extra.kmMuter>1){ htmlExtra+=`<div>• Muter kosong <strong>${Math.round(extra.kmMuter)} km (${muterPct.toFixed(1)}%)</strong> ≈ ${(extra.kmMuter*(extra.avgWhKmGlobal||35)/1000).toFixed(2)} kWh ≈ <strong>${fmtRp(Math.round(extra.kmMuter*avgRpEff))}</strong> potensi hilang. ${muterPct>35?'<span style="color:#ff8a80">Kebanyakan muter, strategi mangkal lebih cuan.</span>':muterPct>20?'<span style="color:#ffdd53">Masih wajar.</span>':'<span style="color:#7dffb7">Sangat efisien.</span>'}</div>`; }
    htmlExtra+=`</div></div>`;
  } else { htmlExtra+=`<div style="margin-top:10px; padding:8px 10px; background:rgba(255,77,77,0.06); border:1px dashed rgba(255,77,77,0.2); border-radius:10px; font-size:11px; color:#ff8a80;">⚠️ Data SiGan tidak ada untuk ${periode}. Buka SiGan → save 1x biar bisa hitung laba/km dan km muter.</div>`; }
  box.innerHTML=`<div style="font-weight: 800; font-size:13px; color:${warna}; margin-bottom:6px; display:flex; justify-content:space-between;"><span>${status}</span><span style="font-size:11px; color:#8aa0c6; font-weight:600;">${wh} Wh/km • ${periode}</span></div><div style="font-size:12.5px; color:#eaf2ff; line-height:1.5; background:rgba(10,19,40,0.5); border:1px solid #1e2d4a; border-radius:10px; padding:8px 10px;">Prediksi AI periode ${periode}: <strong>${wh} Wh/km</strong> dari ${tripCount} trip. ${saran}</div>${htmlExtra}`;
}

// === LOKASI & CHARGER SUGGEST FIXED XSS ===
const LOKASI_KEY='battlog_lokasi_history';
function getLokasiHistory(){
  try{
    let raw=JSON.parse(localStorage.getItem(LOKASI_KEY)||'[]');
    if(!Array.isArray(raw)) return [];
    // Normalisasi: string atau object dari GPS hotspot
    let out=[];
    for(let it of raw){
      if(typeof it==='string' && it.trim()){
        out.push(it.trim());
      } else if(it && typeof it==='object'){
        let s=it.area||it.label||it.locality||it.name||'';
        if(s && typeof s==='string') out.push(s.trim());
      }
    }
    // dedup & filter [object Object]
    out=out.filter(s=>s && s!=='[object Object]' && !s.includes('[object'));
    // uniq preserve order
    let seen=new Set(); let uniq=[];
    for(let s of out){ let k=s.toLowerCase(); if(!seen.has(k)){ seen.add(k); uniq.push(s); } }
    return uniq;
  }catch(e){ return []; }
}
function migrateLokasiHistoryObjects(){
  try{
    let raw=JSON.parse(localStorage.getItem(LOKASI_KEY)||'[]');
    if(!Array.isArray(raw)) return;
    let hasObj=raw.some(x=>typeof x==='object');
    if(!hasObj) return;
    let cleaned=getLokasiHistory();
    localStorage.setItem(LOKASI_KEY, JSON.stringify(cleaned));
    console.log('[FIX] Migrated lokasi history objects -> strings', cleaned.length);
  }catch(e){}
}
function saveLokasiToHistory(loc){
  try{
    if(!loc) return;
    if(typeof loc==='object'){
      loc=loc.area||loc.label||loc.locality||'';
    }
    loc=String(loc||'').trim();
    if(!loc || loc==='[object Object]' || loc.includes('[object')) return;
    let h=getLokasiHistory().filter(x=>x.toLowerCase()!==loc.toLowerCase());
    h.unshift(loc);
    h=h.slice(0,10);
    localStorage.setItem(LOKASI_KEY,JSON.stringify(h));
  }catch(e){}
}
function renderLokasiSuggest(filter=''){
  const box=document.getElementById('lokasi_suggest'); const input=document.getElementById('f_lokasi'); if(!box||!input) return;
  let hist=getLokasiHistory(); if(filter){ const f=filter.toLowerCase(); hist=hist.filter(x=>x.toLowerCase().includes(f)); } hist=hist.slice(0,3);
  box.innerHTML=''; if(!hist.length){ box.style.display='none'; return; }
  hist.forEach(text=>{
    const div=document.createElement('div'); div.textContent=text; div.style.cssText='padding:12px 14px;cursor:pointer;color:#dbe8ff;font-size:14px;border-bottom:1px solid #1e2d4a';
    div.addEventListener('click',()=>{ input.value=text; box.style.display='none'; updateLiveCalc(); });
    div.addEventListener('mouseenter',()=>div.style.background='#13223d'); div.addEventListener('mouseleave',()=>div.style.background='');
    box.appendChild(div);
  });
  box.style.display='block';
}
function getChargerHistory(){ try{ return JSON.parse(localStorage.getItem('battlog_charger_history')||'[]'); }catch(e){return [];} }
function saveChargerToHistory(v,ah){
  try{
    if(!v||!ah) return;
    v=String(v).replace(',', '.').trim();
    ah=String(ah).replace(',', '.').trim();
    if(!v||!ah) return;
    const item=`${v}v ${ah}ah`;
    let h=getChargerHistory().filter(x=>x.toLowerCase()!==item.toLowerCase());
    h.unshift(item);
    h=h.slice(0,5);
    localStorage.setItem('battlog_charger_history',JSON.stringify(h));
  }catch(e){}
}
function renderChargerSuggest(){
  const box=document.getElementById('charger_suggest'); if(!box) return; const hist=getChargerHistory(); box.innerHTML=''; if(!hist.length){ box.style.display='none'; return; }
  const title=document.createElement('div'); title.textContent='PILIH CHARGER TERSEDIA:'; title.style.cssText='padding:8px 14px; font-size:11px; color:#8aa0c6; font-weight:bold; border-bottom:1px solid #1e2d4a; background:#112240;'; box.appendChild(title);
  hist.forEach(text=>{
    const div=document.createElement('div'); div.textContent=text.toUpperCase(); div.style.cssText='padding:12px 14px; cursor:pointer; color:#7dffb7; font-size:14px; border-bottom:1px solid #1e2d4a';
    div.addEventListener('click',()=>{ const m=text.match(/([\d.,]+)\s*v\s*([\d.,]+)\s*ah/i); if(m){ document.getElementById('f_custom_v').value=m[1]; document.getElementById('f_custom_ah').value=m[2]; document.getElementById('f_charger').value=text; box.style.display='none'; updateLiveCalc(); } });
    div.addEventListener('mouseenter',()=>div.style.background='#13223d'); div.addEventListener('mouseleave',()=>div.style.background='');
    box.appendChild(div);
  });
  box.style.display='block';
}
function prefillTripStart(force){ if(editId) return; const last=entries[0]?entries[0]:null; if(!last) return; const kmEl=document.getElementById('f_km_awal'); const battEl=document.getElementById('f_batt_awal'); if(kmEl&&(force||!kmEl.value||Number(kmEl.value)===0)){ if(last.km_akhir!=null) kmEl.value=last.km_akhir; } if(battEl&&(force||!battEl.value)){ const b=(Number(last.batt_setelah)>0?last.batt_setelah:last.batt_akhir); if(b!=null) battEl.value=b; } }
document.getElementById('f_tanggal').value=new Date().toISOString().slice(0,10);
document.addEventListener('input',e=>{ if(e.target.closest('#entryForm')) updateLiveCalc(); },false);
document.addEventListener('change',e=>{ if(e.target.closest('#entryForm')) updateLiveCalc(); },false);
document.getElementById('f_tarif_preset').addEventListener('change',ev=>{ const v=ev.target.value; document.getElementById('f_tarif').value=v; updateLiveCalc(); });
document.getElementById('f_tarif').addEventListener('input',()=>{ const pre=document.getElementById('f_tarif_preset'); const val=document.getElementById('f_tarif').value; if(pre) pre.value=(val==='1444'||val==='2466'||val==='0')?val:'1444'; updateLiveCalc(); });

(function initFormHelpers(){
  const input=document.getElementById('f_lokasi'); const box=document.getElementById('lokasi_suggest');
  if(input){
    // Bangun history dari entries lama jika history masih kosong
    let hist=getLokasiHistory();
    if(hist.length===0 && entries.length){
      const seen=new Set();
      entries.forEach(e=>{
        const loc=(e.lokasi||'').trim();
        if(loc && !seen.has(loc.toLowerCase())){
          seen.add(loc.toLowerCase());
          hist.push(loc);
        }
      });
      if(hist.length) localStorage.setItem(LOKASI_KEY, JSON.stringify(hist));
    }

    // TIDAK prefill lokasi — selalu mulai kosong (sesuai permintaan user)
    // Suggestion tetap muncul saat focus / ketik huruf pertama
    input.addEventListener('focus', () => renderLokasiSuggest(input.value));
    input.addEventListener('input', () => renderLokasiSuggest(input.value));
    document.addEventListener('click', (e) => {
      if(!e.target.closest('#f_lokasi') && !e.target.closest('#lokasi_suggest')){
        if(box) box.style.display='none';
      }
    });
  }

  const hiddenC=document.getElementById('f_charger');
  const customV=document.getElementById('f_custom_v');
  const customAh=document.getElementById('f_custom_ah');
  const chargerBox=document.getElementById('charger_suggest');

  function syncCustom(){
    const rawV=customV.value.trim();
    const rawAh=customAh.value.trim();
    // support koma 82,6 -> 82.6
    const v=rawV.replace(',', '.').replace(/[^\d.]/g,'');
    const ah=rawAh.replace(',', '.').replace(/[^\d.]/g,'');
    if(v && ah){ hiddenC.value=`${v}v ${ah}ah`; }
    else { hiddenC.value=''; }
    updateLiveCalc();
  }

  if(customV && customAh){
    customV.addEventListener('input', syncCustom);
    customAh.addEventListener('input', syncCustom);
    customV.addEventListener('focus', renderChargerSuggest);
    customAh.addEventListener('focus', renderChargerSuggest);
  }

  document.addEventListener('click', (e) => {
    if(!e.target.closest('#f_custom_v') && !e.target.closest('#f_custom_ah') && !e.target.closest('#charger_suggest')){
      if(chargerBox) chargerBox.style.display='none';
    }
  });

  const origSave=saveEntry;
  saveEntry = async function(){
    const v=customV.value.trim();
    const ah=customAh.value.trim();
    if(v && ah){ saveChargerToHistory(v, ah); }
    return origSave.apply(this, arguments);
  };

  // Reset form: lokasi SELALU dikosongkan (tidak di-prefill lagi)
  if(typeof resetForm !== 'undefined'){
    const _reset = resetForm;
    resetForm = function(){
      _reset();
      if(input) input.value = '';           // pastikan lokasi kosong
      prefillTripStart(true);
      updateLiveCalc();
    };
  }

  document.getElementById('f_custom_v').value = localStorage.getItem('universal_custom_v') || '';
  document.getElementById('f_custom_ah').value = localStorage.getItem('universal_custom_ah') || '';
  syncCustom();
  renderCapDisplay();
  setTimeout(()=>{ prefillTripStart(false); updateLiveCalc(); }, 100);
})();

try{ migrateLokasiHistoryObjects(); }catch(e){}
kalibrasiSohMover(); renderAll(); updateLiveCalc(); switchView('dasbor');

// === BRIDGE FIXED SINGLE - PATCHED SYNC V5.22 COMPATIBLE (PAKEM 2.7.8 TETAP) ===
(function(){
  const KEYS_MAKA=['battlog_log_v1','battlog_bms_history','battlog_soh_history','battlog_factory_cap','battlog_factory_range','battlog_soh_baseline','battlog_soh_baseline_is_fallback','battlog_soh_total_samples','battlog_lokasi_history','battlog_charger_history','universal_custom_v','universal_custom_ah','battlog_chat_id']; 
  const KEYS_SIGAN=['lapkeuData','lapkeu_shift','lapkeu_global_target','siganTariffConfig'];
  const LAKE_KEY='UNIVERSAL_LAKE_V1';
  const safeParse=k=>{ try{ const v=localStorage.getItem(k); if(v==null) return null; try{return JSON.parse(v);}catch(e){return v;} }catch(e){return null;} };
  function getLake(){ try{ const raw=localStorage.getItem(LAKE_KEY); if(!raw) return {_updated:0,_source:'',_sources:{},sigan:{},maka:{},cross:{}}; const obj=JSON.parse(raw); obj.sigan=obj.sigan||{}; obj.maka=obj.maka||{}; obj.cross=obj.cross||{}; obj._sources=obj._sources||{}; return obj; }catch(e){ return {_updated:0,_source:'',_sources:{},sigan:{},maka:{},cross:{}}; } }
  try{ window.__siganBC=window.__siganBC||new BroadcastChannel('lapkeu_universal_sync'); }catch(e){}
  function isValidTime(t){ if(!t) return false; const m=String(t).trim().match(/(\d{1,2})[:.](\d{2})/); if(!m) return false; const h=parseInt(m[1],10), mm=parseInt(m[2],10); return h>=0&&h<=23&&mm>=0&&mm<=59; }
  function mergeSiganData(lakeData, localData){
    try{
      if(!Array.isArray(lakeData)) return localData;
      if(!Array.isArray(localData)) return lakeData;
      if(!lakeData.length) return localData;
      if(!localData.length) return lakeData;
      // Gabung deduplicate by idTrans, prioritas yang punya jam valid
      const map=new Map();
      const all=[...lakeData, ...localData];
      for(let it of all){
        if(!it) continue;
        const key=(it.idTrans||'').toUpperCase()|| (it.date+'_'+(it.time||'')+'_'+(it.dist||''));
        const existing=map.get(key);
        if(!existing){ map.set(key,it); continue; }
        // pilih yang punya endTime valid
        const e1Valid=isValidTime(existing.endTime||existing.jam_akhir)&&isValidTime(existing.time||existing.jam_awal);
        const e2Valid=isValidTime(it.endTime||it.jam_akhir)&&isValidTime(it.time||it.jam_awal);
        if(e2Valid && !e1Valid) map.set(key,it);
        else if(e2Valid && e1Valid){
          // pilih yang jarak lebih besar atau lebih baru
          if((Number(it.dist||0) > Number(existing.dist||0))) map.set(key,it);
        }
      }
      return Array.from(map.values());
    }catch(e){ return localData||lakeData; }
  }
  function buildAndSend(){
    try{
      const lake=getLake();
      // MERGE SIGAN DATA - JANGAN OVERWRITE DATA VALID DARI SIGAN V5.22
      for(let i=0;i<KEYS_SIGAN.length;i++){
        const k=KEYS_SIGAN[i];
        const v=safeParse(k);
        if(k==='lapkeuData'){
          const lakeV=lake.sigan && lake.sigan.siganData ? lake.sigan.siganData : null;
          if(v!==null && lakeV){
            const merged=mergeSiganData(lakeV, v);
            lake.sigan[k]=merged;
            try{ localStorage.setItem(k, JSON.stringify(merged)); }catch(e){}
          } else if(v!==null){
            lake.sigan[k]=v;
          }
        } else {
          if(v!==null) lake.sigan[k]=v;
        }
      }
      for(let i=0;i<KEYS_MAKA.length;i++){ const v=safeParse(KEYS_MAKA[i]); if(v!==null) lake.maka[KEYS_MAKA[i]]=v; }
      const makaLog=safeParse('battlog_log_v1'); 
      if(makaLog&&makaLog.length){ 
        const ringkasBiaya={}; const ringkasEnergi={}; 
        for(let j=0;j<makaLog.length;j++){ const e=makaLog[j]; const tgl=e.tanggal; let biaya=0; if(e.biaya!=null&&!isNaN(e.biaya)) biaya=Number(e.biaya); else if(e.tarif!=null){ const cap=Number(e.cap_kwh||localStorage.getItem('battlog_factory_cap')||4); const pct=Math.max(0,(Number(e.batt_setelah||100)-Number(e.batt_akhir||0))); biaya=(pct/100)*cap*Number(e.tarif||0); } ringkasBiaya[tgl]=(ringkasBiaya[tgl]||0)+biaya; const jarak=Math.max(0,(Number(e.km_akhir)||0)-(Number(e.km_awal)||0)); const used=Math.max(0,(Number(e.batt_awal)||0)-(Number(e.batt_akhir)||0)); const cap2=Number(e.cap_kwh||4); const kwh=(used/100)*cap2; if(!ringkasEnergi[tgl]) ringkasEnergi[tgl]={kwh:0,km:0,whkm:[]}; ringkasEnergi[tgl].kwh+=kwh; ringkasEnergi[tgl].km+=jarak; if(jarak>0) ringkasEnergi[tgl].whkm.push((kwh*1000)/jarak); }
        try{ 
          localStorage.setItem('battlog_ev_cost',JSON.stringify(ringkasBiaya)); 
          // jangan overwrite maka_cross_summary kalau sudah ada avg_speed dari perhitungan STRICT
          const existingSum=safeParse('battlog_summary');
          if(existingSum && typeof existingSum.avg_speed==='number'){
            ringkasEnergi.avg_speed=existingSum.avg_speed;
            ringkasEnergi.mode=existingSum.mode;
          }
          localStorage.setItem('battlog_summary',JSON.stringify(ringkasEnergi)); 
          lake.cross['battlog_ev_cost']=ringkasBiaya; 
          lake.cross['battlog_summary']=ringkasEnergi; 
        }catch(e){} 
      }
      try{ 
        const inc=safeParse('lapkeu_cross_income'); 
        const kmm=safeParse('lapkeu_cross_km'); 
        const goride=safeParse('lapkeu_cross_goride');
        if(inc) lake.cross['lapkeu_cross_income']=inc; 
        if(kmm) lake.cross['lapkeu_cross_km']=kmm;
        // PENTING: JANGAN HAPUS gorideOrders dari SiGan V5.22 - PRESERVE
        if(goride && Array.isArray(goride) && goride.length){
          // kalau lake sudah ada goride dari SiGan yang lebih lengkap, merge
          const lakeGoride=lake.cross && lake.cross.maka_cross_sigan_goride ? lake.cross.maka_cross_sigan_goride : [];
          if(lakeGoride.length===0){
            lake.cross['lapkeu_cross_goride']=goride;
          } else {
            // merge, prioritas yang punya jam_awal valid
            const mergedMap=new Map();
            [...lakeGoride, ...goride].forEach(o=>{
              const key=(o.id_trans||o.idTrans||'')+'_'+(o.date||o.tanggal||'');
              const exist=mergedMap.get(key);
              if(!exist) mergedMap.set(key,o);
              else {
                const eValid=isValidTime(exist.jam_awal)&&isValidTime(exist.jam_akhir);
                const nValid=isValidTime(o.jam_awal)&&isValidTime(o.jam_akhir);
                if(nValid && !eValid) mergedMap.set(key,o);
              }
            });
            lake.cross['lapkeu_cross_goride']=Array.from(mergedMap.values());
          }
        }
        // Sync balik AVG untuk SiGan TERBARU BATTLOG
        try{
          if(typeof hitungAvgKmJamGoride==='function'){
            const res=hitungAvgKmJamGoride();
            if(res && res.avg>0){
              const avgData={avg_speed:res.avg, kecepatan_rata:res.avg, avg_km_per_jam:res.avg, mode:res.isStrict?'STRICT':'FALLBACK', jam_valid:res.detail?res.detail.length:0, total_km:res.totalKmMasuk, total_jam:res.totalJam, usedDateLabel:res.usedDateLabel, updated:Date.now()};
              localStorage.setItem('battlog_avg_speed', JSON.stringify(avgData));
              localStorage.setItem('battlog_summary', JSON.stringify({... (safeParse('battlog_summary')||{}), ...avgData}));
              lake.cross['battlog_avg_speed']=avgData;
              lake.maka['battlog_avg_speed']=avgData;
              // Tulis ke maka_log_v1 satu entry khusus biar SiGan V5.22 baca TERBARU
              let mLog=safeParse('battlog_log_v1')||[];
              if(Array.isArray(mLog)){
                const today=new Date().toISOString().slice(0,10);
                let idx=mLog.findIndex(x=>x.tanggal===today && x.sumber==='battlog_auto_sync');
                const entry={tanggal:today, jarak_km:res.totalKmMasuk, kecepatan_rata:res.avg, avg_speed:res.avg, avg_km_per_jam:res.avg, mode:res.isStrict?'STRICT':'FALLBACK', jam_valid:res.detail?res.detail.length:0, sumber:'battlog_auto_sync', isSynthetic:true, waktu_dibuat_asli:Date.now()}; // FIX v1.5.11: flag synthetic
                if(idx>=0) mLog[idx]=entry; else mLog.push(entry);
                localStorage.setItem('battlog_log_v1', JSON.stringify(mLog));
                lake.maka['battlog_log_v1']=mLog;
              }
            }
          }
        }catch(e2){ console.log('sync avg err',e2.message); }
      }catch(e){}
      lake._updated=Date.now(); lake._sources['maka_fixed_v2_7_8_synced']=Date.now(); lake._source=Object.keys(lake._sources).join('+');
      try{ if(!safeSetItem(LAKE_KEY, JSON.stringify(lake))) console.warn('[BattLog] Lake quota penuh'); }catch(err){ console.log('Lake write err', err.message); }
      try{ if(window.__siganBC) window.__siganBC.postMessage({type:'lake_update',from:'maka',ts:Date.now()}); }catch(e){}
    }catch(e){ console.log('Sender error',e.message); }
  }
  setTimeout(buildAndSend,1000); setInterval(buildAndSend,60000);
  // Trigger juga saat hitung AVG selesai
  setTimeout(()=>{ try{ if(typeof hitungAvgKmJamGoride==='function'){ buildAndSend(); } }catch(e){} },2500);
  window.kirimSemuaKeSiGan=buildAndSend;
})();

// === KORIDOR & JAM FIXED ===
function getSiganOrdersForBattlog(){ try{
  let orders=[];
  let raw=localStorage.getItem('lapkeuData');
  if(raw){ try{ let p=JSON.parse(raw); if(Array.isArray(p)) orders=p; else if(p.data&&Array.isArray(p.data)) orders=p.data; }catch(e){} }
  // tambahan: baca dari goride cross yang lebih presisi
  if(!orders.length){
    let rawG=localStorage.getItem('lapkeu_cross_goride');
    if(rawG){ try{ let p=JSON.parse(rawG); if(Array.isArray(p)) orders=p; }catch(e){} }
  }
  if(!orders.length){
    let lakeRaw=localStorage.getItem('UNIVERSAL_LAKE_V1');
    if(lakeRaw){ try{
      let lake=JSON.parse(lakeRaw);
      if(lake.cross && Array.isArray(lake.cross.maka_cross_sigan_goride) && lake.cross.maka_cross_sigan_goride.length) orders=lake.cross.maka_cross_sigan_goride;
      else if(lake.sigan && Array.isArray(lake.sigan.siganData) && lake.sigan.siganData.length) orders=lake.sigan.siganData;
      else if(lake.cross && lake.cross.sigan_hub_data_from_sigan && Array.isArray(lake.cross.sigan_hub_data_from_sigan.siganData)) orders=lake.cross.sigan_hub_data_from_sigan.siganData;
    }catch(e){} }
  }
  // normalisasi field biar koridor kebaca walau sumber beda
  return orders.map(o=>{
    return {
      tanggal: o.tanggal||o.date||o.tgl||'',
      date: o.date||o.tanggal||o.tgl||'',
      jam_awal: o.jam_awal||o.jam_mulai||o.start||'',
      jam_akhir: o.jam_akhir||o.jam_selesai||o.end||'',
      lokasi_jemput: o.lokasi_jemput||o.jemput||o.pickup||o.lokasi||'',
      lokasi_antar: o.lokasi_antar||o.antar||o.destination||o.tujuan||'',
      jemput: o.jemput||o.lokasi_jemput||o.pickup||'',
      antar: o.antar||o.lokasi_antar||o.destination||'',
      pickup: o.pickup||o.lokasi_jemput||o.jemput||'',
      destination: o.destination||o.lokasi_antar||o.antar||'',
      km: Number(o.km||o.jarak_km||o.jarak||o.dist||0),
      jarak_km: Number(o.jarak_km||o.km||o.jarak||o.dist||0),
      _raw:o
    };
  }).filter(o=>o.tanggal||o.date);
}catch(e){ return []; } }
let _battlogMap = null;
let _battlogMapLayers = [];

// Perkiraan koordinat area Tangerang Selatan (gratis, tanpa API berbayar)
const AREA_COORDS = {
  'bintaro': [-6.2820, 106.7300],
  'pondok betung': [-6.2745, 106.7450],
  'menjangan': [-6.2680, 106.7520],
  'southcity': [-6.3010, 106.7100],
  'ternate': [-6.2950, 106.7180],
  'martadinata': [-6.2550, 106.7600],
  'legoso': [-6.2480, 106.7680],
  'cirendeu': [-6.2900, 106.7400],
  'nerada': [-6.2830, 106.7480],
  'pamulang': [-6.3430, 106.7380],
  'ciputat': [-6.3110, 106.7600],
  'serpong': [-6.3190, 106.6640],
  'bsd': [-6.3015, 106.6530],
  'alam sutera': [-6.2450, 106.6550],
  'sudirman': [-6.2088, 106.8456],
  'dukuh atas': [-6.2030, 106.8220],
  'scbd': [-6.2270, 106.8090],
  'senayan': [-6.2275, 106.7990]
};

function guessCoord(name) {
  if (!name) return null;
  const s = String(name).toLowerCase();
  for (const key in AREA_COORDS) {
    if (s.includes(key)) return AREA_COORDS[key];
  }
  return null;
}

function getWhColor(wh) {
  if (wh >= 37) return '#ff6b6b';
  if (wh >= 33) return '#ffdd53';
  return '#7dffb7';
}

async function osrmRoute(from, to) {
  try {
    const url = 'https://router.project-osrm.org/route/v1/driving/' +
      from[1] + ',' + from[0] + ';' + to[1] + ',' + to[0] +
      '?overview=full&geometries=geojson';
    const res = await fetch(url);
    if (!res.ok) return [from, to];
    const data = await res.json();
    if (!data.routes || !data.routes[0]) return [from, to];
    return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
  } catch (e) {
    return [from, to];
  }
}

function ensureBattlogMap() {
  const el = document.getElementById('battlogMap');
  if (!el || typeof L === 'undefined') return null;
  if (_battlogMap) {
    _battlogMap.invalidateSize();
    return _battlogMap;
  }
  _battlogMap = L.map(el, { zoomControl: false, attributionControl: false }).setView([-6.275, 106.745], 12);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(_battlogMap);
  L.control.zoom({ position: 'topright' }).addTo(_battlogMap);
  return _battlogMap;
}

function clearMapLayers() {
  _battlogMapLayers.forEach(l => { try { _battlogMap.removeLayer(l); } catch(e){} });
  _battlogMapLayers = [];
}

async function drawRoutesOnMap(routeList) {
  const map = ensureBattlogMap();
  if (!map) return;
  clearMapLayers();
  const bounds = [];
  // batasi max 6 rute biar tidak lambat / rate-limit
  const max = Math.min(routeList.length, 6);
  for (let i = 0; i < max; i++) {
    const r = routeList[i];
    const from = guessCoord(r.jem);
    const to = guessCoord(r.ant);
    if (!from || !to) continue;
    let latlngs;
    try {
      latlngs = await osrmRoute(from, to);
    } catch (e) {
      latlngs = [from, to];
    }
    const color = getWhColor(r.avg);
    const line = L.polyline(latlngs, { color, weight: 4, opacity: 0.9, lineCap: 'round' })
      .addTo(map)
      .bindPopup('<b>' + r.k + '</b><br>' + Math.round(r.avg) + ' Wh/km');
    const m1 = L.circleMarker(from, { radius: 5, fillColor: '#ff6b6b', color: '#fff', weight: 1, fillOpacity: 0.95 }).addTo(map);
    const m2 = L.circleMarker(to, { radius: 5, fillColor: '#7dffb7', color: '#fff', weight: 1, fillOpacity: 0.95 }).addTo(map);
    _battlogMapLayers.push(line, m1, m2);
    bounds.push(from, to);
    await new Promise(r => setTimeout(r, 280));
  }
  if (bounds.length) {
    try { map.fitBounds(bounds, { padding: [28, 28] }); } catch(e){}
  }
  setTimeout(() => { try { map.invalidateSize(); } catch(e){} }, 200);
}

function renderBateraiRuteBaru(){
  try{
    let orders = getSiganOrdersForBattlog();
    let whByDate = {}, whCount = {}, allWh = [];
    if (typeof entries !== 'undefined' && typeof calcEntry === 'function') {
      entries.forEach(e => {
        try {
          let c = calcEntry(e);
          if (c.wh_per_km > 0 && c.wh_per_km < 250) {
            let t = e.tanggal;
            if (!whByDate[t]) { whByDate[t] = 0; whCount[t] = 0; }
            whByDate[t] += c.wh_per_km;
            whCount[t]++;
            allWh.push(c.wh_per_km);
          }
        } catch (err) {}
      });
      for (let t in whByDate) whByDate[t] = whByDate[t] / Math.max(1, whCount[t]);
    }

    let korMap = {};
    orders.forEach(o => {
      let t = o.tanggal || o.date;
      if (!t) return;
      let jem = (o.lokasi_jemput || o.jemput || 'Jemput').toString().trim();
      let ant = (o.lokasi_antar || o.antar || 'Antar').toString().trim();
      let key = jem.substring(0, 22) + ' → ' + ant.substring(0, 22);
      let wh = whByDate[t] || 0;
      if (wh <= 0) return;
      if (!korMap[key]) korMap[key] = { total: 0, count: 0, jem, ant };
      korMap[key].total += wh;
      korMap[key].count++;
    });

    let list = Object.keys(korMap).map(k => ({
      k,
      avg: korMap[k].total / korMap[k].count,
      count: korMap[k].count,
      jem: korMap[k].jem,
      ant: korMap[k].ant
    })).sort((a, b) => b.avg - a.avg);

    // List ringkas di bawah peta
    let elKor = document.getElementById('stat_koridor_list');
    if (elKor) {
      if (!list.length) {
        elKor.innerHTML = 'Belum ada data rute. Isi lokasi jemput–antar di SiGan.';
      } else {
        let boros = list.slice(0, 2);
        let irit = [...list].sort((a, b) => a.avg - b.avg).slice(0, 2);
        let html = '';
        if (boros.length) {
          html += '<div style="margin-bottom:4px;color:#ff8a80;font-weight:700;font-size:10px;">🔥 Terboros</div>';
          boros.forEach(it => {
            html += '<div style="display:flex;justify-content:space-between;gap:6px;margin-bottom:2px;"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:65%;">' + it.k + '</span><span style="color:#ff8a80;font-weight:700;">' + Math.round(it.avg) + '</span></div>';
          });
        }
        if (irit.length) {
          html += '<div style="margin-top:8px;margin-bottom:4px;color:#7dffb7;font-weight:700;font-size:10px;">🍃 Teririt</div>';
          irit.forEach(it => {
            html += '<div style="display:flex;justify-content:space-between;gap:6px;margin-bottom:2px;"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:65%;">' + it.k + '</span><span style="color:#7dffb7;font-weight:700;">' + Math.round(it.avg) + '</span></div>';
          });
        }
        elKor.innerHTML = html;
      }
    }

    // Gambar peta (async)
    if (list.length) {
      drawRoutesOnMap(list);
    } else {
      ensureBattlogMap();
    }

    // Anomali (tetap)
    let elAnom = document.getElementById('stat_anomali');
    if (elAnom && allWh.length >= 3) {
      let avgAll = allWh.reduce((a, b) => a + b, 0) / allWh.length;
      let recent = entries.slice(0, 6);
      let anoms = [];
      recent.forEach(e => {
        try {
          let c = calcEntry(e);
          if (c.wh_per_km > avgAll * 1.25 && c.wh_per_km > 38)
            anoms.push({ tgl: e.tanggal, wh: Math.round(c.wh_per_km), km: e.km_awal + '→' + e.km_akhir });
        } catch (err) {}
      });
      if (!anoms.length) {
        elAnom.style.background = 'rgba(125,255,183,0.06)';
        elAnom.style.borderColor = 'rgba(125,255,183,0.15)';
        elAnom.innerHTML = '✅ <strong style="color:#7dffb7;">Baterai normal:</strong> Rata-rata ' + Math.round(avgAll) + ' Wh/km. Tidak ada lonjakan di 6 sesi terakhir.';
      } else {
        elAnom.style.background = 'rgba(255,77,77,0.08)';
        elAnom.style.borderColor = 'rgba(255,77,77,0.2)';
        let html = '⚠️ <strong style="color:#ff8a80;">Anomali terdeteksi:</strong><br/>';
        anoms.forEach(a => {
          html += '• ' + a.tgl + ' ' + a.km + ' = <strong>' + a.wh + ' Wh/km</strong> (avg ' + Math.round(avgAll) + '). Cek ban/rem/beban.<br/>';
        });
        elAnom.innerHTML = html;
      }
    }
  } catch (e) {
    console.log('rute err', e.message);
  }
}
const _origRenderDasbor=renderDasbor; renderDasbor=function(){ _origRenderDasbor.apply(this,arguments); setTimeout(renderBateraiRuteBaru,120); };
setTimeout(renderBateraiRuteBaru,800);

// ===== NEXT BLOCK =====

(function(){
  const nav = document.querySelector('.bottom-nav');
  const isInput = el => el && (el.tagName==='INPUT' || el.tagName==='SELECT' || el.tagName==='TEXTAREA');
  let lastScrollTime = 0;
  document.addEventListener('focusin', e=>{
    const t=e.target;
    if(!isInput(t)) return;
    if(nav) nav.classList.add('keyboard-open');
    const now=Date.now();
    if(now-lastScrollTime < 800) return; // debounce biar gak naik turun liar
    lastScrollTime=now;
    // cuma 1x scroll, instant, bukan smooth berulang
    setTimeout(()=>{
      try{
        // scroll parent yang bisa di-scroll, bukan window
        const parent = t.closest('#view-catat, #view-riwayat, #view-dasbor') || document.scrollingElement;
        if(parent){
          const rect = t.getBoundingClientRect();
          // kalau input ketutup keyboard (di bawah 60% layar)
          if(rect.bottom > window.innerHeight * 0.6){
            const delta = rect.bottom - window.innerHeight*0.6 + 20;
            if(parent===document.scrollingElement){
              window.scrollBy({top: delta, behavior: 'auto'});
            } else {
              parent.scrollBy({top: delta, behavior: 'auto'});
            }
          }
        }
      }catch(_){}
    }, 300);
  }, {passive:true});

  document.addEventListener('focusout', ()=>{
    setTimeout(()=>{
      const a=document.activeElement;
      if(!isInput(a)){
        if(nav) nav.classList.remove('keyboard-open');
      }
    }, 150);
  });

  // visualViewport cuma buat hide nav, jangan scroll lagi
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', ()=>{
      const diff = window.innerHeight - window.visualViewport.height;
      if(diff > 120){
        if(nav) nav.classList.add('keyboard-open');
      } else if(diff < 80){
        if(!isInput(document.activeElement) && nav) nav.classList.remove('keyboard-open');
      }
    });
  }
})();

// ===== NEXT BLOCK =====

(function(){
  const nav = document.querySelector('.bottom-nav');
  const isInput = el => el && (el.tagName==='INPUT' || el.tagName==='SELECT' || el.tagName==='TEXTAREA');
  let lastFocusTime = 0;
  let kbHeight = 0;

  function getVisibleHeight(){
    if(window.visualViewport) return window.visualViewport.height;
    return window.innerHeight;
  }
  function getKbHeight(){
    if(window.visualViewport){
      return Math.max(0, window.innerHeight - window.visualViewport.height);
    }
    return kbHeight;
  }

  function pushInputAboveKeyboard(input){
    if(!input) return;
    try{
      const visibleH = getVisibleHeight();
      const kbH = getKbHeight();
      const rect = input.getBoundingClientRect();
      // target: input harus 16px di atas keyboard, atau minimal di tengah layar
      const targetBottom = visibleH - 16; // 16px di atas keyboard / bottom viewport
      const currentBottom = rect.bottom;
      if(currentBottom > targetBottom){
        const delta = currentBottom - targetBottom + 12;
        // scroll container yang bisa di-scroll
        const scrollable = input.closest('#view-catat, #view-riwayat, #view-dasbor, #app') || document.scrollingElement;
        if(scrollable){
          if(scrollable === document.scrollingElement || scrollable === document.documentElement){
            window.scrollBy({top: delta, behavior: 'smooth'});
          } else {
            scrollable.scrollBy({top: delta, behavior: 'smooth'});
          }
        }
      }
      // tambahin padding bawah biar bisa scroll mentok
      const view = input.closest('#view-catat, #view-riwayat');
      if(view && kbH>0){
        view.style.paddingBottom = (kbH + 100) + 'px';
      }
    }catch(e){}
  }

  document.addEventListener('focusin', e=>{
    const t=e.target;
    if(!isInput(t)) return;
    if(nav) nav.classList.add('keyboard-open');
    const now=Date.now();
    if(now-lastFocusTime < 600) return;
    lastFocusTime=now;
    // tunggu keyboard muncul
    setTimeout(()=>pushInputAboveKeyboard(t), 350);
    setTimeout(()=>pushInputAboveKeyboard(t), 650);
  }, {passive:true});

  document.addEventListener('focusout', ()=>{
    setTimeout(()=>{
      const a=document.activeElement;
      if(!isInput(a)){
        if(nav) nav.classList.remove('keyboard-open');
        document.querySelectorAll('#view-catat, #view-riwayat, #view-dasbor').forEach(v=>v.style.paddingBottom='20px');
      }
    }, 200);
  });

  // visualViewport: update kbHeight dan dorong input aktif
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', ()=>{
      const diff = window.innerHeight - window.visualViewport.height;
      kbHeight = diff>0 ? diff : 0;
      const active=document.activeElement;
      if(isInput(active) && kbHeight>100){
        if(nav) nav.classList.add('keyboard-open');
        pushInputAboveKeyboard(active);
      } else if(kbHeight < 80){
        if(!isInput(active) && nav) nav.classList.remove('keyboard-open');
        document.querySelectorAll('#view-catat, #view-riwayat, #view-dasbor').forEach(v=>v.style.paddingBottom='20px');
      }
    });
  }

  // handle Enter/Next di Gboard biar next input juga naik
  document.addEventListener('keydown', e=>{
    if(e.key==='Enter' || e.key==='Next' || e.key==='Go'){
      setTimeout(()=>{
        const next=document.activeElement;
        if(isInput(next)) pushInputAboveKeyboard(next);
      }, 100);
    }
  });
})();

// ===== NEXT BLOCK =====

function updateHeadToHeadDynamic(jarak, rumah, spklu, label);
      }catch(e){}
      return r;
    };
    window.__h2hPatched=true;
  }
})();

// ===== NEXT BLOCK =====

// Chunked images - 1 file anti-freeze
const makaChunks = [
  "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",
];
const beatChunks = [
  "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",
];
window.addEventListener('DOMContentLoaded', function(){
  try{
    const makaSrc = 'data:image/webp;base64,' + makaChunks.join('');
    const beatSrc = 'data:image/webp;base64,' + beatChunks.join('');
    const imgM = document.getElementById('img-maka-white');
    const imgB = document.getElementById('img-beat-brown');
    if(imgM) imgM.src = makaSrc;
    if(imgB) imgB.src = beatSrc;
    console.log('[BattLog] Images loaded');
  }catch(e){ console.warn('img load err', e); }
});
