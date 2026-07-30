export interface FeaturedAsk {
  /** i18n key for label */
  q: string
  /** i18n key for AI prompt (resolved at click time via t()) */
  initialPrompt: string
}

export const hotSearchTags: FeaturedAsk[] = [
  { q: 'data.featuredAsks.hot.hkTrading', initialPrompt: 'data.featuredAsks.prompts.hkTrading' },
  { q: 'data.featuredAsks.hot.fps',       initialPrompt: 'data.featuredAsks.prompts.fps' },
  { q: 'data.featuredAsks.hot.options',   initialPrompt: 'data.featuredAsks.prompts.options' },
  { q: 'data.featuredAsks.hot.w8ben',     initialPrompt: 'data.featuredAsks.prompts.w8ben' },
  { q: 'data.featuredAsks.hot.margin',    initialPrompt: 'data.featuredAsks.prompts.margin' },
  // { q: 'data.featuredAsks.hot.cashPlus',  initialPrompt: 'data.featuredAsks.prompts.cashPlus' },
]

export const featuredAsks: FeaturedAsk[] = [
  { q: 'data.featuredAsks.cards.hkFees.q',         initialPrompt: 'data.featuredAsks.cards.hkFees.prompt' },
  { q: 'data.featuredAsks.cards.cat.q',            initialPrompt: 'data.featuredAsks.cards.cat.prompt' },
  { q: 'data.featuredAsks.cards.firstDeposit.q',   initialPrompt: 'data.featuredAsks.cards.firstDeposit.prompt' },
  { q: 'data.featuredAsks.cards.optionsOpen.q',    initialPrompt: 'data.featuredAsks.cards.optionsOpen.prompt' },
  { q: 'data.featuredAsks.cards.usPrePost.q',      initialPrompt: 'data.featuredAsks.cards.usPrePost.prompt' },
  { q: 'data.featuredAsks.cards.cashPlusRedeem.q', initialPrompt: 'data.featuredAsks.cards.cashPlusRedeem.prompt' },
  { q: 'data.featuredAsks.cards.marginCall.q',     initialPrompt: 'data.featuredAsks.cards.marginCall.prompt' },
  { q: 'data.featuredAsks.cards.withdrawHK.q',     initialPrompt: 'data.featuredAsks.cards.withdrawHK.prompt' },
  { q: 'data.featuredAsks.cards.stockTransfer.q',  initialPrompt: 'data.featuredAsks.cards.stockTransfer.prompt' },
  { q: 'data.featuredAsks.cards.fatcaCrs.q',       initialPrompt: 'data.featuredAsks.cards.fatcaCrs.prompt' },
  { q: 'data.featuredAsks.cards.scrip.q',          initialPrompt: 'data.featuredAsks.cards.scrip.prompt' },
  { q: 'data.featuredAsks.cards.orderFail.q',      initialPrompt: 'data.featuredAsks.cards.orderFail.prompt' },
]
