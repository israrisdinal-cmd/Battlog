// js/storage.js - Safe storage & Sigan Hub
import { LS_KEY, BMS_KEY, SOH_KEY, LAKE_KEY, SIGAN_HUB_KEY } from './config.js';

export function safeSetItem(k,v){
  try{ localStorage.setItem(k,v); return true; }catch(e){ console.warn('[BattLog] quota penuh', e.message); return false; }
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
  try{ return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }catch(e){ return []; }
}
export function saveEntries(entries){
  return safeSetItem(LS_KEY, JSON.stringify(entries));
}

export function getLake(){
  try{ return JSON.parse(localStorage.getItem(LAKE_KEY) || '{}'); }catch(e){ return {}; }
}
export function saveLake(lake){
  return safeSetItem(LAKE_KEY, JSON.stringify(lake));
}
