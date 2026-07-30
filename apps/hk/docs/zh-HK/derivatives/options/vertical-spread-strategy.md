---
layout: doc
sidebar: true
---

# 垂直价差策略

Vertical Spread 垂直策略包含四种子策略，适用于不同市场预期，通过同时买入和卖出相同标的、相同到期日但不同行权价的期权，在控制风险的同时实现收益目标。

## Bull Call Spread 牛市看涨期权价差

### 策略概述

在预期正股股价将上涨但涨幅有限，或已买入看涨期权（Call）想降低成本及对冲股价下跌风险时使用。通过同时买入一个低行权价的看涨期权（Call A）和卖出一个高行权价的看涨期权（Call B）来构建，两者行权价不同，但标的股票、到期日、方向类型相同。

### 策略特点

![](./images/SoaXb96UfoUehkxb657jkzVtpJc.png)

Bull Call Spread 策略特点

### 策略构成

![](./images/F8yOb88aFoqDYqxilE0jwoIxpzg.png)

Bull Call Spread 策略构成

### 盈利来源

- 「买入 Call A」实现看涨预期，赚取正股上涨收益

- 「卖出 Call B」降低「买入 Call A」的成本

### 案例解析

以虚构的上市公司 TECH 为例，TECH 现价 $100，预期股价将温和上涨但涨幅不大，决定构建 Bull Call Spread 策略：

买入 1 张行权价为 $100 的看涨期权（Call A），权利金为 $4；卖出 1 张行权价为 $110 的看涨期权（Call B），权利金为 $1.5（合约乘数为 100）。

![](./images/XfEtbXwAqojAyGxXyRMjob1TpGh.png)

Bull Call Spread 盈亏图示

![](./images/RF2DbjaUUoy5qTx8WTCjxeVgpOc.jpg)

Bull Call Spread 情景分析

![](./images/N4FNb58RzogJ79xMxWZj2ybUpTb.png)

Bull Call Spread 盈亏详情

## Bull Put Spread 牛市看跌期权价差

### 策略概述

在预期正股股价将上涨但涨幅有限，或已买入看跌期权（Put）想降低成本及对冲股价上涨风险时使用。通过同时买入一个低行权价的看跌期权（Put A）和卖出一个高行权价的看跌期权（Put B）来构建，两者行权价不同，但标的股票、到期日、方向类型相同。

### 策略特点

⚠ 【图片缺失：Bull Put Spread 策略特点】

### 策略构成

![](./images/Iyetba1pYo1FVoxInsrjLw7HpJh.png)

Bull Put Spread 策略构成

### 盈利来源

- 「卖出 Put B」收取权利金

- 「买入 Put A」限制潜在损失，整体在股价上涨时获利

### 案例解析

以虚构的上市公司 TECH 为例，TECH 现价 $100，预期股价将温和上涨，决定构建 Bull Put Spread 策略：

买入 1 张行权价为 $100 的看跌期权（Put A），权利金为 $3；卖出 1 张行权价为 $110 的看跌期权（Put B），权利金为 $5（合约乘数为 100）。

![](./images/AGmUbs2IsoYisNxQfY5jYsErpwc.png)

Bull Put Spread 盈亏图示

![](./images/M3fTbZ41hostSJxMXFhjnUDvpPe.png)

Bull Put Spread 情景分析

![](./images/Mhnpb6YOLoLagpxYxKTjBu14pTc.png)

Bull Put Spread 盈亏详情

## Bear Call Spread 熊市看涨期权价差

### 策略概述

在预期正股股价将下跌但跌幅有限，或已卖出看涨期权（Call）想降低成本及对冲股价上涨风险时使用。通过同时卖出一个低行权价的看涨期权（Call A）和买入一个高行权价的看涨期权（Call B）来构建，两者行权价不同，但标的股票、到期日、方向类型相同。

### 策略特点

⚠ 【图片缺失：Bear Call Spread 策略特点】

### 策略构成

![](./images/Swzvbsm5QoAZx8x516Aj3jq5puh.png)

Bear Call Spread 策略构成

### 盈利来源

- 「卖出 Call A」收取权利金

- 「买入 Call B」限制潜在损失，整体在股价下跌时获利

### 案例解析

以虚构的上市公司 TECH 为例，TECH 现价 $190，预期股价将温和下跌，决定构建 Bear Call Spread 策略：

卖出 1 张行权价为 $190 的看涨期权（Call A），权利金为 $4；买入 1 张行权价为 $200 的看涨期权（Call B），权利金为 $2（合约乘数为 100）。

![](./images/NrSebptK6otSnixSyJLjUxxAphc.png)

Bear Call Spread 盈亏图示

![](./images/Va8Pbfq3ZoUb9YxwMabjSDUypbf.png)

Bear Call Spread 情景分析

![](./images/PQ5db5TEiorz4VxHFRaji1yXpBg.png)

Bear Call Spread 盈亏详情

## Bear Put Spread 熊市看跌期权价差

### 策略概述

在预期正股股价将下跌但跌幅有限，或已买入看跌期权（Put）想降低成本及对冲股价上涨风险时使用。通过同时卖出一个低行权价的看跌期权（Put A）和买入一个高行权价的看跌期权（Put B）来构建，两者行权价不同，但标的股票、到期日、方向类型相同。

### 策略特点

![](./images/ArhLbH9ZhoFcuXxKeanjvpHGpPb.png)

Bear Put Spread 策略特点

### 策略构成

![](./images/SruZb1g0Polng6x5YZxjbnpxp9b.png)

Bear Put Spread 策略构成

### 盈利来源

- 「买入 Put B」在股价下跌时提供保护并赚取收益

- 「卖出 Put A」收取权利金，降低「买入 Put B」的成本

### 案例解析

以虚构的上市公司 TECH 为例，TECH 现价 $80，预期股价将温和下跌，决定构建 Bear Put Spread 策略：

卖出 1 张行权价为 $80 的看跌期权（Put A），权利金为 $3；买入 1 张行权价为 $90 的看跌期权（Put B），权利金为 $6（合约乘数为 100）。

![](./images/DuQnbnLKhoR7WHxjYLPjWcOGp6f.png)

Bear Put Spread 盈亏图示

![](./images/WxRfb6ykiocVelxPoU5jwmYwpLc.png)

Bear Put Spread 情景分析

![](./images/NyCJb1EOqoDhjbxfTZWj0zfQppd.png)

Bear Put Spread 盈亏详情

_本文内容仅供参考，不构成任何投资建议。_
