---
title: Understanding your portfolio performance metrics
zendesk_article_id: 15775439359759
zendesk_section_id: 15003293699343
zendesk_updated_at: '2026-05-29T10:38:54Z'
zendesk_edited_at: '2026-04-11T11:04:41Z'
source_url: 'https://longbridgeus.zendesk.com/hc/en-us/articles/15775439359759-Understanding-your-portfolio-performance-metrics'
promoted: false
position: 0
---
Longbridge provides multiple ways to measure your portfolio's performance. This article explains how each metric is calculated and when to use them.

## **1\. Cost Basis — First In, First Out (FIFO)**

All cost basis calculations follow the **First In, First Out (FIFO)** method, which is the standard required for U.S. tax reporting. Under FIFO, the shares you purchased earliest are treated as the first shares sold.

Suppose you build a position in XYZ over three purchases, then sell 150 shares:

Lot 1 — Jan 3Buy 100 shares @ $10.00
Lot 2 — Feb 7Buy 100 shares @ $14.00
Lot 3 — Mar 12Buy 100 shares @ $18.00
Sell — Apr 1Sell 150 shares @ $20.00

Under FIFO, the sale consumes _all 100 shares from Lot 1_ first, then _50 shares from Lot 2_. The cost basis for this sale is (100 × $10.00) + (50 × $14.00) = **$1,700.00**. The remaining 50 shares from Lot 2 and all of Lot 3 stay in the portfolio at their original purchase prices.

## **2\. Daily P&L cutoff time**

Each day is defined by a cutoff of **8:00 PM Eastern Time (ET)**. Positions and net asset values are snapshotted at this time to calculate the day's P&L. Any change of assets processed after 8:00 PM ET are attributed to the following day.

## **3\. Total Profit & Loss**

Total P&L covers both unrealized gains/losses on current holdings and all realized gains/losses since account inception.

-   Total P&L amount = Ending Total Assets − Beginning Total Assets − Net Cash Inflows

We offer two calculation methods for total P&L rate, which you can switch between in the app.

### **3.1 Simple Weighted**

All net cash flows (deposits, withdrawals, stock transfers) during the period are treated as if they occurred at the start of the period, merged with the beginning asset value as the total cost base.

CUMULATIVE RETURN RATE

Cumulative simple weighted return rate = Total P&L ÷ (Beginning Total Assets + Net Cash Inflows during period)

-   **Advantage:** Fast to compute, easy to understand.

-   **Limitation:** Less accurate when large cash flows occur mid-period or when the measurement window is long. In extreme cases, the rate may be distorted or show a negative value that contradicts the actual dollar gain.

### **3.2 Time Weighted**

The period is divided into individual days. A daily return is calculated for each day, then all daily returns are chain-multiplied. This minimizes the distortion caused by cash flows.

Daily Return Rate = Daily P&L ÷ (Prior day ending assets + Current day net inflows)

Cumulative time weighted return rate = \[ (1 + Day 1 rate) × (1 + Day 2 rate) × … × (1 + Day N rate) − 1 \] × 100%

-   **Advantage:** Segments the period day by day, substantially reducing the impact of cash flows on the rate.

-   **Limitation:** Does not weigh by investment size. If very large deposits or withdrawals occur relative to the portfolio, the P&L dollar amount and the rate may show opposite signs — in this case, the rate has no meaningful reference value.

## **4\. Realized P&L**

Realized P&L reflects gains and losses locked in by completed sell transactions, using FIFO cost basis.

Realized P&L Amount = (Sell price − FIFO cost basis per share) × Shares sold − Fees & commissions

Realized P&L Rate = Realized P&L Amount ÷ (FIFO cost basis per share × Shares sold) × 100%

Cumulative realized P&L for a selected period sums all realized P&L from individual lots closed within that period.

## **5\. Win Rate**

Win rate measures the proportion of closed positions that were profitable. A position is counted as a "win" if its total realized P&L across all sell lots is greater than zero.

Win Rate = Number of profitable closed positions ÷ Total closed positions × 100%

-   A **closed position** is one where all shares from a given symbol have been fully sold within the selected period.

-   Positions that are partially sold are not counted until fully closed.

-   If there are no closed positions in the selected period, the win rate is shown as 0.00%.
