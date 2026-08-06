// js/soh.js - SoH Estimator FIX V1.5.12
import { FACTORY_CAP_KEY, CALIB_KM_KEY, CALIB_SOH_KEY } from './config.js';
import { calcEntry } from './calc.js';
import { BATTLOG_CONFIG } from './config.js';

export function kalibrasiSohMover(entries){
  if(!localStorage.getItem(FACTORY_CAP_KEY) && entries.length){
    const f=entries.find(e=>Number(e.cap_kwh)>0);
    if(f) localStorage.setItem(FACTORY_CAP_KEY,f.cap_kwh.toString());
  }
  const FACTORY_RANGE=parseFloat(localStorage.getItem('battlog_factory_range'))||115;
  const FACTORY_KM_PER_PCT=FACTORY_RANGE/100;
  if(!entries.length){
    localStorage.setItem('battlog_soh_history',JSON.stringify([]));
    localStorage.setItem('battlog_soh_baseline_is_fallback','1');
    return;
  }
  const isDeepValid=(e)=>{
    const ba=parseFloat(e.batt_awal)||0, bk=parseFloat(e.batt_akhir)||0, bs=parseFloat(e.batt_setelah)||0,
          jarak=(parseFloat(e.km_akhir)||0)-(parseFloat(e.km_awal)||0);
    const delta=ba-bk;
    const isCharge=(bk<=BATTLOG_CONFIG.deepCycleMaxBattAfter && bs>=BATTLOG_CONFIG.deepCycleMinBattAfter);
    const isDis=(delta>=BATTLOG_CONFIG.deepCycleMinDrop && jarak>BATTLOG_CONFIG.deepCycleMinKm);
    if(!isCharge||!isDis) return null;
    const kmPerPct=jarak/delta;
    if(kmPerPct<0.4||kmPerPct>2.5) return null;
    return kmPerPct;
  };
  let all=[]; entries.forEach(e=>{ const v=isDeepValid(e); if(v!==null) all.push(v); });
  const sorted=[...entries].sort((a,b)=>new Date(a.tanggal||0)-new Date(b.tanggal||0));
  let oldestValid=[]; sorted.forEach(e=>{ const v=isDeepValid(e); if(v!==null) oldestValid.push(v); });
  const hasBaseline=oldestValid.length>=3;
  let baseline=FACTORY_KM_PER_PCT;
  if(hasBaseline){
    const take=Math.max(1,Math.min(5,oldestValid.length));
    baseline=oldestValid.slice(0,take).reduce((a,b)=>a+b,0)/take;
  }
  localStorage.setItem('battlog_soh_baseline',baseline.toString());
  localStorage.setItem('battlog_soh_baseline_is_fallback', hasBaseline?'0':'1');
  localStorage.setItem('battlog_soh_total_samples', all.length.toString());
}

