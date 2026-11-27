[![make.fun · best-national-statistics-site-20261126-0539](https://make.fun/badge/best-national-statistics-site-20261126-0539.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)
[![rank](https://make.fun/badge/best-national-statistics-site-20261126-0539/ldpapay/national-statistics-site/rank.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)
[![reward](https://make.fun/badge/best-national-statistics-site-20261126-0539/ldpapay/national-statistics-site/reward.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)

# StatAtlas — National Statistics Explorer

A working national statistics site: real figures for 12 countries, 2019–2024,
on population, GDP, GDP per capita, life expectancy, unemployment, inflation,
GDP growth and internet use. Every figure carries its source and year.

Built for the [make.fun bounty "Make the best national statistics site"](https://make.fun/bounty/best-national-statistics-site-20261126-0539).

## Run it

Open `app/index.html` in a desktop browser (or run `node serve.ts` and open
http://localhost:8080). No network, no build step — all data lives in `app/`.

## What it does

- **Overview** — headline figures for the year you pick, the richest countries
  per person, the biggest economies, and the fastest grower.
- **Countries** — search by country or capital, filter by region, sort any
  column, and tick up to three countries to compare.
- **Country pages** — a full profile: key figures, a 2019–2024 chart you can
  switch between bars and lines, any of the 8 indicators, and a year-by-year
  table with the change on the previous year.
- **Compare** — two or three countries side by side, as bars for one year or
  lines across all six years, with a plain-language reading of the gap.
- **Rankings** — all twelve countries ranked by the indicator you choose,
  with each country's change on last year.
- **Sources** — where every number comes from, what it means, and what it
  cannot do.

Use the **Year** picker in the header to move the whole site between 2019 and
2024. Everything updates — nothing is frozen to one year. The layout works on
desktop and on a phone.

## Where the numbers come from

Every figure comes from the **World Bank's World Development Indicators
(WDI)**, retrieved from the World Bank API (api.worldbank.org) on
27 November 2026:

| Indicator | WDI code |
| --- | --- |
| Population, total | SP.POP.TOTL |
| GDP (current US$) | NY.GDP.MKTP.CD |
| GDP per capita (current US$) | NY.GDP.PCAP.CD |
| Life expectancy at birth | SP.DYN.LE00.IN |
| Unemployment, total (ILO modelled) | SL.UEM.TOTL.ZS |
| Inflation, consumer prices | FP.CPI.TOTL.ZG |
| GDP growth (annual %) | NY.GDP.MKTP.KD.ZG |
| Individuals using the internet (% of population) | IT.NET.USER.ZS |
| Land area (sq. km, 2023) | AG.SRF.TOTL.K2 |

Countries: China, Germany, India, Indonesia, Japan, Malaysia, Philippines,
Singapore, South Korea, Thailand, United States, Vietnam. Figures are rounded
for display; the underlying values are the WDI values as published.

StatAtlas is an independent project, not affiliated with the World Bank, any
government, or any national statistics office.
