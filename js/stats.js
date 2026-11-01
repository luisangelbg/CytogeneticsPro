/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — the statistics the blocks share: descriptive measures,
   the gamma, beta, chi-square and normal distributions, confidence intervals
   for a proportion and the tests of homogeneity used for meiosis, pollen and
   the Allium test. Written for this program from the mathematical
   definitions; no library. Every function is pure and works without a page,
   so the tests and the validation scripts call them directly. */
(function () {
  'use strict';

  /* ---------------- descriptive ---------------- */
  const sum = a => { let s = 0; for (const v of a) s += v; return s; };
  const mean = a => a.length ? sum(a) / a.length : NaN;
  /* the standard deviation: `pop` divides by n, otherwise by n − 1 (sample) */
  function sd(a, pop) {
    const n = a.length;
    if (n < (pop ? 1 : 2)) return NaN;
    const m = mean(a);
    let s = 0;
    for (const v of a) s += (v - m) * (v - m);
    return Math.sqrt(s / (pop ? n : n - 1));
  }
  const cv = (a, pop) => { const m = mean(a); return m === 0 ? NaN : sd(a, pop) / m; };
  function median(a) {
    if (!a.length) return NaN;
    const s = a.slice().sort((x, y) => x - y), h = s.length >> 1;
    return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
  }
  /* the most frequent value(s) of a list of integers or labels */
  function modes(a) {
    const f = new Map();
    for (const v of a) f.set(v, (f.get(v) || 0) + 1);
    let best = 0;
    f.forEach(c => { if (c > best) best = c; });
    const out = [];
    f.forEach((c, v) => { if (c === best) out.push(v); });
    return { modes: out.sort((x, y) => x - y), count: best, table: f };
  }

  /* ---------------- gamma ----------------
     ln Γ(x) by the Lanczos series (g = 7, nine terms), accurate to about 15
     significant digits for x > 0; the reflection formula covers x < 0.5. */
  const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function lgamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1;
    let a = LG[0];
    const t = x + 7.5;
    for (let i = 1; i < 9; i++) a += LG[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  /* regularized lower incomplete gamma P(a, x): the series converges well for
     x < a + 1; above it, the continued fraction for Q = 1 − P (modified Lentz) */
  function gammaP(a, x) {
    if (x <= 0) return 0;
    if (!isFinite(x)) return 1;
    if (x < a + 1) {
      let ap = a, del = 1 / a, s = del;
      for (let n = 0; n < 1000; n++) {
        ap += 1; del *= x / ap; s += del;
        if (Math.abs(del) < Math.abs(s) * 1e-16) break;
      }
      return Math.min(1, s * Math.exp(-x + a * Math.log(x) - lgamma(a)));
    }
    return 1 - gammaQcf(a, x);
  }
  function gammaQcf(a, x) {
    const tiny = 1e-300;
    let b = x + 1 - a, c = 1 / tiny, d = 1 / b, h = d;
    for (let i = 1; i < 1000; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b; if (Math.abs(d) < tiny) d = tiny;
      c = b + an / c; if (Math.abs(c) < tiny) c = tiny;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-16) break;
    }
    return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
  }
  function gammaQ(a, x) {
    if (x <= 0) return 1;
    if (!isFinite(x)) return 0;
    return x < a + 1 ? 1 - gammaP(a, x) : gammaQcf(a, x);
  }

  /* ---------------- chi-square and normal ---------------- */
  const chi2cdf = (x, df) => gammaP(df / 2, x / 2);
  const chi2sf = (x, df) => gammaQ(df / 2, x / 2);           // upper tail: the p-value
  /* erfc(x) = Q(1/2, x²) for x ≥ 0, which keeps full relative precision in the tail */
  const erfc = x => x >= 0 ? gammaQ(0.5, x * x) : 2 - gammaQ(0.5, x * x);
  const pnorm = z => 0.5 * erfc(-z / Math.SQRT2);
  /* the normal quantile: a rational first guess refined by Newton–Raphson steps
     on pnorm itself, so it is as exact as pnorm */
  function qnorm(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;
    const q = p < 0.5 ? p : 1 - p;
    const t = Math.sqrt(-2 * Math.log(q));
    let z = t - (2.515517 + 0.802853 * t + 0.010328 * t * t) / (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t);
    if (p < 0.5) z = -z;
    for (let i = 0; i < 6; i++) {
      const e = pnorm(z) - p, dens = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
      if (dens === 0) break;
      const step = e / dens;
      z -= step;
      if (Math.abs(step) < 1e-15 * Math.max(1, Math.abs(z))) break;
    }
    return z;
  }
  /* the chi-square quantile, by bisection on the cdf (used for tables only) */
  function qchi2(p, df) {
    let lo = 0, hi = Math.max(10, df * 4);
    while (chi2cdf(hi, df) < p) hi *= 2;
    for (let i = 0; i < 200; i++) {
      const m = (lo + hi) / 2;
      if (chi2cdf(m, df) < p) lo = m; else hi = m;
      if (hi - lo < 1e-13 * Math.max(1, hi)) break;
    }
    return (lo + hi) / 2;
  }

  /* ---------------- beta ----------------
     regularized incomplete beta I_x(a, b) by its continued fraction, using the
     symmetry I_x(a, b) = 1 − I_{1−x}(b, a) where the fraction converges faster */
  function betacf(a, b, x) {
    const tiny = 1e-300;
    let c = 1, d = 1 - (a + b) * x / (a + 1);
    if (Math.abs(d) < tiny) d = tiny;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= 1000; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny;
      c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
      d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny;
      c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-16) break;
    }
    return h;
  }
  function ibeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const lbt = lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x);
    if (x < (a + 1) / (a + b + 2)) return Math.exp(lbt) * betacf(a, b, x) / a;
    return 1 - Math.exp(lbt) * betacf(b, a, 1 - x) / b;
  }
  /* the quantile of the beta distribution, by bisection (monotone and safe) */
  function qbeta(p, a, b) {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let lo = 0, hi = 1;
    for (let i = 0; i < 200; i++) {
      const m = (lo + hi) / 2;
      if (ibeta(m, a, b) < p) lo = m; else hi = m;
      if (hi - lo < 1e-15) break;
    }
    return (lo + hi) / 2;
  }

  /* ---------------- a proportion ----------------
     Wilson (1927) score interval and the Clopper–Pearson (1934) exact interval */
  function wilson(x, n, conf) {
    if (!(n > 0)) return { p: NaN, lo: NaN, hi: NaN };
    const z = qnorm(1 - (1 - (conf || 0.95)) / 2), p = x / n, z2 = z * z;
    const den = 1 + z2 / n, mid = (p + z2 / (2 * n)) / den;
    const half = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / den;
    return { p, lo: Math.max(0, mid - half), hi: Math.min(1, mid + half) };
  }
  function clopperPearson(x, n, conf) {
    if (!(n > 0)) return { p: NaN, lo: NaN, hi: NaN };
    const a = 1 - (conf || 0.95);
    return {
      p: x / n,
      lo: x === 0 ? 0 : qbeta(a / 2, x, n - x + 1),
      hi: x === n ? 1 : qbeta(1 - a / 2, x + 1, n - x),
    };
  }

  /* ---------------- tests of homogeneity ----------------
     table: rows = groups (individuals, treatments), columns = categories.
     Pearson's chi-square and the G (log-likelihood ratio) statistic, with the
     degrees of freedom (r − 1)(c − 1) of the columns and rows that are not empty. */
  function contingency(table) {
    const rows = table.filter(r => sum(r) > 0);
    const nc = rows.length ? rows[0].length : 0;
    const colSum = new Array(nc).fill(0);
    rows.forEach(r => r.forEach((v, j) => { colSum[j] += v; }));
    const cols = colSum.map((v, j) => v > 0 ? j : -1).filter(j => j >= 0);
    const N = sum(colSum);
    let chi2 = 0, G = 0, minE = Infinity;
    const expected = rows.map(r => {
      const rs = sum(r);
      return cols.map(j => {
        const e = rs * colSum[j] / N, o = r[j];
        if (e < minE) minE = e;
        chi2 += (o - e) * (o - e) / e;
        if (o > 0) G += 2 * o * Math.log(o / e);
        return e;
      });
    });
    const df = (rows.length - 1) * (cols.length - 1);
    return {
      chi2, G, df, N, minExpected: minE, expected,
      p: df > 0 ? chi2sf(chi2, df) : NaN,
      pG: df > 0 ? chi2sf(G, df) : NaN,
      lowExpected: expected.flat().filter(e => e < 5).length,
      cells: expected.flat().length,
    };
  }
  /* goodness of fit of observed counts to expected counts (same order);
     `estimated` parameters are subtracted from the degrees of freedom */
  function goodnessOfFit(obs, exp, estimated) {
    let chi2 = 0, G = 0, k = 0;
    for (let i = 0; i < obs.length; i++) {
      if (!(exp[i] > 0)) continue;
      k++;
      chi2 += (obs[i] - exp[i]) * (obs[i] - exp[i]) / exp[i];
      if (obs[i] > 0) G += 2 * obs[i] * Math.log(obs[i] / exp[i]);
    }
    const df = k - 1 - (estimated || 0);
    return { chi2, G, df, p: df > 0 ? chi2sf(chi2, df) : NaN, pG: df > 0 ? chi2sf(G, df) : NaN };
  }
  /* two independent proportions x1/n1 and x2/n2: the pooled z test (two
     tailed), which equals the 2 × 2 chi-square without continuity correction */
  function twoProportions(x1, n1, x2, n2) {
    const p1 = x1 / n1, p2 = x2 / n2, pp = (x1 + x2) / (n1 + n2);
    const se = Math.sqrt(pp * (1 - pp) * (1 / n1 + 1 / n2));
    const z = se > 0 ? (p1 - p2) / se : 0;
    return { p1, p2, diff: p1 - p2, z, p: se > 0 ? 2 * pnorm(-Math.abs(z)) : 1 };
  }
  /* Holm's step-down adjustment of a list of p-values (keeps the order) */
  function holm(ps) {
    const idx = ps.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]);
    const out = new Array(ps.length);
    let run = 0;
    idx.forEach(([p, i], r) => { run = Math.max(run, Math.min(1, (ps.length - r) * p)); out[i] = run; });
    return out;
  }
  const bonferroni = ps => ps.map(p => Math.min(1, p * ps.length));

  /* Gower (1971) dissimilarity among rows of quantitative variables: the mean,
     over the variables both rows have, of |x_ik − x_jk| / range_k. A variable
     with no spread (range 0) or missing in one of the two rows is skipped. */
  function gower(X) {
    const n = X.length, p = n ? X[0].length : 0;
    const R = [];
    for (let k = 0; k < p; k++) {
      const v = X.map(r => r[k]).filter(x => isFinite(x));
      R.push(v.length ? Math.max(...v) - Math.min(...v) : 0);
    }
    const D = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      let s = 0, c = 0;
      for (let k = 0; k < p; k++) {
        const a = X[i][k], b = X[j][k];
        if (!isFinite(a) || !isFinite(b) || !(R[k] > 0)) continue;
        s += Math.abs(a - b) / R[k]; c++;
      }
      D[i][j] = D[j][i] = c ? s / c : NaN;
    }
    return D;
  }

  window.Stats = {
    gower,
    sum, mean, sd, cv, median, modes,
    lgamma, gammaP, gammaQ, chi2cdf, chi2sf, qchi2, erfc, pnorm, qnorm, ibeta, qbeta,
    wilson, clopperPearson, contingency, goodnessOfFit, twoProportions, holm, bonferroni,
  };
})();
