import { Alert, Platform } from "react-native";
import type { AnalysisResults, Property, Financing, Address } from "@dealscope/core";

function fmtCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

interface ExportData {
  property: Property;
  financing: Financing;
  holdPeriod: number;
  results: AnalysisResults;
}

function buildHtml(data: ExportData): string {
  const { property, financing, results: r, holdPeriod } = data;
  const addr: Address = property.address as Address;
  const address = `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`;

  const projectionRows = r.projections
    .map(
      (p, i) => `
      <tr>
        <td>Year ${i + 1}</td>
        <td>${fmtCurrency(p.noi)}</td>
        <td>${fmtCurrency(p.cashFlow)}</td>
        <td>${fmtCurrency(p.cumulativeCashFlow)}</td>
        <td>${fmtCurrency(p.propertyValue)}</td>
        <td>${fmtCurrency(p.equity)}</td>
      </tr>`
    )
    .join("");

  const expenseRows = r.expenses.breakdown
    .map(
      (item) => `
      <tr>
        <td>${item.category}</td>
        <td style="color:#c00">-${fmtCurrency(item.amount)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; padding: 32px; }
    h1 { color: #003366; font-size: 22px; margin-bottom: 4px; }
    h2 { color: #003366; font-size: 16px; margin: 20px 0 8px; border-bottom: 2px solid #003366; padding-bottom: 4px; }
    .subtitle { color: #666; font-size: 13px; margin-bottom: 20px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .metric-card { background: #f0f5ff; border-radius: 8px; padding: 10px; text-align: center; }
    .metric-label { font-size: 10px; color: #666; text-transform: uppercase; }
    .metric-value { font-size: 18px; font-weight: 700; color: #003366; margin-top: 2px; }
    .metric-sub { font-size: 9px; color: #999; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }
    th { background: #003366; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
    td { padding: 5px 8px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #f9f9f9; }
    .range-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
    .range-card { background: #f8f9fa; border-radius: 6px; padding: 8px; text-align: center; }
    .range-card.mid { background: #e8f0fe; border: 1px solid #003366; }
    .range-label { font-size: 10px; color: #666; }
    .range-value { font-size: 16px; font-weight: 700; }
    .low { color: #c00; }
    .mid-val { color: #003366; }
    .high { color: #008800; }
    .green { color: #008800; }
    .red { color: #c00; }
    .footer { margin-top: 24px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 8px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  </style>
</head>
<body>
  <h1>DealScope Analysis Report</h1>
  <p class="subtitle">${address} | ${property.units} units | ${fmtCurrency(property.askingPrice)} | Generated ${new Date().toLocaleDateString()}</p>

  <h2>Key Metrics</h2>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-label">Cap Rate</div>
      <div class="metric-value">${fmtPct(r.capRate.mid)}</div>
      <div class="metric-sub">mid estimate</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Cash-on-Cash</div>
      <div class="metric-value">${fmtPct(r.cashOnCash.mid)}</div>
      <div class="metric-sub">mid estimate</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Monthly CF</div>
      <div class="metric-value ${r.monthlyCashFlow.mid >= 0 ? "green" : "red"}">${fmtCurrency(r.monthlyCashFlow.mid)}</div>
      <div class="metric-sub">mid estimate</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">DSCR</div>
      <div class="metric-value">${r.dscr.mid.toFixed(2)}</div>
      <div class="metric-sub">${r.dscr.mid >= 1.25 ? "Healthy" : r.dscr.mid >= 1 ? "Tight" : "Negative"}</div>
    </div>
  </div>

  <div class="two-col">
    <div>
      <h2>Purchase Metrics</h2>
      <table>
        <tr><td>Price/Unit</td><td>${fmtCurrency(r.pricePerUnit)}</td></tr>
        <tr><td>Price/Sqft</td><td>${fmtCurrency(r.pricePerSqft)}</td></tr>
        <tr><td>GRM</td><td>${r.grossRentMultiplier.toFixed(1)}x</td></tr>
        <tr><td>1% Rule</td><td>${fmtPct(r.onePercentRule)}</td></tr>
        <tr><td>Break-Even Occ.</td><td>${fmtPct(r.breakEvenOccupancy)}</td></tr>
      </table>
    </div>
    <div>
      <h2>Financing</h2>
      <table>
        <tr><td>Down Payment</td><td>${fmtCurrency(r.financing.downPayment)}</td></tr>
        <tr><td>Loan Amount</td><td>${fmtCurrency(r.financing.loanAmount)}</td></tr>
        <tr><td>Monthly Payment</td><td>${fmtCurrency(r.financing.monthlyPayment)}/mo</td></tr>
        <tr><td>Total Cash Required</td><td><strong>${fmtCurrency(r.financing.totalCashRequired)}</strong></td></tr>
      </table>
    </div>
  </div>

  <h2>Income & Expenses</h2>
  <table>
    <tr><td>Gross Potential Rent</td><td>${fmtCurrency(r.income.grossPotentialRent)}</td></tr>
    <tr><td>Vacancy (${(r.income.vacancyRate * 100).toFixed(0)}%)</td><td style="color:#c00">-${fmtCurrency(r.income.vacancyLoss)}</td></tr>
    <tr><td>Other Income</td><td>+${fmtCurrency(r.income.otherIncomeTotal)}</td></tr>
    <tr style="border-top:2px solid #003366"><td><strong>Effective Gross Income</strong></td><td><strong>${fmtCurrency(r.income.effectiveGrossIncome)}</strong></td></tr>
    ${expenseRows}
  </table>

  <h2>NOI Range</h2>
  <div class="range-grid">
    <div class="range-card"><div class="range-label">Low</div><div class="range-value low">${fmtCurrency(r.noi.low)}</div></div>
    <div class="range-card mid"><div class="range-label">NOI</div><div class="range-value mid-val">${fmtCurrency(r.noi.mid)}</div></div>
    <div class="range-card"><div class="range-label">High</div><div class="range-value high">${fmtCurrency(r.noi.high)}</div></div>
  </div>

  <h2>Cap Rate Range</h2>
  <div class="range-grid">
    <div class="range-card"><div class="range-label">Low</div><div class="range-value low">${fmtPct(r.capRate.low)}</div></div>
    <div class="range-card mid"><div class="range-label">Cap Rate</div><div class="range-value mid-val">${fmtPct(r.capRate.mid)}</div></div>
    <div class="range-card"><div class="range-label">High</div><div class="range-value high">${fmtPct(r.capRate.high)}</div></div>
  </div>

  <h2>${holdPeriod}-Year Projections</h2>
  <table>
    <thead>
      <tr><th>Year</th><th>NOI</th><th>Cash Flow</th><th>Cumulative CF</th><th>Property Value</th><th>Equity</th></tr>
    </thead>
    <tbody>
      ${projectionRows}
    </tbody>
  </table>

  ${r.irr != null || r.equityMultiple != null ? `
  <h2>Investment Returns</h2>
  <div class="metrics-grid" style="grid-template-columns: repeat(2, 1fr);">
    ${r.irr != null ? `<div class="metric-card"><div class="metric-label">IRR</div><div class="metric-value">${fmtPct(r.irr)}</div><div class="metric-sub">${holdPeriod}-year hold</div></div>` : ""}
    ${r.equityMultiple != null ? `<div class="metric-card"><div class="metric-label">Equity Multiple</div><div class="metric-value">${r.equityMultiple.toFixed(2)}x</div><div class="metric-sub">${holdPeriod}-year hold</div></div>` : ""}
  </div>
  ` : ""}

  <div class="footer">
    Generated by DealScope | ${new Date().toLocaleString()} | This report is for informational purposes only.
  </div>
</body>
</html>`;
}

export async function exportPdf(data: ExportData): Promise<void> {
  try {
    const html = buildHtml(data);

    if (Platform.OS === "web") {
      // Web: open print dialog
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
      return;
    }

    // Native: use expo-print + expo-sharing
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Print = require("expo-print") as { printToFileAsync: (opts: { html: string }) => Promise<{ uri: string }> };
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sharing = require("expo-sharing") as { shareAsync: (uri: string, opts: Record<string, string>) => Promise<void> };

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      UTI: "com.adobe.pdf",
      mimeType: "application/pdf",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    Alert.alert("Export Error", message);
  }
}
