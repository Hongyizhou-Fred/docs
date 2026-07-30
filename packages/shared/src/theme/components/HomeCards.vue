<template>
  <div class="home">

    <!-- ── Hero ── -->
    <section class="hero">
      <HomeBackground />
      <ClientOnly><HomeGraphBg /></ClientOnly>
      <div class="hero-text">
        <p class="hero-eyebrow">{{ t('data.home.eyebrow') }}</p>
        <h1 class="hero-h1"><span class="shimmer-text">Longbridge Docs</span></h1>
        <p class="hero-sub">
          账户开设、资金进出、交易规则——每一步操作都有说明
        </p>
        <!-- 新用户专属入口 -->
        <div class="hero-onboard">
          <div class="onboard-label">{{ t('data.home.newUserLabel') }}</div>
          <a :href="withBase('/getting-started/')"  class="btn-primary">{{ t('data.home.newUserBtn') }}</a>
        </div>
      </div>
    </section>

    <!-- ── 统计数据 ── -->
    <section class="stats-band">
      <div class="stats-inner">
        <div v-for="stat in stats" :key="stat.label" class="stat-item">
          <template v-if="stat.isMarkets">
            <div class="stat-markets">
              <span v-for="m in markets" :key="m.code" class="flag-icon" v-html="flagSvgs[m.code]" />
            </div>
          </template>
          <span v-else class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ t(stat.label) }}</span>
        </div>
      </div>
    </section>

    <!-- ── 常见任务快速入口 ── -->
    <section class="tasks">
      <div class="tasks-inner">
        <div class="tasks-hd">
          <span class="tasks-label">{{ t('data.home.statsLabel') }}</span>
          <p class="tasks-sub">{{ t('data.home.statsSub') }}</p>
        </div>
        <ul class="tasks-grid">
          <li v-for="task in tasks" :key="task.path">
            <a :href="withBase(task.path)" class="task-link">
              <span class="task-q">{{ t(task.q) }}</span>
              <svg class="task-arrow" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </li>
        </ul>
      </div>
    </section>

    <!-- ── Feature sections ── -->

    <!-- 1. 账户与入门 -->
    <section class="feat">
      <div class="feat-text">
        <span class="feat-tag">{{ t('data.home.feat1.tag') }}</span>
        <h2 class="feat-h2">{{ t('data.home.feat1.title') }}</h2>
        <div class="feat-bar"></div>
        <p class="feat-desc">
          {{ t('data.home.feat1.desc') }}
        </p>
        <ul class="feat-links">
          <li><a :href="withBase('/getting-started/')" >{{ t('data.home.feat1.link1') }}</a></li>
          <li><a :href="withBase('/account/')" >{{ t('data.home.feat1.link2') }}</a></li>
          <li><a :href="withBase('/account/')" >{{ t('data.home.feat1.link3') }}</a></li>
        </ul>
      </div>
      <div class="feat-visual" aria-hidden="true">
        <!-- 三步开户流程：注册 → KYC核验 → 首笔交易 -->
        <svg viewBox="0 0 340 280" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="acct-grad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stop-color="var(--lb-illu-mint-50)"/>
              <stop offset="100%" stop-color="var(--lb-illu-mint-50)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- Background card -->
          <rect x="36" y="26" width="268" height="228" rx="16" class="c-bg" stroke="url(#acct-grad)" stroke-width="1.5"/>
          <!-- Step 1: 注册/ID -->
          <circle cx="88" cy="90" r="28" class="c-sf" stroke="var(--lb-illu-mint-50)" stroke-width="1.5"/>
          <!-- ID card icon -->
          <rect x="74" y="79" width="28" height="21" rx="4" class="c-bg" stroke="var(--lb-illu-mint-200)" stroke-width="1.5"/>
          <circle cx="83" cy="87" r="5" fill="var(--lb-illu-mint-50)"/>
          <rect x="82" y="95" width="14" height="3" rx="1.5" class="c-sf"/>
          <!-- Step number badge -->
          <circle cx="108" cy="68" r="10" fill="var(--lb-illu-mint-600)"/>
          <rect x="104" y="65" width="8" height="6" rx="1.5" fill="white" opacity="0.9"/>
          <!-- Connector 1→2 -->
          <line x1="117" y1="90" x2="143" y2="90" stroke="var(--lb-illu-mint-50)" stroke-width="1.5" stroke-dasharray="4 3"/>
          <!-- Step 2: KYC 核验 (active/highlighted) -->
          <circle cx="170" cy="90" r="28" fill="var(--lb-illu-mint-50)" opacity="0.18" stroke="var(--lb-illu-mint-400)" stroke-width="1.5"/>
          <!-- Face / person icon -->
          <circle cx="170" cy="84" r="11" fill="var(--lb-illu-mint-200)" opacity="0.42"/>
          <path d="M156 104 C156 93 184 93 184 104" fill="var(--lb-illu-mint-50)" opacity="0.45"/>
          <!-- KYC verified tick -->
          <circle cx="190" cy="68" r="11" fill="var(--lb-illu-mint-400)"/>
          <path d="M184 68 l5 5 l8-9" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- Connector 2→3 -->
          <line x1="199" y1="90" x2="225" y2="90" stroke="var(--lb-illu-mint-50)" stroke-width="1.5" stroke-dasharray="4 3"/>
          <!-- Step 3: 首笔交易 -->
          <circle cx="252" cy="90" r="28" class="c-sf" stroke="var(--lb-illu-mint-50)" stroke-width="1.5"/>
          <!-- Mini upward chart -->
          <polyline points="239,101 247,93 256,97 265,80" stroke="var(--lb-illu-mint-200)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="265" cy="80" r="4" class="c-bg" stroke="var(--lb-illu-mint-400)" stroke-width="2"/>
          <!-- Step label bars -->
          <rect x="70" y="130" width="36" height="5" rx="2.5" fill="var(--lb-illu-mint-600)" opacity="0.45"/>
          <rect x="152" y="130" width="36" height="5" rx="2.5" fill="var(--lb-illu-mint-400)" opacity="0.6"/>
          <rect x="234" y="130" width="36" height="5" rx="2.5" fill="var(--lb-illu-mint-200)" opacity="0.5"/>
          <!-- Result card: 账户已开立 -->
          <rect x="50" y="152" width="240" height="84" rx="12" class="c-alt" stroke="var(--lb-illu-mint-50)" stroke-width="1"/>
          <!-- Avatar -->
          <circle cx="80" cy="186" r="22" class="c-bg" stroke="var(--lb-illu-mint-50)" stroke-width="1"/>
          <circle cx="80" cy="180" r="12" fill="var(--lb-illu-mint-200)" opacity="0.42"/>
          <path d="M63 202 C63 190 97 190 97 202" class="c-sf"/>
          <!-- Info lines -->
          <rect x="110" y="163" width="76" height="7" rx="3.5" fill="var(--lb-illu-mint-200)" opacity="0.45"/>
          <rect x="110" y="176" width="140" height="5" rx="2.5" class="c-sf"/>
          <rect x="110" y="187" width="120" height="5" rx="2.5" class="c-sf"/>
          <!-- Approved badge -->
          <rect x="110" y="202" width="80" height="22" rx="11" fill="var(--lb-illu-mint-400)"/>
          <rect x="120" y="211" width="60" height="4" rx="2" fill="white" opacity="0.85"/>
          <!-- Account type chip -->
          <rect x="200" y="202" width="76" height="22" rx="8" class="c-bg" stroke="var(--lb-illu-mint-50)" stroke-width="1"/>
          <rect x="208" y="211" width="60" height="4" rx="2" fill="var(--lb-illu-mint-50)"/>
          <!-- Yellow star accent -->
          <polygon points="310,52 313.5,62 324,62 315.5,68.5 318.5,79 310,72.5 301.5,79 304.5,68.5 296,62 306.5,62" fill="var(--lb-c-warning)"/>
        </svg>
      </div>
    </section>

    <!-- 2. 资金管理 (reverse) -->
    <section class="feat feat--reverse">
      <div class="feat-text">
        <span class="feat-tag">{{ t('data.home.feat2.tag') }}</span>
        <h2 class="feat-h2">{{ t('data.home.feat2.title') }}</h2>
        <div class="feat-bar"></div>
        <p class="feat-desc">
          {{ t('data.home.feat2.desc') }}
        </p>
        <ul class="feat-links">
          <li><a :href="withBase('/deposit/')" >{{ t('data.home.feat2.link1') }}</a></li>
          <li><a :href="withBase('/withdrawal/')" >{{ t('data.home.feat2.link2') }}</a></li>
          <li><a :href="withBase('/transfers-and-fx/')" >{{ t('data.home.feat2.link3') }}</a></li>
        </ul>
      </div>
      <div class="feat-visual" aria-hidden="true">
        <svg viewBox="0 0 340 280" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fund-grad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stop-color="var(--lb-illu-mint-50)"/>
              <stop offset="100%" stop-color="var(--lb-illu-mint-50)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- Left: bank card -->
          <rect x="18" y="78" width="112" height="80" rx="12" class="c-bg" stroke="var(--lb-illu-mint-50)" stroke-width="1.5"/>
          <rect x="30" y="94" width="56" height="9" rx="4.5" fill="var(--lb-illu-mint-200)" opacity="0.65"/>
          <rect x="30" y="110" width="40" height="5" rx="2.5" class="c-sf"/>
          <rect x="30" y="121" width="50" height="5" rx="2.5" class="c-sf"/>
          <circle cx="112" cy="84" r="7" fill="var(--lb-c-warning)" opacity="0.75"/>
          <!-- Payment method chips below bank -->
          <rect x="18" y="170" width="42" height="18" rx="9" class="c-sf" stroke="var(--lb-illu-mint-50)" stroke-width="1"/>
          <rect x="24" y="177" width="30" height="4" rx="2" fill="var(--lb-illu-mint-200)" opacity="0.6"/>
          <rect x="66" y="170" width="48" height="18" rx="9" class="c-sf" stroke="var(--lb-illu-mint-50)" stroke-width="1"/>
          <rect x="72" y="177" width="36" height="4" rx="2" fill="var(--lb-illu-mint-200)" opacity="0.6"/>
          <rect x="18" y="194" width="52" height="18" rx="9" class="c-sf" stroke="var(--lb-illu-mint-50)" stroke-width="1"/>
          <rect x="24" y="201" width="40" height="4" rx="2" fill="var(--lb-illu-mint-200)" opacity="0.6"/>
          <rect x="76" y="194" width="40" height="18" rx="9" class="c-sf" stroke="var(--lb-illu-mint-50)" stroke-width="1"/>
          <rect x="82" y="201" width="28" height="4" rx="2" fill="var(--lb-illu-mint-200)" opacity="0.6"/>
          <!-- Right: LB account -->
          <rect x="210" y="78" width="112" height="80" rx="12" class="c-bg" stroke="var(--lb-illu-mint-50)" stroke-width="1.5"/>
          <rect x="222" y="94" width="56" height="9" rx="4.5" fill="var(--lb-illu-mint-200)" opacity="0.65"/>
          <rect x="222" y="110" width="40" height="5" rx="2.5" class="c-sf"/>
          <rect x="222" y="121" width="50" height="5" rx="2.5" class="c-sf"/>
          <circle cx="210" cy="84" r="7" fill="var(--lb-illu-mint-400)"/>
          <!-- In arrow (bank → account, solid) -->
          <path d="M132 106 L212 106" stroke="var(--lb-illu-mint-400)" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M207 102 l5 4 l-5 4" stroke="var(--lb-illu-mint-400)" stroke-width="2" stroke-linecap="round" fill="none"/>
          <!-- Out arrow (account → bank, dashed) -->
          <path d="M212 128 L132 128" stroke="var(--lb-illu-mint-200)" stroke-width="2" stroke-linecap="round" stroke-dasharray="5 3"/>
          <path d="M137 124 l-5 4 l5 4" stroke="var(--lb-illu-mint-200)" stroke-width="2" stroke-linecap="round" fill="none"/>
          <!-- Currency exchange badge top-center -->
          <rect x="118" y="42" width="104" height="28" rx="14" class="c-sf" stroke="var(--lb-illu-mint-50)" stroke-width="1"/>
          <text x="170" y="60" text-anchor="middle" font-size="10" font-weight="700" fill="var(--lb-illu-mint-600)" font-family="system-ui, sans-serif">HKD · USD · SGD</text>
          <!-- FX rate card bottom-right -->
          <rect x="192" y="168" width="130" height="84" rx="10" class="c-alt" stroke="var(--lb-illu-mint-50)" stroke-width="1"/>
          <rect x="204" y="182" width="60" height="6" rx="3" fill="var(--lb-illu-mint-200)" opacity="0.45"/>
          <rect x="204" y="196" width="26" height="5" rx="2.5" fill="var(--lb-illu-mint-50)" opacity="0.65"/>
          <path d="M234 198 L254 198" stroke="var(--lb-illu-mint-50)" stroke-width="1" stroke-dasharray="2 2"/>
          <rect x="258" y="196" width="26" height="5" rx="2.5" fill="var(--lb-illu-mint-200)" opacity="0.55"/>
          <rect x="204" y="208" width="26" height="5" rx="2.5" fill="var(--lb-illu-mint-200)" opacity="0.55"/>
          <path d="M234 210 L254 210" stroke="var(--lb-illu-mint-50)" stroke-width="1" stroke-dasharray="2 2"/>
          <rect x="258" y="208" width="26" height="5" rx="2.5" fill="var(--lb-c-warning)" opacity="0.72"/>
          <rect x="204" y="220" width="26" height="5" rx="2.5" fill="var(--lb-c-warning)" opacity="0.5"/>
          <path d="M234 222 L254 222" stroke="var(--lb-illu-mint-50)" stroke-width="1" stroke-dasharray="2 2"/>
          <rect x="258" y="220" width="26" height="5" rx="2.5" fill="var(--lb-illu-mint-50)"/>
          <rect x="204" y="234" width="60" height="13" rx="6.5" class="c-sf"/>
          <rect x="212" y="238" width="44" height="4" rx="2" fill="var(--lb-illu-mint-50)" opacity="0.6"/>
        </svg>
      </div>
    </section>

    <!-- 3. 交易与投资 -->
    <section class="feat">
      <div class="feat-text">
        <span class="feat-tag">{{ t('data.home.feat3.tag') }}</span>
        <h2 class="feat-h2">{{ t('data.home.feat3.title') }}</h2>
        <div class="feat-bar"></div>
        <p class="feat-desc">
          {{ t('data.home.feat3.desc') }}
        </p>
        <ul class="feat-links">
          <li><a :href="withBase('/stock-trading/')" >{{ t('data.home.feat3.link1') }}</a></li>
          <li><a :href="withBase('/derivatives/')" >{{ t('data.home.feat3.link2') }}</a></li>
          <li><a :href="withBase('/crypto/')" >{{ t('data.home.feat3.link5') }}</a></li>
          <li><a :href="withBase('/ipo/')" >{{ t('data.home.feat3.link3') }}</a></li>
          <li><a :href="withBase('/margin/')" >{{ t('data.home.feat3.link4') }}</a></li>
        </ul>
      </div>
      <div class="feat-visual" aria-hidden="true">
        <svg viewBox="0 0 340 280" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="area-fill" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stop-color="var(--lb-illu-mint-200)" stop-opacity="0.45"/>
              <stop offset="100%" stop-color="#e6ebf0" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- Chart frame -->
          <rect x="36" y="44" width="268" height="192" rx="12" class="c-bg c-bdr" stroke-width="1"/>
          <!-- Market tabs: 港股 / 美股 / 期权 -->
          <rect x="48" y="56" width="38" height="20" rx="10" fill="var(--lb-illu-mint-600)"/>
          <rect x="54" y="64" width="26" height="4" rx="2" fill="white" opacity="0.9"/>
          <rect x="92" y="56" width="38" height="20" rx="10" class="c-sf" stroke="var(--lb-illu-mint-50)" stroke-width="1"/>
          <rect x="98" y="64" width="26" height="4" rx="2" fill="var(--lb-illu-mint-200)" opacity="0.65"/>
          <rect x="136" y="56" width="44" height="20" rx="10" class="c-sf" stroke="var(--lb-illu-mint-50)" stroke-width="1"/>
          <rect x="142" y="64" width="32" height="4" rx="2" fill="var(--lb-illu-mint-200)" opacity="0.65"/>
          <!-- Gain chip top-right -->
          <rect x="260" y="55" width="36" height="20" rx="10" fill="var(--lb-illu-mint-400)"/>
          <rect x="265" y="63" width="26" height="4" rx="2" fill="white" opacity="0.9"/>
          <!-- Grid lines -->
          <line x1="48" y1="100" x2="292" y2="100" stroke="#86cfc3" stroke-width="0.5" opacity="0.3" stroke-dasharray="3"/>
          <line x1="48" y1="130" x2="292" y2="130" stroke="#86cfc3" stroke-width="0.5" opacity="0.3" stroke-dasharray="3"/>
          <line x1="48" y1="160" x2="292" y2="160" stroke="#86cfc3" stroke-width="0.5" opacity="0.3" stroke-dasharray="3"/>
          <line x1="48" y1="190" x2="292" y2="190" stroke="#86cfc3" stroke-width="0.5" opacity="0.3" stroke-dasharray="3"/>
          <!-- Area fill -->
          <path d="M56 196 L84 174 L116 156 L148 132 L180 112 L212 94 L244 78 L276 62 L276 212 L56 212 Z" fill="url(#area-fill)"/>
          <!-- Price line -->
          <polyline points="56,196 84,174 116,156 148,132 180,112 212,94 244,78 276,62" stroke="var(--lb-illu-mint-200)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <!-- Candlestick bodies at 4 points -->
          <rect x="81" y="168" width="6" height="12" rx="1" fill="var(--lb-illu-mint-400)" opacity="0.75"/>
          <line x1="84" y1="164" x2="84" y2="182" stroke="var(--lb-illu-mint-400)" stroke-width="1" opacity="0.5"/>
          <rect x="145" y="127" width="6" height="11" rx="1" fill="var(--lb-c-danger)" opacity="0.55"/>
          <line x1="148" y1="123" x2="148" y2="141" stroke="var(--lb-c-danger)" stroke-width="1" opacity="0.4"/>
          <rect x="209" y="89" width="6" height="11" rx="1" fill="var(--lb-illu-mint-400)" opacity="0.75"/>
          <line x1="212" y1="85" x2="212" y2="103" stroke="var(--lb-illu-mint-400)" stroke-width="1" opacity="0.5"/>
          <circle cx="276" cy="62" r="5" class="c-bg" stroke="var(--lb-illu-mint-400)" stroke-width="2"/>
          <!-- Bottom: IPO badge + 期权 chip -->
          <rect x="36" y="244" width="88" height="28" rx="10" fill="var(--lb-c-warning)" opacity="0.14" stroke="var(--lb-c-warning)" stroke-width="1"/>
          <rect x="50" y="255" width="60" height="5" rx="2.5" fill="var(--lb-c-warning)" opacity="0.8"/>
          <rect x="136" y="244" width="80" height="28" rx="10" class="c-sf" stroke="var(--lb-illu-mint-50)" stroke-width="1"/>
          <rect x="150" y="255" width="52" height="5" rx="2.5" fill="var(--lb-illu-mint-200)" opacity="0.65"/>
          <!-- Red dot accent top-right -->
          <circle cx="308" cy="62" r="8" fill="var(--lb-c-danger)" opacity="0.8"/>
        </svg>
      </div>
    </section>

    <!-- 4. 财富与合规 (reverse) -->
    <section class="feat feat--reverse">
      <div class="feat-text">
        <span class="feat-tag">{{ t('data.home.feat4.tag') }}</span>
        <h2 class="feat-h2">{{ t('data.home.feat4.title') }}</h2>
        <div class="feat-bar"></div>
        <p class="feat-desc">
          {{ t('data.home.feat4.desc') }}
        </p>
        <ul class="feat-links">
          <li><a :href="withBase('/funds-and-wealth/')" >{{ t('data.home.feat4.link1') }}</a></li>
          <li><a :href="withBase('/market-data/')" >{{ t('data.home.feat4.link2') }}</a></li>
          <li><a :href="withBase('/compliance-and-tax/')" >{{ t('data.home.feat4.link3') }}</a></li>
          <li><a :href="withBase('/rewards/')" >{{ t('data.home.feat4.link4') }}</a></li>
        </ul>
      </div>
      <div class="feat-visual" aria-hidden="true">
        <svg viewBox="0 0 340 280" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wealth-grad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stop-color="var(--lb-illu-mint-50)"/>
              <stop offset="100%" stop-color="var(--lb-illu-mint-50)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- Portfolio donut (余额通/基金定投) -->
          <circle cx="112" cy="116" r="62" class="c-bdr" fill="none" stroke-width="22"/>
          <!-- Main ~58% teal segment -->
          <circle cx="112" cy="116" r="62" fill="none" stroke="var(--lb-illu-mint-600)" stroke-width="22"
            stroke-dasharray="226 164" stroke-dashoffset="47"/>
          <!-- ~25% yellow segment -->
          <circle cx="112" cy="116" r="62" fill="none" stroke="var(--lb-c-warning)" stroke-width="22"
            stroke-dasharray="98 292" stroke-dashoffset="-179"/>
          <!-- ~17% light teal segment -->
          <circle cx="112" cy="116" r="62" fill="none" stroke="var(--lb-illu-mint-200)" stroke-width="22"
            stroke-dasharray="66 324" stroke-dashoffset="-277"/>
          <!-- Donut hole -->
          <circle cx="112" cy="116" r="46" class="c-bg"/>
          <text x="112" y="110" text-anchor="middle" font-size="15" font-weight="700" fill="var(--lb-illu-mint-600)" font-family="system-ui, sans-serif">5.2%</text>
          <text x="112" y="126" text-anchor="middle" font-size="9" fill="var(--lb-illu-mint-200)" font-family="system-ui, sans-serif">年化收益</text>
          <!-- Compliance shield (CRS/FATCA) top-right -->
          <path d="M226 44 L276 44 L276 82 C276 100 263 112 251 120 C239 112 226 100 226 82 Z" fill="#1a3832" stroke="var(--lb-illu-mint-400)" stroke-width="1.5"/>
          <path d="M241 80 l8 8 l14-15" stroke="var(--lb-illu-mint-400)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- Tax/compliance document card -->
          <rect x="196" y="134" width="120" height="60" rx="10" class="c-bg" stroke="url(#wealth-grad)" stroke-width="1.5"/>
          <rect x="208" y="148" width="54" height="6" rx="3" fill="var(--lb-illu-mint-200)" opacity="0.55"/>
          <rect x="208" y="161" width="96" height="4" rx="2" class="c-sf"/>
          <rect x="208" y="171" width="80" height="4" rx="2" class="c-sf"/>
          <rect x="208" y="181" width="64" height="4" rx="2" class="c-sf"/>
          <!-- Market ticker strip (行情数据) at bottom -->
          <rect x="28" y="202" width="284" height="52" rx="10" class="c-alt" stroke="var(--lb-illu-mint-50)" stroke-width="1"/>
          <rect x="40" y="214" width="38" height="6" rx="3" fill="var(--lb-illu-mint-200)" opacity="0.5"/>
          <rect x="86" y="214" width="28" height="6" rx="3" fill="var(--lb-illu-mint-400)" opacity="0.6"/>
          <rect x="122" y="214" width="34" height="6" rx="3" fill="var(--lb-illu-mint-200)" opacity="0.42"/>
          <rect x="164" y="214" width="30" height="6" rx="3" fill="var(--lb-illu-mint-50)"/>
          <rect x="202" y="214" width="38" height="6" rx="3" fill="var(--lb-illu-mint-200)" opacity="0.48"/>
          <rect x="248" y="214" width="28" height="6" rx="3" fill="var(--lb-illu-mint-400)" opacity="0.5"/>
          <rect x="40" y="226" width="30" height="4" rx="2" fill="var(--lb-illu-mint-400)" opacity="0.45"/>
          <rect x="86" y="226" width="22" height="4" rx="2" fill="var(--lb-c-danger)" opacity="0.4"/>
          <rect x="122" y="226" width="26" height="4" rx="2" fill="var(--lb-illu-mint-400)" opacity="0.4"/>
          <rect x="164" y="226" width="22" height="4" rx="2" fill="var(--lb-c-danger)" opacity="0.38"/>
          <rect x="202" y="226" width="28" height="4" rx="2" fill="var(--lb-illu-mint-400)" opacity="0.42"/>
          <rect x="248" y="226" width="22" height="4" rx="2" fill="var(--lb-c-danger)" opacity="0.4"/>
          <!-- Yellow star accent -->
          <polygon points="36,52 39.5,62 50,62 41.5,68.5 44.5,79 36,72.5 27.5,79 30.5,68.5 22,62 32.5,62" fill="var(--lb-c-warning)"/>
        </svg>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'
