// js/config.js - FIX V1.5.12 - Clean + Telegram safe
export const BATTLOG_CONFIG = {
  version: '1.5.12-tapfix',
  defaultCapKwh: 4.0,
  defaultFactoryRangeKm: 140,
  defaultTarifRumah: 1444,
  defaultTarifSpklu: 2466,
  maxTripKmFromSigan: 100,
  maxShiftDurationMin: 1080,
  defaultMuterPct: 0.25,
  maxMuterPct: 0.60,
  fallbackMuterPct: 0.30,
  maxAvgKmJam: 60,
  deepCycleMinDrop: 40,
  deepCycleMinKm: 5,
  deepCycleMaxBattAfter: 40,
  deepCycleMinBattAfter: 95,
  faktorSuhu: 1.2,
  faktorDoD: 0.85,
};

export const LS_KEY = 'battlog_log_v1';
export const BMS_KEY = 'battlog_bms_history';
export const SOH_KEY = 'battlog_soh_history';
export const FACTORY_CAP_KEY = 'battlog_factory_cap';
export const FACTORY_RANGE_KEY = 'battlog_factory_range';
export const CALIB_KM_KEY = 'battlog_factory_calib_km';
export const CALIB_SOH_KEY = 'battlog_factory_calib_soh';
export const LAKE_KEY = 'UNIVERSAL_LAKE_V1';
export const SIGAN_HUB_KEY = 'sigan_hub_data';
