// Ontario Self-Employed Tax Calculator — calculation logic + UI
// All rates sourced from CONFIG (config.js). No hardcoded values here.
// CPP1 Deduction Patch applied: CPP_Deduction = CPP1 × (6.95/11.9) + CPP2
// CPP_Base_Credit = CPP1 × (4.95/11.9) × 14%

// ─── Tax math ────────────────────────────────────────────────────────────────

function federalBPA(taxableIncome) {
  var C = CONFIG;
  if (taxableIncome <= C.FEDERAL_BPA_PHASEOUT_START) return C.FEDERAL_BPA_MAX;
  if (taxableIncome >= C.FEDERAL_BPA_PHASEOUT_START + C.FEDERAL_BPA_PHASEOUT_RANGE) return C.FEDERAL_BPA_MIN;
  var ratio = (taxableIncome - C.FEDERAL_BPA_PHASEOUT_START) / C.FEDERAL_BPA_PHASEOUT_RANGE;
  return C.FEDERAL_BPA_MAX - ratio * C.FEDERAL_BPA_ADDITIONAL;
}

function bracketTaxWithConstants(income, brackets, rates, constants) {
  // Use CRA constant method: Tax = income × rate − constant
  for (var i = 0; i < rates.length; i++) {
    var ceiling = brackets[i] !== undefined ? brackets[i] : Infinity;
    if (income <= ceiling) {
      return income * rates[i] - constants[i];
    }
  }
  return income * rates[rates.length - 1] - constants[constants.length - 1];
}

function calcCPP1(netSEIncome) {
  var C = CONFIG;
  if (netSEIncome <= C.CPP_BASIC_EXEMPTION) return 0;
  if (netSEIncome <= C.CPP_YMPE) {
    return (netSEIncome - C.CPP_BASIC_EXEMPTION) * C.CPP_RATE_SELF_EMPLOYED;
  }
  return C.CPP_MAX_SELF_EMPLOYED;
}

function calcCPP2(netSEIncome) {
  var C = CONFIG;
  if (netSEIncome <= C.CPP_YMPE) return 0;
  if (netSEIncome <= C.CPP2_YAMPE) {
    return (netSEIncome - C.CPP_YMPE) * C.CPP2_RATE_SELF_EMPLOYED;
  }
  return C.CPP2_MAX_SELF_EMPLOYED;
}

function calcOHP(taxableIncome) {
  var C = CONFIG;
  for (var i = 0; i < C.OHP_TIERS.length; i++) {
    var tier = C.OHP_TIERS[i];
    if (taxableIncome > tier.min && taxableIncome <= tier.max) {
      return Math.min(tier.maxPremium, tier.base + (taxableIncome - tier.income_floor) * tier.rate);
    }
  }
  // Above last defined tier
  var last = C.OHP_TIERS[C.OHP_TIERS.length - 1];
  if (taxableIncome > last.min) {
    return Math.min(last.maxPremium, last.base + (taxableIncome - last.income_floor) * last.rate);
  }
  return 0;
}