export function hitungSoHAI(entries){
  try{
    const FACTORY_CAP=parseFloat(localStorage.getItem('battlog_factory_cap'))||4.0;
    const calibKm=parseFloat(localStorage.getItem(CALIB_KM_KEY));
    const calibSoh=parseFloat(localStorage.getItem(CALIB_SOH_KEY));
    if(!entries||!entries.length) return null;
    let maxOdo=0, whList=[], fast=0, slow=0, parsial=[];
    entries.forEach(e=>{
      try{
        if(e.sumber==='battlog_auto_sync' || e.isSynthetic) return;
        const c=calcEntry(e);
        const ka=parseFloat(e.km_akhir)||0;
        if(ka>maxOdo) maxOdo=ka;
        if(c.jarak>0&&c.wh_per_km>0) whList.push(c.wh_per_km);
        const ch=(e.charger||'').toLowerCase();
        const mm=ch.match(/(\d+(?:\.\d+)?)\s*ah/);
        const ah=mm?parseFloat(mm[1]):0;
        if(ah>=20) fast++; else if(ah>0) slow++;
        const bAk=parseFloat(e.batt_akhir)||0, bSe=parseFloat(e.batt_setelah)||0;
        if(bSe>bAk){
          const d=bSe-bAk;
          const kwh=c.energi_diisi||0;
          if(d>=40&&kwh>0.2){ // FIX: 30->40 biar gak noisy
            const cr=kwh/(d/100);
            if(cr>FACTORY_CAP*0.5&&cr<FACTORY_CAP*1.5) parsial.push(cr);
          }
        }
      }catch(_){}
    });
    const avgWh=whList.length?whList.reduce((a,b)=>a+b,0)/whList.length:35;
    const odo=maxOdo;
    const totalKwh=odo>0?(odo*avgWh/1000):0;
    const eq=FACTORY_CAP>0?totalKwh/FACTORY_CAP:0;
    const totalCh=fast+slow||1;
    const faktorC=(slow/totalCh)*0.85+(fast/totalCh)*1.18;
    const faktorSuhu=BATTLOG_CONFIG.faktorSuhu;
    const faktorDoD=BATTLOG_CONFIG.faktorDoD;
    const degPerCycleLab=0.0067*faktorC*faktorSuhu*faktorDoD;
    let umurHari=400;
    try{
      const oldest=[...entries].sort((a,b)=>new Date(a.tanggal)-new Date(b.tanggal))[0];
      if(oldest) umurHari=Math.max(30,Math.floor((Date.now()-new Date(oldest.tanggal).getTime())/86400000));
    }catch(_){}
    let sohFinal;
    if(!isNaN(calibKm)&&!isNaN(calibSoh)&&calibKm>0&&odo>0){
      const deltaKm=Math.max(0,odo-calibKm);
      const eqAtCalib=(calibKm*avgWh/1000)/FACTORY_CAP;
      const degTotalAtCalib=100-calibSoh;
      const degCycleAtCalib=degTotalAtCalib*0.85;
      const degPerCycleReal=eqAtCalib>0?degCycleAtCalib/eqAtCalib:degPerCycleLab;
      const degPerCycleBlend=degPerCycleLab*0.2+degPerCycleReal*0.8;
      const deltaKwh=deltaKm*avgWh/1000;
      const deltaCycle=deltaKwh/FACTORY_CAP;
      const degKalDelta=0.008*(umurHari*(deltaKm/Math.max(1,odo)))*0.5;
      const penurunan=(deltaCycle*degPerCycleBlend)+degKalDelta;
      sohFinal=calibSoh-penurunan;
    } else {
      const degKal=0.008*umurHari*0.9;
      sohFinal=100-(eq*degPerCycleLab)-degKal;
    }
    if(parsial.length>=3 && isNaN(calibKm)){
      const avgCap=parsial.slice(-10).reduce((a,b)=>a+b,0)/Math.min(10,parsial.length);
      const sohP=(avgCap/FACTORY_CAP)*100;
      sohFinal=sohFinal*0.4+sohP*0.6;
    }
    if(!isNaN(calibKm)&&!isNaN(calibSoh)){
      if(odo>=calibKm && sohFinal>calibSoh){ sohFinal=calibSoh-0.01; }
      if(odo<calibKm){
        if(sohFinal < calibSoh) sohFinal = calibSoh;
        if(sohFinal > 100) sohFinal = 100;
      }
    }
    sohFinal=Math.min(100,Math.max(50,sohFinal));
    localStorage.setItem('battlog_soh_ai',sohFinal.toFixed(2));
    const elSoh=document.getElementById('stat_soh'), elProg=document.getElementById('soh_progress'), elNote=document.getElementById('soh_note');
    if(elSoh&&elProg){
      elSoh.textContent=sohFinal.toFixed(1)+'%';
      elProg.style.width=sohFinal+'%';
      if(sohFinal>=95) elSoh.style.color='#7dffb7';
      else if(sohFinal>=85) elSoh.style.color='#2b8cff';
      else elSoh.style.color='#ff4d4d';
      let note=`AI: Odo ${Math.round(odo)}km • ${avgWh.toFixed(0)}Wh/km`;
      if(!isNaN(calibKm)) note+=` • Kalib ${calibKm}km/${calibSoh}%`;
      if(elNote) elNote.textContent=note;
    }
    return sohFinal;
  }catch(e){ console.log('SoH AI err',e.message); return null; }
}
