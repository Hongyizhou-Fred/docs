---
title: Guide to Index Options
zendesk_article_id: 16581190476815
zendesk_section_id: 15933247430031
zendesk_updated_at: '2026-07-07T02:45:45Z'
zendesk_edited_at: '2026-06-26T06:29:15Z'
source_url: 'https://longbridgeus.zendesk.com/hc/en-us/articles/16581190476815-Guide-to-Index-Options'
promoted: false
position: 0
---
Concept of index option contracts
Index options refer to options that use an index as the underlying asset. Depending on
the underlying index, index options can be further classified into stock index options
and volatility index options.
Longbridge supports the trading of the following US index options: S&P 500 Index
(SPX), Volatility Index (VIX), Mini SPX Index (XSP), 1/100 Dow Jones Industrial
Average (DJX), Nasdaq-100 Index (NDX), E-Mini Nasdaq 100 Index (XND), and
Russell 2000 Index (RUT). The trading hours for these index-related options are as
follows:
Exercise method
The exercise method for index options differs from that for stocks. Most index options
are European-style, which means they can't be exercised early. Currently, all US index
options supported by Longbridge are European-style options.
Settlement method
Since an index is not tradable, index options are settled in cash, where no transfer of
the underlying asset occurs. Instead, the settlement value is calculated based on the
strike price of the option contract and the settlement price, and the settlement is then
made in cash.
Settlement type: AM settlement and PM settlement
Option settlements are categorized into two types: AM and PM.
AM-settled options: The last trading day is generally the trading day before the
option's expiration date. The settlement price is calculated based on the open price of
the underlying index on the expiration date, with the specific settlement price
determined by the settlement index.
PM-settled options: The last trading day is the option expiration date. The settlement
price is calculated based on the closing price of the underlying index on the expiration
