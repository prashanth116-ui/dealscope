"use client";

import { useRouter } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { StepIndicator } from "@/components/step-indicator";
import { CurrencyInput } from "@/components/currency-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateMonthlyPayment, FINANCING_DEFAULTS } from "@dealscope/core";
import type { FinancingType } from "@dealscope/core";

const FINANCING_TYPES: { label: string; value: FinancingType }[] = [
  { label: "Conventional", value: "conventional" },
  { label: "Seller Finance", value: "seller" },
  { label: "Cash", value: "cash" },
];

export default function FinancingPage() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  const f = state.financing;

  const setField = (field: string, value: number | string) => {
    dispatch({ type: "SET_FINANCING", financing: { ...f, [field]: value } });
  };

  const setType = (type: FinancingType) => {
    const defaults = type === "seller" ? FINANCING_DEFAULTS.seller : FINANCING_DEFAULTS.conventional;
    dispatch({
      type: "SET_FINANCING",
      financing: {
        ...f,
        type,
        downPaymentPercent: defaults.downPaymentPercent,
        loanTerm: defaults.loanTerm,
        amortization: defaults.amortization,
        closingCosts: f.purchasePrice * (defaults.closingCosts / 100),
        points: defaults.points,
        sellerCarryback: type === "seller"
          ? f.sellerCarryback ?? { amount: f.purchasePrice * 0.7, rate: 6, term: 5, balloon: 5 }
          : undefined,
      },
    });
  };

  const setCarryback = (field: string, value: number) => {
    dispatch({
      type: "SET_FINANCING",
      financing: {
        ...f,
        sellerCarryback: { ...{ amount: 0, rate: 6, term: 5, balloon: 5 }, ...f.sellerCarryback, [field]: value },
      },
    });
  };

  const downPayment = f.purchasePrice * (f.downPaymentPercent / 100);
  const loanAmount = f.purchasePrice - downPayment;
  const monthlyPayment = f.type === "cash" ? 0 : calculateMonthlyPayment(loanAmount, f.interestRate, f.amortization);

  const handleContinue = () => {
    dispatch({ type: "SET_STEP", step: 5 });
    router.push("/analysis/assumptions");
  };

  return (
    <div>
      <StepIndicator current={4} />

      {/* Type tabs */}
      <div className="flex mb-4">
        {FINANCING_TYPES.map((ft, i) => (
          <button
            key={ft.value}
            className={`flex-1 py-3 text-sm font-semibold border ${
              f.type === ft.value ? "bg-primary text-primary-foreground border-primary" : "bg-gray-50 text-muted-foreground border-gray-200"
            } ${i === 0 ? "rounded-l-md" : i === 2 ? "rounded-r-md" : ""}`}
            onClick={() => setType(ft.value)}
          >
            {ft.label}
          </button>
        ))}
      </div>

      <Label>Purchase Price</Label>
      <CurrencyInput value={f.purchasePrice ? String(f.purchasePrice) : ""} onChangeValue={(v) => setField("purchasePrice", parseFloat(v) || 0)} className="mt-1 mb-3" />

      {f.type !== "cash" && (
        <>
          <Label>Down Payment (%)</Label>
          <div className="flex items-center gap-2 mt-1 mb-3">
            <Input type="number" className="flex-1" value={String(f.downPaymentPercent)} onChange={(e) => setField("downPaymentPercent", Math.min(100, parseFloat(e.target.value) || 0))} />
            <span className="text-sm text-muted-foreground">= ${downPayment.toLocaleString()}</span>
          </div>

          <Label>Interest Rate (%)</Label>
          <Input type="number" step="0.01" className="mt-1 mb-3" value={String(f.interestRate)} onChange={(e) => setField("interestRate", parseFloat(e.target.value) || 0)} />

          <Label>Loan Term (years)</Label>
          <Input type="number" className="mt-1 mb-3" value={String(f.loanTerm)} onChange={(e) => setField("loanTerm", parseInt(e.target.value) || 0)} />

          <Label>Amortization (years)</Label>
          <Input type="number" className="mt-1 mb-3" value={String(f.amortization)} onChange={(e) => setField("amortization", parseInt(e.target.value) || 0)} />

          <Label>Points (%)</Label>
          <Input type="number" step="0.25" className="mt-1 mb-3" value={String(f.points)} onChange={(e) => setField("points", parseFloat(e.target.value) || 0)} />
        </>
      )}

      <Label>Closing Costs ($)</Label>
      <CurrencyInput value={f.closingCosts ? String(f.closingCosts) : ""} onChangeValue={(v) => setField("closingCosts", parseFloat(v) || 0)} className="mt-1 mb-3" />

      {f.type === "seller" && (
        <>
          <h3 className="text-lg font-bold text-primary mt-6 mb-2">Seller Carryback</h3>
          <Label>Carryback Amount</Label>
          <CurrencyInput value={f.sellerCarryback?.amount ? String(f.sellerCarryback.amount) : ""} onChangeValue={(v) => setCarryback("amount", parseFloat(v) || 0)} className="mt-1 mb-3" />
          <Label>Carryback Rate (%)</Label>
          <Input type="number" className="mt-1 mb-3" value={f.sellerCarryback?.rate != null ? String(f.sellerCarryback.rate) : ""} onChange={(e) => setCarryback("rate", parseFloat(e.target.value) || 0)} />
          <Label>Carryback Term (years)</Label>
          <Input type="number" className="mt-1 mb-3" value={f.sellerCarryback?.term != null ? String(f.sellerCarryback.term) : ""} onChange={(e) => setCarryback("term", parseInt(e.target.value) || 0)} />
          <Label>Balloon (years)</Label>
          <Input type="number" className="mt-1 mb-3" value={f.sellerCarryback?.balloon != null ? String(f.sellerCarryback.balloon) : ""} onChange={(e) => setCarryback("balloon", parseInt(e.target.value) || 0)} />
        </>
      )}

      {/* Payment preview */}
      <div className="bg-gray-100 rounded-lg p-4 mt-5">
        <h4 className="text-sm font-bold text-primary mb-2">Payment Preview</h4>
        <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Loan Amount</span><span>${loanAmount.toLocaleString()}</span></div>
        <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Monthly P&I</span><span className="font-bold text-primary">${Math.round(monthlyPayment).toLocaleString()}/mo</span></div>
        <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Annual Debt Service</span><span>${Math.round(monthlyPayment * 12).toLocaleString()}/yr</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Cash Required</span><span>${Math.round(downPayment + f.closingCosts + loanAmount * (f.points / 100)).toLocaleString()}</span></div>
      </div>

      <div className="flex gap-3 mt-6 mb-10">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>Back</Button>
        <Button className="flex-[2]" onClick={handleContinue}>Continue</Button>
      </div>
    </div>
  );
}
