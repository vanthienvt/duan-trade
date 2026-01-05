
import React, { useState, useEffect } from 'react';
import { View, MarketSignal } from '../types';

interface Props {
    onNavigate: (view: View, signal?: MarketSignal) => void;
}

const RiskCalculator: React.FC<Props> = ({ onNavigate }) => {
    const [balance, setBalance] = useState<number>(1000);
    const [riskPercent, setRiskPercent] = useState<number>(2); // 2% default
    const [entryPrice, setEntryPrice] = useState<number>(0);
    const [stopLoss, setStopLoss] = useState<number>(0);
    const [takeProfit, setTakeProfit] = useState<number>(0);

    // Results
    const [positionSize, setPositionSize] = useState<number>(0);
    const [riskAmount, setRiskAmount] = useState<number>(0);
    const [units, setUnits] = useState<number>(0);
    const [rrRatio, setRrRatio] = useState<number>(0);

    useEffect(() => {
        calculateRisk();
    }, [balance, riskPercent, entryPrice, stopLoss, takeProfit]);

    const calculateRisk = () => {
        // 1. Calculate Risk Amount ($)
        const riskAmt = balance * (riskPercent / 100);
        setRiskAmount(riskAmt);

        if (entryPrice > 0 && stopLoss > 0 && entryPrice !== stopLoss) {
            // 2. Calculate Stop Loss distance %
            const slDistance = Math.abs(entryPrice - stopLoss);
            const slPercent = slDistance / entryPrice;

            // 3. Calculate Position Size ($)
            // Risk Amount = Position Size * SL Percent
            // => Position Size = Risk Amount / SL Percent
            const posSize = riskAmt / slPercent;
            setPositionSize(posSize);

            // 4. Calculate Units (Coins)
            const unitCount = posSize / entryPrice;
            setUnits(unitCount);

            // 5. Calculate R:R
            if (takeProfit > 0) {
                const tpDistance = Math.abs(takeProfit - entryPrice);
                const slDist = Math.abs(entryPrice - stopLoss);
                setRrRatio(tpDistance / slDist);
            } else {
                setRrRatio(0);
            }
        } else {
            setPositionSize(0);
            setUnits(0);
            setRrRatio(0);
        }
    };

    const handleQuickBalance = (amount: number) => {
        setBalance(amount);
    };

    return (
        <div className="flex flex-col w-full animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-white/5">
                <h2 className="text-xl font-extrabold tracking-tight">Quản Lý Vốn</h2>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-surface text-primary">
                    <span className="material-symbols-outlined">calculate</span>
                </div>
            </header>

            <div className="p-4 space-y-6">

                {/* Account Balance Card */}
                <div className="bg-surface rounded-xl p-4 border border-white/5">
                    <label className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2 block">Vốn Tài Khoản ($)</label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">account_balance_wallet</span>
                        <input
                            type="number"
                            value={balance}
                            onChange={(e) => setBalance(Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-3 font-mono text-lg font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                        {[100, 500, 1000, 5000, 10000].map(val => (
                            <button
                                key={val}
                                onClick={() => handleQuickBalance(val)}
                                className="px-3 py-1 rounded-full bg-white/5 text-xs font-bold border border-white/5 hover:bg-white/10 transition-colors whitespace-nowrap"
                            >
                                ${val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Risk Setting */}
                <div className="bg-surface rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-text-secondary text-xs font-bold uppercase tracking-wider">Rủi Ro Chấp Nhận</label>
                        <span className="text-warning font-bold">{riskAmount.toFixed(1)}$ ({riskPercent}%)</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.1"
                        value={riskPercent}
                        onChange={(e) => setRiskPercent(Number(e.target.value))}
                        className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-warning"
                    />
                    <div className="flex justify-between text-[10px] text-text-secondary mt-2 font-bold">
                        <span>0.5% (Safe)</span>
                        <span>2% (Standard)</span>
                        <span>5% (High)</span>
                        <span>10% (Degen)</span>
                    </div>
                </div>

                {/* Trade Inputs */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface rounded-xl p-3 border border-white/10">
                        <label className="text-text-secondary text-[10px] font-bold uppercase block mb-1">Entry Price</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={entryPrice || ''}
                            onChange={(e) => setEntryPrice(Number(e.target.value))}
                            className="w-full bg-transparent border-b border-white/10 py-1 font-mono text-sm font-bold focus:border-primary outline-none"
                        />
                    </div>
                    <div className="bg-surface rounded-xl p-3 border border-white/10">
                        <label className="text-bearish text-[10px] font-bold uppercase block mb-1">Stop Loss</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={stopLoss || ''}
                            onChange={(e) => setStopLoss(Number(e.target.value))}
                            className="w-full bg-transparent border-b border-white/10 py-1 font-mono text-sm font-bold focus:border-bearish outline-none text-bearish"
                        />
                    </div>
                </div>

                <div className="bg-surface rounded-xl p-3 border border-white/10">
                    <label className="text-bullish text-[10px] font-bold uppercase block mb-1">Take Profit (Optional)</label>
                    <input
                        type="number"
                        placeholder="0.00"
                        value={takeProfit || ''}
                        onChange={(e) => setTakeProfit(Number(e.target.value))}
                        className="w-full bg-transparent border-b border-white/10 py-1 font-mono text-sm font-bold focus:border-bullish outline-none text-bullish"
                    />
                </div>

                {/* Results Card */}
                <div className={`rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${positionSize > 0 ? 'bg-gradient-to-br from-primary/20 to-surface border-primary/50' : 'bg-surface border-white/5'} border`}>

                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">Position Size (Max)</p>
                                <h3 className="text-3xl font-black tracking-tight">${positionSize > 0 ? positionSize.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">Units</p>
                                <p className="text-xl font-bold font-mono">{units > 0 ? units.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0'}</p>
                            </div>
                        </div>

                        <div className="h-px w-full bg-white/10"></div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-bearish">warning</span>
                                <div>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase">Max Loss</p>
                                    <p className="text-sm font-bold text-bearish">-${riskAmount.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-right">
                                <div className="text-right">
                                    <p className="text-[10px] text-text-secondary font-bold uppercase">R:R Ratio</p>
                                    <p className={`text-sm font-bold ${rrRatio >= 2 ? 'text-bullish' : rrRatio >= 1 ? 'text-warning' : 'text-text-secondary'}`}>
                                        {rrRatio > 0 ? `1 : ${rrRatio.toFixed(2)}` : '-'}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-bullish">ads_click</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tip */}
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20 flex gap-3">
                    <span className="material-symbols-outlined text-blue-400">info</span>
                    <p className="text-xs text-blue-200 leading-relaxed">
                        Luôn tuân thủ kỷ luật quản lý vốn. Không bao giờ mạo hiểm quá 2% tài khoản cho một lệnh trade.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default RiskCalculator;
