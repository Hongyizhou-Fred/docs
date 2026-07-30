// Canvas rendering colors — CSS vars not supported in canvas 2D API,
// so hex/rgb literals are kept here as the single source of truth.
//
// HomeGraphBg uses CAT_COLORS (teal family + brand accents, RGB component strings)
// LinkGraph uses CATEGORY_COLORS (per-category hex palette)

// ── HomeGraphBg palette ────────────────────────────────────────────────────
// 11 color slots: teal family (0-7) + open.longbridge accent trio (8-10).
// Each entry: [darkActive_rgb, lightActive_rgb] — no '#', just "r,g,b" components
// so callers can do `rgba(${CAT_COLORS[idx][ci]}, ${alpha})`.
// Teal slots vary L=28%→73%, S=30%→100%; hue identity preserved at rest via opacity.
export const CAT_COLORS: [string, string][] = [
  // 0  deep teal      H=174° L=30%  — darkest, richest
  ['0,152,138',   '0,112,105'],
  // 1  brand-1 mint   H=168° L=47%  — #00f0c4 / #00b8b8
  ['0,240,196',   '0,184,184'],
  // 2  brand-2 cyan   H=175° L=56%  — #32eadc / #1ac7c7
  ['50,234,220',  '26,199,199'],
  // 3  brand-3        H=176° L=52%  — #2ed4c7 / #33cdcd
  ['46,212,199',  '51,205,205'],
  // 4  bright pale    H=175° L=73%  — lightest, most airy
  ['118,252,240', '32,218,215'],
  // 5  warm teal      H=168° L=39%  — green-shifted, mid-dark
  ['0,198,175',   '0,158,148'],
  // 6  cool aqua      H=188° L=50%  — blue-shifted, distinct
  ['22,212,238',  '10,170,196'],
  // 7  muted gray     H=177° S=30%  — heavily desaturated
  ['108,178,174', '82,148,146'],
  // 8  warm gold      #d4a800 / #b28a00 — rewards, celebratory
  ['212,168,0',   '178,138,0'],
  // 9  rust orange    #c34607 / #a23a06 — caution, risk, formal
  ['195,70,7',    '162,58,5'],
  // 10 slate gray     desaturated neutral — docs, navigation
  ['148,148,155', '110,110,118'],
]

// Base brand teal used for pulse rings / center node in HomeGraphBg
export const BRAND_TEAL_DARK  = '0,240,196'
export const BRAND_TEAL_LIGHT = '0,184,184'

// ── LinkGraph palette ──────────────────────────────────────────────────────
// Per-category hex colors — Material Design inspired, high-contrast multi-hue.
// Fallback '#888' is replaced at runtime via getComputedStyle (see LinkGraph.vue).
export const CATEGORY_COLORS: Record<string, string> = {
  'getting-started':           '#4caf50',
  'app-guide':                 '#8bc34a',
  'account':                   '#2196f3',
  'deposit':                   '#00b8b8',
  'withdrawal':                '#ff9800',
  'transfers-and-fx':          '#ff5722',
  'stock-trading':             '#00bcd4',
  'derivatives':               '#9c27b0',
  'ipo':                       '#ffc107',
  'margin':                    '#f44336',
  'funds-and-wealth':          '#009688',
  'market-data':               '#3f51b5',
  'portfolio-and-statements':  '#607d8b',
  'rewards':                   '#e91e63',
  'compliance-and-tax':        '#795548',
  'troubleshooting':           '#9e9e9e',
}