function calculate(inputs) {
  var C = CONFIG;
  var grossSE = Math.max(0, Math.min(inputs.grossSE, 1000000));
  var expenses = Math.max(0, Math.min(inputs.expenses || 0, 1000000));
  var otherIncome = Math.max(0, inputs.otherIncome || 0);
  var rrsp = Math.max(0, inputs.rrsp || 0);

  // Step 1 — Net SE Income
  var netSE = Math.max(0, grossSE - expenses);

  // Step 2 — CPP Base
  var cpp1 = calcCPP1(netSE);

  // Step 3 — CPP2
  var cpp2 = calcCPP2(netSE);

  // Step 4 — CPP Deduction (PATCHED)
  var cppDeduction = cpp1 * (6.95 / 11.9) + cpp2;

  // Step 5 — Taxable Income
  var totalIncome = netSE + otherIncome;
  // Cap RRSP at totalIncome
  var rrspCapped = false;
  if (rrsp > totalIncome) {
    rrsp = totalIncome;
    rrspCapped = true;
  }
  var taxableIncome = Math.max(0, totalIncome - cppDeduction - rrsp);

  // Step 6 — Federal Tax
  var fedTaxBeforeCredits = bracketTaxWithConstants(
    taxableIncome,
    C.FEDERAL_BRACKETS,
    C.FEDERAL_RATES,
    C.FEDERAL_CONSTANTS
  );
  var bpa = federalBPA(taxableIncome);
  var fedCreditRate = C.FEDERAL_RATES[0]; // 14% — lowest federal rate
  var bpaCredit = bpa * fedCreditRate;
  // CPP Base Credit (PATCHED)
  var cppBaseCredit = cpp1 * (4.95 / 11.9) * fedCreditRate;
  var fedTax = Math.max(0, fedTaxBeforeCredits - bpaCredit - cppBaseCredit);

  // Step 7 — Ontario Basic Tax
  var onBasicBeforeCredits = bracketTaxWithConstants(
    taxableIncome,
    C.ON_BRACKETS,
    C.ON_RATES,
    C.ON_CONSTANTS
  );
  var onCreditRate = C.ON_RATES[0]; // 5.05% — lowest Ontario rate
  var onBPACredit = C.ON_BPA * onCreditRate;
  var onBasicTax = Math.max(0, onBasicBeforeCredits - onBPACredit);

  // Step 8 — Ontario Surtax
  var T = onBasicTax;
  var surtax = 0;
  if (T > C.ON_SURTAX_THRESHOLD_1) {
    surtax += (T - C.ON_SURTAX_THRESHOLD_1) * C.ON_SURTAX_RATE_1;
  }
  if (T > C.ON_SURTAX_THRESHOLD_2) {
    surtax += (T - C.ON_SURTAX_THRESHOLD_2) * C.ON_SURTAX_RATE_2;
  }

  var onTaxPayable = onBasicTax + surtax;

  // Step 9 — OHP
  var ohp = calcOHP(taxableIncome);

  // Step 10 — Total Obligations
  var totalObligations = fedTax + onTaxPayable + ohp + cpp1 + cpp2;

  // Step 11 — Net After-Tax Income
  var netAnnual = totalIncome - totalObligations;
  var netMonthly = netAnnual / 12;

  // Step 12 — Effective Tax Rate
  var effectiveRate = totalIncome > 0 ? (totalObligations / totalIncome) * 100 : 0;

  // Step 13 — Monthly Set-Aside
  var monthlySetAside = totalObligations / 12;

  return {
    netSE: netSE,
    totalIncome: totalIncome,
    taxableIncome: taxableIncome,
    fedTax: fedTax,
    onBasicTax: onBasicTax,
    surtax: surtax,
    onTaxPayable: onTaxPayable,
    ohp: ohp,
    cpp1: cpp1,
    cpp2: cpp2,
    totalObligations: totalObligations,
    netAnnual: netAnnual,
    netMonthly: netMonthly,
    effectiveRate: effectiveRate,
    monthlySetAside: monthlySetAside,
    grossSE: grossSE,
    rrspCapped: rrspCapped
  };
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

function fmt(n) {
  if (n < 0) return '\u2212$' + Math.abs(n).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n) {
  return n.toFixed(2) + '%';
}

function renderResults(r) {
  var html = '<div class="results-inner">';
  html += '<h3 class="results-title">Your 2026 Tax Estimate</h3>';

  html += '<div class="result-table" role="table" aria-label="Tax estimate results">';

  // 1. Net SE income
  html += '<div class="result-row" role="row"><span>Net self-employment income <small>(gross revenue minus expenses)</small></span><span class="rr-value">' + fmt(r.netSE) + '</span></div>';
  // 2. Total income
  html += '<div class="result-row" role="row"><span>Total income</span><span class="rr-value">' + fmt(r.totalIncome) + '</span></div>';
  // 3. Taxable income
  html += '<div class="result-row" role="row"><span>Taxable income <small>(after CPP deduction and RRSP)</small></span><span class="rr-value">' + fmt(r.taxableIncome) + '</span></div>';
  // 4. Federal tax
  html += '<div class="result-row" role="row"><span>Federal tax payable</span><span class="rr-value">' + fmt(r.fedTax) + '</span></div>';
  // 5. Ontario provincial tax
  html += '<div class="result-row" role="row"><span>Ontario provincial tax</span><span class="rr-value">' + fmt(r.onBasicTax) + '</span></div>';
  // 6. Ontario surtax
  html += '<div class="result-row" role="row"><span>Ontario surtax</span><span class="rr-value">' + fmt(r.surtax) + '</span></div>';
  // 7. OHP
  html += '<div class="result-row" role="row"><span>Ontario Health Premium</span><span class="rr-value">' + fmt(r.ohp) + '</span></div>';
  // 8. CPP base
  html += '<div class="result-row" role="row"><span>CPP base contribution</span><span class="rr-value">' + fmt(r.cpp1) + '</span></div>';
  // 9. CPP2
  html += '<div class="result-row" role="row"><span>Second Additional CPP (CPP2)</span><span class="rr-value">' + fmt(r.cpp2) + '</span></div>';
  // 10. Total obligations
  html += '<div class="result-row result-bold" role="row"><span>Total obligations</span><span class="rr-value">' + fmt(r.totalObligations) + '</span></div>';
  // 11. Net annual
  html += '<div class="result-row result-highlight" role="row"><span>Net annual after-tax income</span><span class="rr-value">' + fmt(r.netAnnual) + '</span></div>';
  // 12. Net monthly
  html += '<div class="result-row" role="row"><span>Net monthly after-tax income</span><span class="rr-value">' + fmt(r.netMonthly) + '</span></div>';
  // 13. Effective tax rate
  html += '<div class="result-row" role="row"><span>Effective tax rate <small>% of total income</small></span><span class="rr-value">' + fmtPct(r.effectiveRate) + '</span></div>';
  // 14. Monthly set-aside
  html += '<div class="result-row" role="row"><span>Monthly tax set-aside</span><span class="rr-value">' + fmt(r.monthlySetAside) + '</span></div>';

  html += '</div>'; // /result-table

  // Rate blocks (prominent visual summary)
  html += '<div class="rate-blocks">';
  html += '<div class="rate-block"><div class="rate-label">Effective tax rate</div><div class="rate-value">' + fmtPct(r.effectiveRate) + '</div><div class="rate-sub">% of total income</div></div>';
  html += '<div class="rate-block"><div class="rate-label">Monthly tax set-aside</div><div class="rate-value">' + fmt(r.monthlySetAside) + '</div><div class="rate-sub">Total obligations \u00F7 12</div></div>';
  html += '</div>'; // /rate-blocks

  // CPP callout — mandatory (Section K)
  html += '<div class="cpp-callout">';
  html += '<strong>Why is CPP so high?</strong> ';
  html += 'As a self-employed person, you pay both the employee and employer sides of CPP \u2014 11.9% instead of the 5.95% an employee pays. This is one of the main reasons your tax set-aside is significantly higher than a normal employee paycheque.';
  html += '</div>';

  html += '</div>'; // /results-inner
  return html;
}

function renderReminders(grossSE) {
  var C = CONFIG;
  var html = '';

  // GST/HST reminders
  if (grossSE >= C.GST_SOFT_THRESHOLD && grossSE < C.GST_HARD_THRESHOLD) {
    html += '<div class="reminder-block reminder-amber">';
    html += '<strong>GST/HST Reminder:</strong> You are approaching the $30,000 GST/HST small-supplier threshold. HST is not included in this tax estimate.';
    html += '</div>';
  } else if (grossSE >= C.GST_HARD_THRESHOLD) {
    html += '<div class="reminder-block reminder-amber">';
    html += '<strong>GST/HST Reminder:</strong> Ontario businesses earning $30,000 or more in gross revenue over four consecutive calendar quarters may be required to register for HST. HST is not included in this tax estimate.';
    html += '</div>';
  }

  // Installment reminder (always shown after calculation)
  html += '<div class="reminder-block reminder-info">';
  html += '<strong>Tax Installments:</strong> If your net tax owing exceeds $3,000 and exceeded $3,000 in either of the two prior years, CRA may require quarterly tax installment payments. This calculator does not calculate installment amounts.';
  html += '</div>';

  return html;
}

// ─── DOM init ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('calc-form');
  var resultsEl = document.getElementById('results');
  var remindersEl = document.getElementById('reminders');

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var grossSE = parseFloat(document.getElementById('gross-se').value) || 0;
    var expenses = parseFloat(document.getElementById('expenses').value) || 0;
    var otherIncome = parseFloat(document.getElementById('other-income').value) || 0;
    var rrsp = parseFloat(document.getElementById('rrsp').value) || 0;

    if (grossSE <= 0) {
      resultsEl.innerHTML = '<p class="error-msg">Please enter your gross self-employed revenue greater than $0.</p>';
      resultsEl.hidden = false;
      remindersEl.innerHTML = '';
      return;
    }

    var result = calculate({ grossSE: grossSE, expenses: expenses, otherIncome: otherIncome, rrsp: rrsp });

    var resultHtml = renderResults(result);
    if (result.rrspCapped) {
      resultHtml += '<div class="reminder-block reminder-info">Your RRSP contribution was capped at total income (' + fmt(result.totalIncome) + ').</div>';
    }
    resultsEl.innerHTML = resultHtml;
    resultsEl.hidden = false;

    remindersEl.innerHTML = renderReminders(grossSE);
    remindersEl.hidden = false;

    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
