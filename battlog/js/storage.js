// js/storage.js - FIX gabung lapkeu + migrasi
import { LS_KEY, LAKE_KEY, SIGAN_HUB_KEY } from './config.js';

export function safeSetItem(k,v){
  try{ localStorage.setItem(k,v); return true; }
  catch(e){ console.warn('[BattLog] quota penuh', e.message); return false; }
}
export function safeGetItem(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
export function safeParse(k){
  try{
    const v=localStorage.getItem(k);
    if(v==null) return null;
    try{return JSON.parse(v);}catch(e){return v;}
  }catch(e){return null;}
}

export const SiganData = {
  save: (key, value) => {
    try{
      const data = JSON.parse(localStorage.getItem(SIGAN_HUB_KEY) || '{}');
      data[key] = value;
      safeSetItem(SIGAN_HUB_KEY, JSON.stringify(data));
    }catch(e){}
  },
  get: (key) => {
    try{
      const data = JSON.parse(localStorage.getItem(SIGAN_HUB_KEY) || '{}');
      return data[key];
    }catch(e){ return undefined; }
  }
};

export function loadEntries(){
  try{
    let main = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    let lakeRaw = null;
    try{ lakeRaw = JSON.parse(localStorage.getItem(LAKE_KEY) || 'null'); }catch(_){}
    let lake = [];
    if(Array.isArray(lakeRaw)) lake = lakeRaw;
    else if(lakeRaw && Array.isArray(lakeRaw.entries)) lake = lakeRaw.entries;
    else if(lakeRaw && typeof lakeRaw === 'object'){
      // lapkeu kadang simpan object dengan values
      lake = Object.values(lakeRaw).filter(e=>e && e.km_akhir);
    }
    let hubRaw = {};
    try{ hubRaw = JSON.parse(localStorage.getItem(SIGAN_HUB_KEY) || '{}'); }catch(_){}
    let hub = [];
    if(Array.isArray(hubRaw[LS_KEY])) hub = hubRaw[LS_KEY];
    else if(Array.isArray(hubRaw.entries)) hub = hubRaw.entries;

    let all = [...main];
    [...lake, ...hub].forEach(e => {
      if(!e || !e.tanggal) return;
      if(!all.find(a => a.tanggal===e.tanggal && String(a.km_akhir)===String(e.km_akhir))){
        all.push(e);
      }
    });
    if(all.length===0){
      let old = JSON.parse(localStorage.getItem('battlog_log') || '[]');
      if(old.length){
        safeSetItem(LS_KEY, JSON.stringify(old));
        return old;
      }
    }
    return all;
  }catch(e){ console.error(e); return []; }
}

export function saveEntries(entries){
  safeSetItem(LS_KEY, JSON.stringify(entries));
  SiganData.save(LS_KEY, entries);
  return true;
}

export function getLake(){
  try{ return JSON.parse(localStorage.getItem(LAKE_KEY) || '{}'); }catch(e){ return {}; }
}
export function saveLake(lake){
  return safeSetItem(LAKE_KEY, JSON.stringify(lake));
}

// Export helper for debugging
export function debugStorage(){
  const keys = [LS_KEY, LAKE_KEY, SIGAN_HUB_KEY, 'battlog_log', 'battlog_factory_cap'];
  const out = {};
  keys.forEach(k=>{ try{ out[k]=JSON.parse(localStorage.getItem(k)||'null'); }catch(_){ out[k]=localStorage.getItem(k); } });
  console.table(out);
  return out;
}
