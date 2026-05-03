const H = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kelly — Your Property Plan</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f8;color:#1a202c;min-height:100vh}
.hero{background:linear-gradient(135deg,#1a365d 0%,#2a4a7f 100%);padding:40px 24px 32px;color:#fff;text-align:center}
.hero .tag{display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:.06em;margin-bottom:16px}
.hero h1{font-size:28px;font-weight:900;margin-bottom:6px}
.hero p{color:#90cdf4;font-size:15px;max-width:520px;margin:0 auto;line-height:1.6}
.headline-stat{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:16px;padding:24px;margin:24px auto 0;max-width:500px}
.hs-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.hs-item .num{font-size:44px;font-weight:900;line-height:1}
.hs-item .desc{font-size:13px;margin-top:5px}
.hs-item.green .num{color:#68d391}.hs-item.green .desc{color:#9ae6b4}
.hs-item.blue .num{color:#90cdf4}.hs-item.blue .desc{color:#63b3ed}
.page{max-width:960px;margin:0 auto;padding:28px 16px}
.alert-box{background:#fff;border-left:5px solid #e53e3e;border-radius:12px;padding:20px 24px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.alert-box .atitle{font-size:16px;font-weight:800;color:#c53030;margin-bottom:8px}
.alert-box p{font-size:14px;color:#4a5568;line-height:1.7}
.alert-box strong{color:#c53030}
.why-section{background:#fff;border-radius:16px;padding:28px;margin-bottom:24px;border-left:5px solid #2b6cb0;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.why-section h2{font-size:20px;font-weight:800;color:#1a365d;margin-bottom:4px}
.why-section .sub{font-size:14px;color:#718096;margin-bottom:20px}
.why-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}
.why-item{background:#ebf8ff;border-radius:10px;padding:16px}
.why-item .icon{font-size:22px;margin-bottom:8px}
.why-item .title{font-size:14px;font-weight:700;color:#1a365d;margin-bottom:4px}
.why-item .desc{font-size:13px;color:#2c5282;line-height:1.55}
.vs-section{background:#fff;border-radius:16px;padding:28px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.vs-section h2{font-size:18px;font-weight:800;color:#1a202c;margin-bottom:6px}
.vs-section .sub{font-size:13px;color:#718096;margin-bottom:18px}
.vs-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:2px solid #e2e8f0;border-radius:12px;overflow:hidden}
@media(max-width:600px){.vs-grid{grid-template-columns:1fr}.why-grid{grid-template-columns:1fr}.hs-grid{grid-template-columns:1fr}.inputs-grid{grid-template-columns:1fr}}
.vs-col{padding:20px}
.vs-col.before{background:#fff5f5;border-right:2px solid #e2e8f0}
.vs-col.after{background:#f0fff4}
.vs-col h3{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:14px}
.vs-col.before h3{color:#c53030}.vs-col.after h3{color:#276749}
.vline{display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.08)}
.vline:last-child{border:none}
.vl{color:#718096}.vv{font-weight:700}
.pos{color:#276749}.neg{color:#c53030}.muted{color:#a0aec0}.blue{color:#2b6cb0}
.vtotal{display:flex;justify-content:space-between;font-size:16px;font-weight:800;padding:12px 0 0;margin-top:8px;border-top:2px solid rgba(0,0,0,.12)}
.calc-section{background:#fff;border-radius:16px;padding:28px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.calc-section h2{font-size:18px;font-weight:800;margin-bottom:6px}
.calc-section .sub{font-size:13px;color:#718096;margin-bottom:18px}
.inputs-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
.inp{display:flex;flex-direction:column;gap:4px}
.inp label{font-size:11px;font-weight:700;color:#718096;text-transform:uppercase;letter-spacing:.04em}
.inp input{padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:15px;font-weight:600;color:#1a202c;background:#f7fafc;transition:.15s}
.inp input:focus{outline:none;border-color:#3182ce;background:#fff}
.hint{font-size:11px;color:#a0aec0}
.results-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px}
.rcard{border-radius:10px;padding:16px;text-align:center}
.rcard.green{background:#f0fff4;border:1.5px solid #9ae6b4}
.rcard.blue{background:#ebf8ff;border:1.5px solid #90cdf4}
.rcard.yellow{background:#fffff0;border:1.5px solid #faf089}
.rcard.purple{background:#faf5ff;border:1.5px solid #d6bcfa}
.rcard .rv{font-size:24px;font-weight:800;margin-bottom:4px}
.rcard .rl{font-size:12px;color:#718096}
.rcard.green .rv{color:#276749}.rcard.blue .rv{color:#2b6cb0}.rcard.yellow .rv{color:#744210}.rcard.purple .rv{color:#553c9a}
.tax-box{background:#fffff0;border:1.5px solid #faf089;border-radius:12px;padding:20px;margin-bottom:14px}
.tax-box h3{font-size:13px;font-weight:700;color:#744210;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px}
.lt-section{background:#fff;border-radius:16px;padding:28px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.lt-section h2{font-size:18px;font-weight:800;margin-bottom:6px}
.lt-section .sub{font-size:13px;color:#718096;margin-bottom:18px}
.lt-table{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:18px}
.lt-table th{text-align:left;padding:10px 12px;font-size:11px;color:#a0aec0;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0}
.lt-table td{padding:11px 12px;border-bottom:1px solid #f7fafc;font-weight:600}
.lt-table tr:last-child td{border:none;font-weight:800;background:#f7fafc}
.cgt-box{background:linear-gradient(135deg,#44337a 0%,#6b46c1 100%);color:#fff;border-radius:14px;padding:24px;text-align:center;margin-bottom:16px}
.cgt-box .num{font-size:52px;font-weight:900;line-height:1;color:#d6bcfa}
.cgt-box .label{font-size:14px;color:#e9d8fd;margin-top:6px}
.cgt-box .csub{font-size:12px;color:#b794f4;margin-top:5px}
.summary-box{background:linear-gradient(135deg,#1a365d 0%,#2a4a7f 100%);color:#fff;border-radius:14px;padding:28px;text-align:center}
.summary-box .big{font-size:52px;font-weight:900;line-height:1;color:#68d391}
.summary-box .label{font-size:15px;color:#90cdf4;margin-top:8px;font-weight:600}
.summary-box .ssub{font-size:13px;color:#63b3ed;margin-top:6px;line-height:1.6}

.ret-section{background:#fff;border-radius:16px;padding:28px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.ret-section h2{font-size:18px;font-weight:800;margin-bottom:6px;color:#1a202c}
.ret-section .sub{font-size:13px;color:#718096;margin-bottom:16px}
.sav-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:18px}
@media(max-width:600px){.sav-row{grid-template-columns:1fr}}
.ex-table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px}
.ex-table th{text-align:right;padding:8px 10px;font-size:11px;color:#a0aec0;text-transform:uppercase;border-bottom:2px solid #e2e8f0}
.ex-table th:first-child{text-align:left}
.ex-table td{padding:9px 10px;border-bottom:1px solid #f7fafc;font-weight:600;text-align:right}
.ex-table td:first-child{text-align:left;color:#718096;font-weight:400;font-size:13px}
.ex-table tr.total-row td{font-weight:800;background:#f0fff4;color:#276749;font-size:14px}
.cmp-table{width:100%;border-collapse:collapse;font-size:13px;margin:12px 0 16px}
.cmp-table th{padding:8px 10px;font-size:11px;text-transform:uppercase;border:none;text-align:right}
.cmp-table th:first-child{text-align:left}
.cmp-table td{padding:9px 10px;border-bottom:1px solid #f7fafc;font-weight:600;text-align:right}
.cmp-table td:first-child{text-align:left;color:#718096;font-weight:400}
.cmp-with{color:#276749}.cmp-wo{color:#c53030}.cmp-diff{color:#2b6cb0;font-weight:800}
.fi-box{border-radius:14px;padding:24px;text-align:center;margin-top:16px}
.fi-box.green{background:linear-gradient(135deg,#276749,#38a169)}
.fi-box.purple{background:linear-gradient(135deg,#44337a,#6b46c1)}
.fi-box .big{font-size:48px;font-weight:900;line-height:1}
.fi-box.green .big{color:#9ae6b4}.fi-box.purple .big{color:#d6bcfa}
.fi-box .flabel{font-size:14px;margin-top:8px;font-weight:600;color:rgba(255,255,255,.9)}
.fi-box .fsub{font-size:12px;margin-top:6px;line-height:1.7;color:rgba(255,255,255,.75)}
</style>
</head>
<body>
<div class="hero">
  <div class="tag">KELLY — 713/90 BUCKLEY ST, FOOTSCRAY</div>
  <h1>You get a better home AND a free investment property</h1>
  <p>Osborne St is more space in Williamstown. Paddy's renting it regardless — the question is whether family gets it first. Here's what it does for you financially.</p>
  <div class="headline-stat">
    <div class="hs-grid">
      <div class="hs-item green"><div class="num" id="hero-cost">~$17</div><div class="desc">per week to hold your Footscray IP</div></div>
      <div class="hs-item blue"><div class="num" id="hero-cgt">~$32k</div><div class="desc">in CGT you won't pay (6-yr rule)</div></div>
    </div>
  </div>
</div>

<div class="page">

  <div class="alert-box">
    <div class="atitle">⚠️ The alternative — what happens if you don't do this</div>
    <p>Paddy is moving to Cecil St and renting Osborne St regardless. If you don't take it, <strong>a stranger moves in</strong>. You stay in Footscray paying your mortgage with zero tax deductions, zero rental income, and no access to a bigger home in Williamstown. This arrangement costs Paddy nothing either way — it only matters to you.</p>
  </div>

  <div class="why-section">
    <h2>Why this is good for you — 6 reasons</h2>
    <p class="sub">This isn't just a financial arrangement. It's a genuinely better situation in every dimension.</p>
    <div class="why-grid">
      <div class="why-item">
        <div class="icon">🏡</div>
        <div class="title">You get a better home</div>
        <div class="desc">Osborne St is more space than your Footscray apartment — and it's in Williamstown, a waterside suburb you couldn't easily access otherwise.</div>
      </div>
      <div class="why-item">
        <div class="icon">💰</div>
        <div class="title">Monica covers your mortgage</div>
        <div class="desc">Her $580/wk rent covers 100% of your $471/wk repayment. You hold a $500k+ Footscray asset for almost nothing out of pocket.</div>
      </div>
      <div class="why-item">
        <div class="icon">🏛️</div>
        <div class="title">The ATO pays you back</div>
        <div class="desc">Interest, body corp, rates, insurance and depreciation all become tax-deductible. At 37¢ per dollar that's a significant refund — in your pay packet fortnightly via PAYG variation.</div>
      </div>
      <div class="why-item">
        <div class="icon">🛡️</div>
        <div class="title">$0 CGT for 6 years</div>
        <div class="desc">713 Buckley stays as your PPOR for tax purposes for up to 6 years. If Footscray grows $100k and you sell — every cent is yours, tax-free.</div>
      </div>
      <div class="why-item">
        <div class="icon">📈</div>
        <div class="title">Equity builds while you're gone</div>
        <div class="desc">Monica pays down your mortgage AND Footscray appreciates. You're building wealth two ways without spending another dollar.</div>
      </div>
      <div class="why-item">
        <div class="icon">👨‍👩‍👧</div>
        <div class="title">It's family — not a stranger</div>
        <div class="desc">Monica is your tenant, not someone you've never met. Paddy is your landlord, not a corporation. Flexibility both ways, people you trust.</div>
      </div>
    </div>
  </div>

  <div class="vs-section">
    <h2>Before vs After — Your weekly numbers</h2>
    <p class="sub">What actually changes in your finances each week</p>
    <div class="vs-grid">
      <div class="vs-col before">
        <h3>❌ Without the arrangement</h3>
        <div class="vline"><span class="vl">Mortgage repayment</span><span class="vv neg" id="b-mort"></span></div>
        <div class="vline"><span class="vl">Body corp</span><span class="vv neg" id="b-bc"></span></div>
        <div class="vline"><span class="vl">Council rates</span><span class="vv neg" id="b-rates"></span></div>
        <div class="vline"><span class="vl">Rental income</span><span class="vv muted">$0</span></div>
        <div class="vline"><span class="vl">Tax deductions</span><span class="vv muted">None — it's your home</span></div>
        <div class="vtotal"><span>Weekly cost of 713 Buckley</span><span class="neg" id="b-total"></span></div>
      </div>
      <div class="vs-col after">
        <h3>✅ With the arrangement</h3>
        <div class="vline"><span class="vl">Monica pays you rent</span><span class="vv pos" id="a-rin"></span></div>
        <div class="vline"><span class="vl">Mortgage repayment</span><span class="vv neg" id="a-mort"></span></div>
        <div class="vline"><span class="vl">Body corp + rates</span><span class="vv neg" id="a-bcr"></span></div>
        <div class="vline"><span class="vl">Insurance + maintenance</span><span class="vv neg" id="a-im"></span></div>
        <div class="vline"><span class="vl">ATO tax refund (in your pay)</span><span class="vv pos" id="a-tax"></span></div>
        <div class="vtotal"><span>Net weekly cost of your IP</span><span id="a-net"></span></div>
      </div>
    </div>
    <p style="font-size:12px;color:#a0aec0;margin-top:10px;text-align:center">You pay Paddy $<span id="note-ro">650</span>/wk for Osborne St — comparable to renting anywhere in Williamstown, but this keeps it in the family and the money stays close.</p>
  </div>

  <div class="calc-section">
    <h2>⚙️ Your figures — edit anything</h2>
    <p class="sub">All numbers update live. Pre-filled with confirmed figures — adjust if anything's changed.</p>
    <div class="inputs-grid">
      <div class="inp"><label>Annual Salary ($)</label><input id="salary" type="number" value="85000"></div>
      <div class="inp"><label>Loan Balance ($)</label><input id="loan" type="number" value="365563"></div>
      <div class="inp"><label>Interest Rate (%)</label><input id="rate" type="number" value="5.89" step="0.01"></div>
      <div class="inp"><label>Monthly Repayment ($)</label><input id="repayment" type="number" value="2446"><span class="hint">Confirmed from bank</span></div>
      <div class="inp"><label>Rent Monica Pays You ($/wk)</label><input id="rent_in" type="number" value="580"></div>
      <div class="inp"><label>Rent You Pay Paddy ($/wk)</label><input id="rent_out" type="number" value="650"></div>
      <div class="inp"><label>Body Corporate ($/wk)</label><input id="bc" type="number" value="38"></div>
      <div class="inp"><label>Council Rates ($/wk)</label><input id="rates" type="number" value="28"></div>
      <div class="inp"><label>Landlord Insurance ($/wk)</label><input id="ins" type="number" value="26"></div>
      <div class="inp"><label>Maintenance avg ($/wk)</label><input id="maint" type="number" value="12"></div>
      <div class="inp"><label>Depreciation $/yr (QS report)</label><input id="dep" type="number" value="8500"><span class="hint">Paper deduction — no cash outlay</span></div>
      <div class="inp"><label>Current Property Value ($)</label><input id="propval" type="number" value="500000"></div>
      <div class="inp"><label>Annual Growth Rate (%)</label><input id="growth" type="number" value="6" step="0.5"><span class="hint">Footscray 10yr avg ~6–7%</span></div>
    </div>
    <div class="results-grid">
      <div class="rcard green"><div class="rv" id="r-hold">—</div><div class="rl">Weekly cost to hold your IP</div></div>
      <div class="rcard yellow"><div class="rv" id="r-taxyr">—</div><div class="rl">Annual ATO tax saving</div></div>
      <div class="rcard blue"><div class="rv" id="r-taxwk">—</div><div class="rl">Weekly in your pay (PAYG)</div></div>
      <div class="rcard purple"><div class="rv" id="r-improvement">—</div><div class="rl">Better than not doing it</div></div>
    </div>
    <div class="tax-box">
      <h3>Annual Tax Deductions — Every line itemised</h3>
      <div class="vline"><span class="vl">Mortgage interest (only the interest portion)</span><span class="vv blue" id="t-int"></span></div>
      <div class="vline"><span class="vl">Body corporate</span><span class="vv blue" id="t-bc"></span></div>
      <div class="vline"><span class="vl">Council rates</span><span class="vv blue" id="t-rates"></span></div>
      <div class="vline"><span class="vl">Landlord insurance</span><span class="vv blue" id="t-ins"></span></div>
      <div class="vline"><span class="vl">Maintenance</span><span class="vv blue" id="t-maint"></span></div>
      <div class="vline"><span class="vl">Depreciation — fittings &amp; structure (paper claim, no cash outlay)</span><span class="vv blue" id="t-dep"></span></div>
      <div class="vtotal"><span>Total deductions · <span id="t-br"></span>% tax bracket · annual saving</span><span class="pos" id="t-total"></span></div>
    </div>
  </div>

  <div class="lt-section">
    <h2>📈 The long-term picture</h2>
    <p class="sub">What holding this asset does for your wealth over time — while Monica covers the mortgage and the ATO covers the gap</p>
    <table class="lt-table">
      <thead><tr><th></th><th>Today</th><th>Year 3</th><th>Year 5</th><th>Year 10</th></tr></thead>
      <tbody>
        <tr><td>713 Buckley value</td><td id="lt-v0"></td><td id="lt-v3"></td><td id="lt-v5"></td><td id="lt-v10"></td></tr>
        <tr><td>Loan remaining</td><td id="lt-l0"></td><td id="lt-l3"></td><td id="lt-l5"></td><td id="lt-l10"></td></tr>
        <tr><td>Your equity</td><td id="lt-e0"></td><td id="lt-e3"></td><td id="lt-e5"></td><td id="lt-e10"></td></tr>
        <tr><td>Cumulative tax saved</td><td>—</td><td id="lt-t3"></td><td id="lt-t5"></td><td id="lt-t10"></td></tr>
      </tbody>
    </table>
    <div class="cgt-box">
      <div class="num" id="cgt-saved">$0</div>
      <div class="label">in capital gains tax you won't pay — if you sell within 6 years</div>
      <div class="csub">ATO 6-year absence rule. 713 Buckley stays your PPOR. Every dollar of growth is tax-free. This protection is automatic — just don't nominate another property as PPOR.</div>
    </div>
    <div class="summary-box">
      <div class="big" id="lt-total10">$0</div>
      <div class="label">Estimated total wealth built over 10 years</div>
      <div class="ssub">Property growth in Footscray + loan paid down (by Monica) + 10 years of ATO tax savings.<br>For an IP that costs you <span id="lt-costhero">~$17</span>/week to hold. You also live in a better home.</div>
    </div>
  
  <div class="ret-section">
    <h2>🎯 Your retirement timeline — the 10-years-earlier story</h2>
    <p class="sub">The strategy works because you redirect the freed-up cash. This calculator shows your actual acceleration. Adjust any input — everything updates live.</p>
    <div class="sav-row">
      <div class="inp"><label>Monthly savings redirected ($)</label><input id="sav-mo" type="number" value="1500"><span class="hint">Into offset or super each month</span></div>
      <div class="inp"><label>Savings return (%/yr)</label><input id="sav-ret" type="number" value="7" step="0.5"><span class="hint">Offset ≈ mortgage rate; super ~8%</span></div>
      <div class="inp"><label>Financial independence target ($)</label><input id="fi-target" type="number" value="1000000"><span class="hint">Total wealth to retire on</span></div>
    </div>
    <h3 style="font-size:13px;font-weight:700;color:#1a365d;margin-bottom:10px;text-transform:uppercase;letter-spacing:.04em">Extended projection — IP equity + savings</h3>
    <table class="ex-table">
      <thead><tr><th></th><th>Year 5</th><th>Year 10</th><th>Year 15</th><th>Year 20</th></tr></thead>
      <tbody>
        <tr><td>713 Buckley value</td><td id="ex-v5"></td><td id="ex-v10"></td><td id="ex-v15"></td><td id="ex-v20"></td></tr>
        <tr><td>Loan remaining</td><td id="ex-l5"></td><td id="ex-l10"></td><td id="ex-l15"></td><td id="ex-l20"></td></tr>
        <tr><td>IP equity</td><td id="ex-e5"></td><td id="ex-e10"></td><td id="ex-e15"></td><td id="ex-e20"></td></tr>
        <tr><td>Savings (offset/super)</td><td id="ex-s5"></td><td id="ex-s10"></td><td id="ex-s15"></td><td id="ex-s20"></td></tr>
        <tr class="total-row"><td>Total wealth position</td><td id="ex-t5"></td><td id="ex-t10"></td><td id="ex-t15"></td><td id="ex-t20"></td></tr>
      </tbody>
    </table>
    <h3 style="font-size:13px;font-weight:700;color:#1a365d;margin:16px 0 8px;text-transform:uppercase;letter-spacing:.04em">With strategy vs owner-occupier</h3>
    <p style="font-size:12px;color:#718096;margin-bottom:10px">Owner-occupier: same property growth, but paying 100% of mortgage out of pocket — no savings buffer, no tax benefit.</p>
    <table class="cmp-table">
      <thead><tr style="background:#1a365d"><th style="color:#fff;text-align:left;padding:8px 10px">Scenario</th><th style="color:#fff;padding:8px 10px">Year 5</th><th style="color:#fff;padding:8px 10px">Year 10</th><th style="color:#fff;padding:8px 10px">Year 15</th><th style="color:#fff;padding:8px 10px">Year 20</th></tr></thead>
      <tbody>
        <tr><td>✅ With strategy (equity + savings)</td><td id="cmp-with5" class="cmp-with"></td><td id="cmp-with10" class="cmp-with"></td><td id="cmp-with15" class="cmp-with"></td><td id="cmp-with20" class="cmp-with"></td></tr>
        <tr><td>❌ Owner-occupier (equity only)</td><td id="cmp-wo5" class="cmp-wo"></td><td id="cmp-wo10" class="cmp-wo"></td><td id="cmp-wo15" class="cmp-wo"></td><td id="cmp-wo20" class="cmp-wo"></td></tr>
        <tr><td>⚡ Extra wealth from strategy</td><td id="cmp-diff5" class="cmp-diff"></td><td id="cmp-diff10" class="cmp-diff"></td><td id="cmp-diff15" class="cmp-diff"></td><td id="cmp-diff20" class="cmp-diff"></td></tr>
      </tbody>
    </table>
    <div class="fi-box green">
      <div class="big" id="fi-year">—</div>
      <div class="flabel">years until you hit your $<span id="fi-target-show">1M</span> financial independence target</div>
      <div class="fsub">That is <strong id="fi-saving" style="color:#fff">—</strong> vs staying owner-occupier.<br>Change the monthly savings and target above to model your real scenario.</div>
    </div>
  </div>

</div>
<script>
const $=id=>document.getElementById(id);
const fmt=(n,p)=>(n>=0&&p?'+':n<0?'-':'')+'$'+Math.abs(Math.round(n)).toLocaleString();
const fwk=n=>fmt(n,n>0)+'/wk';
const br=s=>s<=18200?0:s<=45000?19:s<=120000?32.5:s<=180000?37:45;
const fv=(v,r,y)=>v*Math.pow(1+r/100,y);
function lbal(b,r,m,y){let x=b,mr=r/100/12;for(let i=0;i<y*12;i++){x=x*(1+mr)-m;if(x<0)x=0;}return x;}
function calc(){
  const sal=+$('salary').value||0,loan=+$('loan').value||0,rate=+$('rate').value||0;
  const rep=+$('repayment').value||0,ri=+$('rent_in').value||0,ro=+$('rent_out').value||0;
  const bc=+$('bc').value||0,rates=+$('rates').value||0,ins=+$('ins').value||0;
  const maint=+$('maint').value||0,dep=+$('dep').value||0;
  const pv=+$('propval').value||0,gr=+$('growth').value||0;
  const repWk=rep*12/52,bcr=bc+rates;
  const beforeWk=repWk+bcr;
  const pretax=ri-repWk-bcr-ins-maint;
  const intYr=loan*(rate/100);
  const ded=intYr+bc*52+rates*52+ins*52+maint*52+dep;
  const b=br(sal),taxYr=ded*(b/100),taxWk=taxYr/52;
  const netHold=pretax+taxWk;
  const improvement=beforeWk-Math.abs(Math.min(0,netHold));
  $('b-mort').textContent=fwk(-repWk);$('b-bc').textContent=fwk(-bc);$('b-rates').textContent=fwk(-rates);
  $('b-total').textContent=fwk(-beforeWk);
  $('a-rin').textContent=fwk(ri);$('a-mort').textContent=fwk(-repWk);
  $('a-bcr').textContent=fwk(-bcr);$('a-im').textContent=fwk(-(ins+maint));
  $('a-tax').textContent=fmt(taxWk,true)+'/wk';
  $('a-net').textContent=fwk(netHold);$('a-net').className='vv '+(netHold>=-5?'pos':'neg');
  $('note-ro').textContent=ro;
  $('hero-cost').textContent=fwk(netHold);
  $('r-hold').textContent=fwk(netHold);$('r-taxyr').textContent=fmt(taxYr,true)+'/yr';
  $('r-taxwk').textContent=fmt(taxWk,true)+'/wk';$('r-improvement').textContent=fmt(improvement,true)+'/wk';
  $('t-int').textContent=fmt(intYr,true)+'/yr';$('t-bc').textContent=fmt(bc*52,true)+'/yr';
  $('t-rates').textContent=fmt(rates*52,true)+'/yr';$('t-ins').textContent=fmt(ins*52,true)+'/yr';
  $('t-maint').textContent=fmt(maint*52,true)+'/yr';$('t-dep').textContent=fmt(dep,true)+'/yr';
  $('t-br').textContent=b+'%';$('t-total').textContent=fmt(taxYr,true)+'/yr';
  const v3=fv(pv,gr,3),v5=fv(pv,gr,5),v10=fv(pv,gr,10),v6=fv(pv,gr,6);
  const l3=lbal(loan,rate,rep,3),l5=lbal(loan,rate,rep,5),l10=lbal(loan,rate,rep,10);
  $('lt-v0').textContent=fmt(pv);$('lt-v3').textContent=fmt(v3);$('lt-v5').textContent=fmt(v5);$('lt-v10').textContent=fmt(v10);
  $('lt-l0').textContent=fmt(loan);$('lt-l3').textContent=fmt(l3);$('lt-l5').textContent=fmt(l5);$('lt-l10').textContent=fmt(l10);
  $('lt-e0').textContent=fmt(pv-loan);$('lt-e3').textContent=fmt(v3-l3);$('lt-e5').textContent=fmt(v5-l5);$('lt-e10').textContent=fmt(v10-l10);
  $('lt-t3').textContent=fmt(taxYr*3,true);$('lt-t5').textContent=fmt(taxYr*5,true);$('lt-t10').textContent=fmt(taxYr*10,true);
  const gain6=v6-pv,cgt=gain6*0.5*(b/100);
  $('cgt-saved').textContent=fmt(cgt,true);$('hero-cgt').textContent=fmt(cgt,true);
  const total10=(v10-pv)+(loan-Math.max(0,l10))+taxYr*10;
  $('lt-total10').textContent=fmt(total10,true);$('lt-costhero').textContent=fwk(netHold);
}

function fvM(m,r,y){if(r<=0)return m*12*y;const mr=r/100/12,n=y*12;return m*((Math.pow(1+mr,n)-1)/mr);}

function calcRet(){
  const pv=+$('propval').value||0,gr=+$('growth').value||0;
  const loan=+$('loan').value||0,rate=+$('rate').value||0,rep=+$('repayment').value||0;
  const sal=+$('salary').value||0,b2=br(sal);
  const intYr=loan*(rate/100);
  const bc2=+$('bc').value||0,ra2=+$('rates').value||0,ins2=+$('ins').value||0,ma2=+$('maint').value||0,dep2=+$('dep').value||0;
  const taxYr=(intYr+bc2*52+ra2*52+ins2*52+ma2*52+dep2)*(b2/100);
  const savMo=+$('sav-mo').value||0,savRet=+$('sav-ret').value||7;
  const fiTarget=+$('fi-target').value||1000000;
  [5,10,15,20].forEach(y=>{
    const pY=fv(pv,gr,y),lY=lbal(loan,rate,rep,y),eY=pY-lY,sY=fvM(savMo,savRet,y);
    $('ex-v'+y).textContent=fmt(pY);$('ex-l'+y).textContent=fmt(lY);
    $('ex-e'+y).textContent=fmt(eY);$('ex-s'+y).textContent=fmt(sY,true);
    $('ex-t'+y).textContent=fmt(eY+sY,true);
    $('cmp-with'+y).textContent=fmt(eY+sY);
    $('cmp-wo'+y).textContent=fmt(eY);
    $('cmp-diff'+y).textContent=fmt(sY,true);
  });
  let fiY=null,woY=null;
  for(let y=1;y<=35;y++){const eY=fv(pv,gr,y)-lbal(loan,rate,rep,y);if(eY+fvM(savMo,savRet,y)>=fiTarget){fiY=y;break;}}
  for(let y=1;y<=40;y++){const eY=fv(pv,gr,y)-lbal(loan,rate,rep,y);if(eY>=fiTarget){woY=y;break;}}
  $('fi-year').textContent=fiY?'Year '+fiY:'30+';
  const tshow=fiTarget>=1000000?(Math.round(fiTarget/100000)/10)+'M':(Math.round(fiTarget/1000))+'k';
  $('fi-target-show').textContent=tshow;
  $('fi-saving').textContent=(woY&&fiY)?(woY-fiY)+' years earlier than owner-occupier':(fiY?'Much earlier than owner-occupier':'Increase monthly savings or lower target');
}
document.querySelectorAll('input').forEach(i=>i.addEventListener('input',()=>{calc();calcRet();}));
calc();calcRet();
</script>
</body></html>`;
export default{async fetch(){return new Response(H,{headers:{'Content-Type':'text/html;charset=utf-8'}})}};