import type { Property, Financing, AnalysisResults } from "@dealscope/core";

interface ExportData {
  property: Property;
  financing: Financing;
  holdPeriod: number;
  results: AnalysisResults;
}

export function exportPdf({ property, financing, holdPeriod, results: r }: ExportData) {
  const fmtC = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const fmtP = (n: number) => `${n.toFixed(2)}%`;

  const html = `
    <html>
    <head>
      <title>DealScope - ${property.address?.street || "Analysis"}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
        h1 { color: #003366; margin-bottom: 4px; }
        h2 { color: #003366; border-bottom: 2px solid #003366; padding-bottom: 4px; margin-top: 32px; }
        .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
        .metric { background: #f8f9fa; border-radius: 8px; padding: 12px; text-align: center; }
        .metric-label { font-size: 11px; color: #666; }
        .metric-value { font-size: 18px; font-weight: 700; color: #003366; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0; }
        th { background: #003366; color: white; padding: 8px; text-align: center; }
        td { padding: 8px; text-align: center; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #f8f9fa; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
        .row-label { color: #555; }
        .row-value { font-weight: 500; }
        .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>${property.address?.street || "Property Analysis"}</h1>
      <div class="subtitle">
        ${property.address?.city || ""}, ${property.address?.state || ""} ${property.address?.zip || ""} |
        ${property.units} units | ${fmtC(property.askingPrice)}
      </div>

      <h2>Key Metrics</h2>
      <div class="grid">
        <div class="metric">
          <div class="metric-label">Cap Rate</div>
          <div class="metric-value">${fmtP(r.capRate.mid)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Cash-on-Cash</div>
          <div class="metric-value">${fmtP(r.cashOnCash.mid)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Monthly Cash Flow</div>
          <div class="metric-value">${fmtC(r.monthlyCashFlow.mid)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">DSCR</div>
          <div class="metric-value">${r.dscr.mid.toFixed(2)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">NOI</div>
          <div class="metric-value">${fmtC(r.noi.mid)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">GRM</div>
          <div class="metric-value">${r.grossRentMultiplier.toFixed(1)}x</div>
        </div>
      </div>

      <h2>Income & Expenses</h2>
      <div class="row"><span class="row-label">Gross Potential Rent</span><span class="row-value">${fmtC(r.income.grossPotentialRent)}</span></div>
      <div class="row"><span class="row-label">Vacancy Loss</span><span class="row-value" style="color:#c00">-${fmtC(r.income.vacancyLoss)}</span></div>
      <div class="row"><span class="row-label">Other Income</span><span class="row-value">+${fmtC(r.income.otherIncomeTotal)}</span></div>
      <div class="row" style="border-top:1px solid #ddd;padding-top:8px;margin-top:4px"><span class="row-label" style="font-weight:700;color:#003366">Effective Gross Income</span><span class="row-value" style="font-weight:700;color:#003366">${fmtC(r.income.effectiveGrossIncome)}</span></div>

      <h2>Financing</h2>
      <div class="row"><span class="row-label">Down Payment</span><span class="row-value">${fmtC(r.financing.downPayment)}</span></div>
      <div class="row"><span class="row-label">Loan Amount</span><span class="row-value">${fmtC(r.financing.loanAmount)}</span></div>
      <div class="row"><span class="row-label">Monthly Payment</span><span class="row-value">${fmtC(r.financing.monthlyPayment)}/mo</span></div>
      <div class="row"><span class="row-label">Total Cash Required</span><span class="row-value" style="font-weight:700">${fmtC(r.financing.totalCashRequired)}</span></div>

      <h2>${holdPeriod}-Year Projections</h2>
      <table>
        <tr><th>Year</th><th>EGI</th><th>NOI</th><th>Cash Flow</th><th>CoC</th><th>Value</th></tr>
        ${r.projections.map((p) => `
          <tr>
            <td>${p.year}</td>
            <td>${fmtC(p.effectiveGrossIncome)}</td>
            <td>${fmtC(p.noi)}</td>
            <td style="${p.cashFlow < 0 ? "color:#c00" : ""}">${fmtC(p.cashFlow)}</td>
            <td>${p.cashOnCash.toFixed(1)}%</td>
            <td>${fmtC(p.propertyValue)}</td>
          </tr>
        `).join("")}
      </table>

      ${r.irr != null ? `
        <h2>Investment Returns</h2>
        <div class="grid" style="grid-template-columns: repeat(2, 1fr)">
          <div class="metric"><div class="metric-label">IRR (${holdPeriod}-yr)</div><div class="metric-value">${fmtP(r.irr)}</div></div>
          <div class="metric"><div class="metric-label">Equity Multiple</div><div class="metric-value">${r.equityMultiple?.toFixed(2) ?? "N/A"}x</div></div>
        </div>
      ` : ""}

      <div class="footer">
        Generated by DealScope | ${new Date().toLocaleDateString()}
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}
