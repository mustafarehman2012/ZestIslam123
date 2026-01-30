import React, { useState, useMemo } from 'react';
import { Calculator, Info, Wallet, TrendingUp, MinusCircle, CheckCircle, HelpCircle, DollarSign } from 'lucide-react';

const ZakatCalculator: React.FC = () => {
    const [cash, setCash] = useState<number>(0);
    const [gold, setGold] = useState<number>(0);
    const [silver, setSilver] = useState<number>(0);
    const [business, setBusiness] = useState<number>(0);
    const [debts, setDebts] = useState<number>(0);
    const [nisab, setNisab] = useState<number>(500); 

    const totalAssets = useMemo(() => cash + gold + silver + business, [cash, gold, silver, business]);
    const zakatableWealth = useMemo(() => Math.max(0, totalAssets - debts), [totalAssets, debts]);
    const isElligible = zakatableWealth >= nisab;
    const zakatDue = isElligible ? zakatableWealth * 0.025 : 0;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
            <div className="text-center space-y-4 pt-8">
                <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl">
                    <Calculator className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Zakat Calculator</h2>
                <p className="text-slate-500 dark:text-slate-400">Calculate your 2.5% share for the community.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-xs px-2">
                            <Wallet className="w-3 h-3" /> Wealth Details
                        </div>
                        <div className="grid gap-4">
                            <InputField label="Cash & Savings" value={cash} onChange={setCash} icon={<DollarSign className="w-4 h-4" />} />
                            <InputField label="Gold Value" value={gold} onChange={setGold} />
                            <InputField label="Silver Value" value={silver} onChange={setSilver} />
                            <InputField label="Business Assets" value={business} onChange={setBusiness} />
                            <InputField label="Debts (Deduction)" value={debts} onChange={setDebts} color="text-red-500" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                         <InputField label="Current Nisab Threshold" value={nisab} onChange={setNisab} icon={<TrendingUp className="w-4 h-4" />} />
                         <p className="text-[10px] text-slate-400 mt-2 italic flex items-center gap-1">
                             <Info className="w-3 h-3" /> Nisab is the minimum wealth required for Zakat to be due (Value of 87.48g gold or 612.36g silver).
                         </p>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className={`p-8 rounded-[2.5rem] border-2 transition-all shadow-xl flex flex-col justify-center text-center relative overflow-hidden ${isElligible ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent'}`}>
                        {isElligible && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>}
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-4 opacity-80">Zakat Due</h3>
                        <p className="text-6xl font-black tracking-tighter mb-4">${zakatDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <div className="flex items-center justify-center gap-2 font-bold text-sm">
                            {isElligible ? (
                                <><CheckCircle className="w-4 h-4" /> Nisab Reached</>
                            ) : (
                                <><MinusCircle className="w-4 h-4" /> Below Nisab</>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-4 flex-1">
                        <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><HelpCircle className="w-4 h-4 text-emerald-500" /> Summary Breakdown</h4>
                        <div className="space-y-3">
                            <SummaryRow label="Gross Assets" value={totalAssets} />
                            <SummaryRow label="Liabilities" value={debts} isNegative />
                            <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-2"></div>
                            <SummaryRow label="Net Zakatable Wealth" value={zakatableWealth} highlight />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputField: React.FC<{ label: string, value: number, onChange: (v: number) => void, icon?: React.ReactNode, color?: string }> = ({ label, value, onChange, icon, color }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative group">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${color || 'text-slate-400'} transition-colors group-focus-within:text-emerald-500`}>
                {icon || <DollarSign className="w-4 h-4" />}
            </div>
            <input 
                type="number" 
                value={value || ''} 
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-bold text-slate-800 dark:text-white transition-all"
            />
        </div>
    </div>
);

const SummaryRow: React.FC<{ label: string, value: number, isNegative?: boolean, highlight?: boolean }> = ({ label, value, isNegative, highlight }) => (
    <div className={`flex justify-between items-center ${highlight ? 'text-lg font-black' : 'text-sm font-medium'}`}>
        <span className="text-slate-400">{label}</span>
        <span className={isNegative ? 'text-red-500' : highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}>
            {isNegative ? '-' : ''}${value.toLocaleString()}
        </span>
    </div>
);

export default ZakatCalculator;