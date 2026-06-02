// All 2026 tax rates — single source of truth for Ontario Self-Employed Tax Calculator.
// Never hardcode values elsewhere. Every value maps to an official CRA source.
// Sources: Authority Pack v1.2 Section E / Section N

const CONFIG = {
  TAX_YEAR: 2026,

  // Federal — Source #2 Chart 1 (CRA T4032-ON Jan 2026 PDF)
  FEDERAL_BRACKETS: [58523, 117045, 181440, 258482],
  FEDERAL_RATES: [0.14, 0.205, 0.26, 0.29, 0.33],
  FEDERAL_CONSTANTS: [0, 3804, 10241, 15685, 26024],
  FEDERAL_BPA_MAX: 16452,
  FEDERAL_BPA_MIN: 14829,
  FEDERAL_BPA_ADDITIONAL: 1623,
  FEDERAL_BPA_PHASEOUT_START: 181440,
  FEDERAL_BPA_PHASEOUT_RANGE: 77042,

  // Ontario — Source #2 Chart 2
  ON_BRACKETS: [53891, 107785, 150000, 220000],
  ON_RATES: [0.0505, 0.0915, 0.1116, 0.1216, 0.1316],
  ON_CONSTANTS: [0, 2210, 4376, 5876, 8076],
  ON_BPA: 12989,

  // Ontario Surtax — Source #2
  ON_SURTAX_THRESHOLD_1: 5818,
  ON_SURTAX_THRESHOLD_2: 7446,
  ON_SURTAX_RATE_1: 0.20,
  ON_SURTAX_RATE_2: 0.36,

  // Ontario Health Premium — Source #2
  OHP_TIERS: [
    { min: 0, max: 20000, base: 0, rate: 0, income_floor: 0, maxPremium: 0 },
    { min: 20000, max: 36000, base: 0, rate: 0.06, income_floor: 20000, maxPremium: 300 },
    { min: 36000, max: 48000, base: 300, rate: 0.06, income_floor: 36000, maxPremium: 450 },
    { min: 48000, max: 72000, base: 450, rate: 0.25, income_floor: 48000, maxPremium: 600 },
    { min: 72000, max: 200000, base: 600, rate: 0.25, income_floor: 72000, maxPremium: 750 },
    { min: 200000, max: Infinity, base: 750, rate: 0.25, income_floor: 200000, maxPremium: 900 }
  ],

  // CPP — Source #4, #6
  CPP_RATE_SELF_EMPLOYED: 0.119,
  CPP_YMPE: 74600,
  CPP_BASIC_EXEMPTION: 3500,
  CPP_MAX_SELF_EMPLOYED: 8460.90,

  // CPP2 — Source #5, #7
  CPP2_RATE_SELF_EMPLOYED: 0.08,
  CPP2_YAMPE: 85000,
  CPP2_MAX_SELF_EMPLOYED: 832.00,

  // GST/HST thresholds
  GST_SOFT_THRESHOLD: 25000,
  GST_HARD_THRESHOLD: 30000,

  // AdSense
  ADSENSE_PUB_ID: 'ca-pub-7744853829365165'
};
