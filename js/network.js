// Related tools for the Ontario Self-Employed Tax Calculator footer
// Injected by network.js — single source of truth for related tools
(function() {
  var selfDomain = 'ontarioselfemployedtaxcalc.ca';

  var tools = [
    { name: 'Ontario Income Tax Calculator', url: 'https://ontarioincometaxcalc.ca/', desc: 'Full Ontario + federal income tax breakdown' },
    { name: 'Ontario Commission Tax Calculator', url: 'https://ontariocommissiontaxcalc.ca/', desc: 'Commission withholding estimates' },
    { name: 'Ontario Severance Pay Calculator', url: 'https://ontarioseverancepaycalc.ca/', desc: 'Severance pay and tax calculations' },
    { name: 'Ontario Bonus Tax Calculator', url: 'https://ontariobonustaxcalc.ca/', desc: 'Tax on bonus and lump-sum payments' },
    { name: 'Ontario Raise Calculator', url: 'https://ontarioraisecalc.ca/', desc: 'Tax impact of a salary increase' },
    { name: 'CPP Calculator', url: 'https://cppcalc.ca/', desc: 'CPP1 + CPP2 contribution breakdown' },
    { name: 'EI Calculator', url: 'https://eicalc.ca/', desc: 'EI premium calculation' }
  ];

  var container = document.getElementById('related-tools');
  if (!container) return;

  var html = '';
  for (var i = 0; i < tools.length; i++) {
    // Self-exclude: never link to own domain
    if (tools[i].url.indexOf(selfDomain) !== -1) continue;
    html += '<a href="' + tools[i].url + '" rel="noopener">' + tools[i].name + '</a>';
  }
  container.innerHTML = html;
})();
