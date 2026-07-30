export interface AnswerExample {
  id: string
  question: string
  answer: string
  answerSteps: string[]
  citation: {
    label: string
    path: string
  }
}

export const answerExamples: AnswerExample[] = [
  {
    id: 'deposit-not-arrived',
    question: '我的港股入金没到账，怎么办？',
    answer: '入金通常在 1–2 个工作日到账。先按以下步骤自查：',
    answerSteps: [
      '在银行 App 确认转账已成功，记录参考号',
      '打开长桥 App →「资金」→「入金记录」核对状态',
      '若超过 2 个工作日仍未到账，在 App 内联系客服并附转账凭证',
    ],
    citation: {
      label: '入金方式说明',
      path: '/deposit/how-to-choose-deposit-method',
    },
  },
  {
    id: 'options-pcp-margin',
    question: '美股期权 PCP 策略，保证金怎么算？',
    answer: 'PCP（保护性认购）需同时持有标的多头与认购空头，保证金取两者较大值：',
    answerSteps: [
      '期权市值 × 15%（当前期权报价 × 合约乘数）',
      '标的证券价值 × 10%（当前股价 × 股数）',
      '当前实时保证金可在「账户 → 保证金详情」随时查看',
    ],
    citation: {
      label: '期权开通与规则',
      path: '/derivatives/options/enable-options',
    },
  },
  {
    id: 'w8ben',
    question: 'W-8BEN 在哪填？不填会多扣多少税？',
    answer: '未申报 W-8BEN 时，美股股息按 30% 预扣税率征收；申报后，大多数地区降至 10%–15%。',
    answerSteps: [
      '打开长桥 App →「我的」→「账户设置」→「税务信息」',
      '按页面提示填写姓名、国籍及税务居民身份',
      '表格有效期 3 年，到期前 App 会提醒续签',
    ],
    citation: {
      label: '美股税务与 W-8BEN',
      path: '/compliance-and-tax/us-stock-tax',
    },
  },
]
