// js/calc.js - Perhitungan energi & jarak
export function isSpklu(e){
  if(!e) return false;
  const t=String(e.tarif??'');
  const l=(e.lokasi||'').toLowerCase();
  return t==='2466' || l.includes('spklu') || l.includes('spblu');
}

export function calcEntry(e){
  if(e.sumber==='battlog_auto_sync' || e.isSynthetic){
    return {jarak:0, energi_terpakai:0, energi_diisi:0, wh_per_km:0, biaya:0, targetCas:100};
  }
  const cap=Number(e.cap_kwh)||4.0;
  const jarak=Math.max(0,(Number(e.km_akhir)||0)-(Number(e.km_awal)||0));
  const used=Math.max(0,(Number(e.batt_awal)||0)-(Number(e.batt_akhir)||0));
  const energi_terpakai = used>0 ? (used/100)*cap : 0;
  const wh_per_km = jarak>0 && energi_terpakai>0 ? Math.round((energi_terpakai*1000)/jarak) : 0;
  let biaya=0;
  if(e.biaya!=null && !isNaN(e.biaya)) biaya=Number(e.biaya);
  else if(e.tarif!=null){
    const pct=Math.max(0,(Number(e.batt_setelah||100)-Number(e.batt_akhir||0)));
    biaya=(pct/100)*cap*Number(e.tarif||0);
  }
  const energi_diisi = Math.max(0,(Number(e.batt_setelah||0)-Number(e.batt_akhir||0))/100*cap);
  const targetCas = 100;
  return {jarak, energi_terpakai, energi_diisi, wh_per_km, biaya, targetCas};
}

export function hitungPrediksiAIWhKm(entries){
  if(!entries || !entries.length) return 0;
  const valid=entries.filter(e=>{
    try{
      if(e.sumber==='battlog_auto_sync' || e.isSynthetic) return false;
      const c=calcEntry(e);
      return c.wh_per_km>0 && c.wh_per_km<200;
    }catch(_){return false;}
  });
  if(!valid.length) return 0;
  const take=Math.min(valid.length, 15);
  const sorted=[...valid].sort((a,b)=>new Date(b.tanggal)-new Date(a.tanggal)).slice(0,take).reverse();
  let totB=0, totW=0;
  sorted.forEach((e,idx)=>{
    const c=calcEntry(e);
    const b=idx+1;
    totW+=c.wh_per_km*b;
    totB+=b;
  });
  return totB?totW/totB:0;
}

export function parseTimeToMinutes(s){
  if(!s) return null;
  const [h,m]=s.split(':').map(Number);
  if(isNaN(h)||isNaN(m)) return null;
  return h*60+m;
}
export function minutesToHHMM(min){
  let m=min%1440;
  if(m<0) m+=1440;
  const h=Math.floor(m/60);
  const mm=m%60;
  return String(h).padStart(2,'0')+':'+String(mm).padStart(2,'0');
}

export function getDurationInHours(start,end){
  if(!start||!end) return 0;
  const [sH,sM]=start.split(':').map(Number);
  const [eH,eM]=end.split(':').map(Number);
  if(isNaN(sH)||isNaN(sM)||isNaN(eH)||isNaN(eM)) return 0;
  let diffMins=(eH*60+eM)-(sH*60+sM);
  if(diffMins===0) return 0;
  if(diffMins<0) diffMins+=24*60;
  if(diffMins<0 || diffMins>720) return 0; // FIX v5.35: cap 12 jam
  return diffMins/60;
}