import HomeBackground from './HomeBackground.vue'
import HomeGraphBg from './HomeGraphBg.vue'
import { useI18n } from '../../i18n/useI18n'

const { t } = useI18n()

const flagSvgs: Record<string, string> = {
  sg: `<svg width="28" height="19" viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg" aria-label="新加坡"><rect width="24" height="8" fill="#EF3340"/><rect y="8" width="24" height="8" fill="#fff"/><circle cx="6" cy="4" r="3.2" fill="#fff"/><circle cx="7.5" cy="4" r="2.5" fill="#EF3340"/><polygon fill="#fff" points="0,-1 0.235,-0.324 0.951,-0.309 0.381,0.124 0.588,0.809 0,0.4 -0.588,0.809 -0.381,0.124 -0.951,-0.309 -0.235,-0.324" transform="translate(13.5,1.5) scale(0.62)"/><polygon fill="#fff" points="0,-1 0.235,-0.324 0.951,-0.309 0.381,0.124 0.588,0.809 0,0.4 -0.588,0.809 -0.381,0.124 -0.951,-0.309 -0.235,-0.324" transform="translate(15.2,3) scale(0.62)"/><polygon fill="#fff" points="0,-1 0.235,-0.324 0.951,-0.309 0.381,0.124 0.588,0.809 0,0.4 -0.588,0.809 -0.381,0.124 -0.951,-0.309 -0.235,-0.324" transform="translate(14.5,5.2) scale(0.62)"/><polygon fill="#fff" points="0,-1 0.235,-0.324 0.951,-0.309 0.381,0.124 0.588,0.809 0,0.4 -0.588,0.809 -0.381,0.124 -0.951,-0.309 -0.235,-0.324" transform="translate(12.5,5.2) scale(0.62)"/><polygon fill="#fff" points="0,-1 0.235,-0.324 0.951,-0.309 0.381,0.124 0.588,0.809 0,0.4 -0.588,0.809 -0.381,0.124 -0.951,-0.309 -0.235,-0.324" transform="translate(11.8,3) scale(0.62)"/></svg>`,
  hk: `<svg width="28" height="19" viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg" aria-label="香港"><rect width="24" height="16" fill="#DE2910"/><g transform="translate(12,8)"><path d="M0,0 C0.8,-1.5 1,-4 0,-6.5 C-1,-4 -0.8,-1.5 0,0" fill="#fff" transform="rotate(18)"/><path d="M0,0 C0.8,-1.5 1,-4 0,-6.5 C-1,-4 -0.8,-1.5 0,0" fill="#fff" transform="rotate(90)"/><path d="M0,0 C0.8,-1.5 1,-4 0,-6.5 C-1,-4 -0.8,-1.5 0,0" fill="#fff" transform="rotate(162)"/><path d="M0,0 C0.8,-1.5 1,-4 0,-6.5 C-1,-4 -0.8,-1.5 0,0" fill="#fff" transform="rotate(234)"/><path d="M0,0 C0.8,-1.5 1,-4 0,-6.5 C-1,-4 -0.8,-1.5 0,0" fill="#fff" transform="rotate(306)"/></g></svg>`,
  us: `<svg width="28" height="19" viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg" aria-label="美国"><rect width="24" height="16" fill="#B22234"/><rect y="1.23" width="24" height="1.23" fill="#fff"/><rect y="3.69" width="24" height="1.23" fill="#fff"/><rect y="6.15" width="24" height="1.23" fill="#fff"/><rect y="8.62" width="24" height="1.23" fill="#fff"/><rect y="11.08" width="24" height="1.23" fill="#fff"/><rect y="13.54" width="24" height="1.23" fill="#fff"/><rect width="9.6" height="8.62" fill="#3C3B6E"/><g fill="#fff"><circle cx="1.6" cy="1.43" r="0.5"/><circle cx="3.2" cy="1.43" r="0.5"/><circle cx="4.8" cy="1.43" r="0.5"/><circle cx="6.4" cy="1.43" r="0.5"/><circle cx="8" cy="1.43" r="0.5"/><circle cx="2.4" cy="2.87" r="0.5"/><circle cx="4" cy="2.87" r="0.5"/><circle cx="5.6" cy="2.87" r="0.5"/><circle cx="7.2" cy="2.87" r="0.5"/><circle cx="1.6" cy="4.31" r="0.5"/><circle cx="3.2" cy="4.31" r="0.5"/><circle cx="4.8" cy="4.31" r="0.5"/><circle cx="6.4" cy="4.31" r="0.5"/><circle cx="8" cy="4.31" r="0.5"/><circle cx="2.4" cy="5.74" r="0.5"/><circle cx="4" cy="5.74" r="0.5"/><circle cx="5.6" cy="5.74" r="0.5"/><circle cx="7.2" cy="5.74" r="0.5"/><circle cx="1.6" cy="7.18" r="0.5"/><circle cx="3.2" cy="7.18" r="0.5"/><circle cx="4.8" cy="7.18" r="0.5"/><circle cx="6.4" cy="7.18" r="0.5"/><circle cx="8" cy="7.18" r="0.5"/></g></svg>`,
}

const markets = [
  { code: 'sg', name: '新加坡' },
  { code: 'hk', name: '香港' },
  { code: 'us', name: '美国' },
]

const stats = [
  { value: '17',   label: 'data.home.stat1' },
  { value: '165+', label: 'data.home.stat2' },
  { value: '3',    label: 'data.home.stat3' },
  { isMarkets: true, label: 'data.home.stat4' },
]

const tasks = [
  { q: 'data.home.tasks.0', path: '/deposit/' },
  { q: 'data.home.tasks.1', path: '/withdrawal/' },
  { q: 'data.home.tasks.2', path: '/stock-trading/' },
  { q: 'data.home.tasks.3', path: '/troubleshooting/' },
  { q: 'data.home.tasks.4', path: '/ipo/' },
  { q: 'data.home.tasks.5', path: '/margin/' },
  { q: 'data.home.tasks.6', path: '/compliance-and-tax/' },
  { q: 'data.home.tasks.7', path: '/transfers-and-fx/' },
]
</script>
