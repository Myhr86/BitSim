# Game Balance

All numbers live in `src/data/balance.ts`. This document explains the intent.
Validate changes with `SIM_LIVES=1000 npm run sim`.

## Targets (headless bot that never visits a doctor)
| Metric | Target | Last run (300 lives) |
|---|---|---|
| Mean age at death | 65–92 | 72.6 |
| Median age at death | ~75–82 | 77 |
| Deaths before 40 | < 12 % | 4.7 % |
| Median real net worth at death | < 60 M | 5.8 M |
| Max peak real net worth | < 5 bn | 341 M |
| Max repeats of one event in a life | ≤ 6 | 3 |
| Median unique events per life | > 40 | 110 |

Human players who treat illnesses, exercise and avoid addictions live noticeably longer.

## Mortality
`q = base · e^(growth·age)` with `base = 0.00003`, `growth = 0.098` (≈ 0.06 % at 30,
0.4 % at 50, 2.9 % at 70, 7.7 % at 80, 21 % at 90). Multiplied by a health factor
(0.8 when healthy up to 8× when health < 15), genetics, conditions (× 0.6 of their
listed mortality, × 0.4 when treated), addictions and difficulty (0.7 / 1 / 1.35).
Children's baseline is halved; random child deaths are very rare.

## Health, fitness, stress
Each moves 20–35 % of the way to a target per year:
- Health target = 94 − (age−35)^1.5 · 0.088 + fitness, genetics and stress modifiers.
- Fitness target declines 0.55/year after 25; exercise lifts above it temporarily.
- Stress target derives from job stress × effort, studies, unemployment, consumer debt,
  small children, traits and prison.
This makes stats responsive to lifestyle while preventing runaway accumulation.

## Economy
Phase switch probability 12 % + 4 %/year in phase. Inflation 0–4.5 %, policy rate
bounded 0.5–7 %, stock returns −30 %…+22 % by phase, housing −8 %…+10 % plus a share of
inflation. Over 100 years the price index lands roughly at 5–15×.
Wealth: investment returns are scaled down above a real net worth of 100 M NOK.

## Money
Living costs (single adult/year): 120k frugal · 170k normal · 260k comfortable ·
520k luxury; lifestyle gives −4…+6 happiness. Rent 108–204k by city size. Child cost
60k/year, child benefit 20k. Unemployment benefit 62.4 % of last salary for 2 years,
then social assistance. Minimum pension 230k. Pension = accrual (18.1 % of salary up to
a cap) / 17, reduced 6 %/year for early retirement, plus 2 % employer saving paid out
over the remaining years. Adults living at home contribute up to 30 % of living costs,
capped at 25 % of their own income.

## Events
1–3 random events per year (1 for babies), at most 2 decisions per year. Default cooldown
4 years, default max 2 occurrences (1 for milestones/priority). Same-category events in
a year are penalised (× 0.35), already-seen events halved.

## Activities & relationships
Repeating an activity in the same year multiplies its stat effects by 0.55ⁿ. Each
activity has a yearly limit. Each relationship allows 6 interactions per year with the
same diminishing factor.

## Careers
Up to 4 applications per year. Hire chance 55 % base ± intelligence, appearance,
reputation, discipline, grades; −unemployment rate × 2, −20 % with a criminal record.
Promotion needs performance ≥ 72 and years in role ≥ 2 + level. Below 22 performance
there is a 45 %/year firing risk. Recession layoffs 4 %/year.
