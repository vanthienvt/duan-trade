
import React, { useState, useEffect } from 'react';
import { getAccountDetail, getOpenPositions, getHistory, AccountBalance, Position, getOKXSettings } from '../services/okxService';
import SettingsModal from '../components/SettingsModal';

interface Props {
    onNavigate: (view: string) => void;
}

const Journal: React.FC<Props> = ({ onNavigate }) => {
    const [balance, setBalance] = useState<AccountBalance | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [hasKey, setHasKey] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const settings = getOKXSettings();
        if (!settings.apiKey) {
            setHasKey(false);
            setLoading(false);
            return;
        }
        setHasKey(true);

        try {
            const [balData, posData, histData] = await Promise.all([
                getAccountDetail(),
                getOpenPositions(),
                getHistory()
            ]);
            setBalance(balData);
            setPositions(posData);
            setHistory(histData || []);
            setError('');
        } catch (err: any) {
            setError(err.message || 'Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // 15s refresh
        return () => clearInterval(interval);
    }, []);

    // --- PROFESSIONAL MATHS ---
    const totalEquity = balance ? parseFloat(balance.totalEq) : 0;
    const realizedOrders = history.filter(h => parseFloat(h.pnl) !== 0);

    // 1. KPI Calculation
    const totalWins = realizedOrders.filter(o => parseFloat(o.pnl) > 0).length;
    const totalTrades = realizedOrders.length;
    const winRate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0;

    const grossProfit = realizedOrders.filter(o => parseFloat(o.pnl) > 0).reduce((sum, o) => sum + parseFloat(o.pnl), 0);
    const grossLoss = Math.abs(realizedOrders.filter(o => parseFloat(o.pnl) < 0).reduce((sum, o) => sum + parseFloat(o.pnl), 0));
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : '∞';

    const todayPnL = realizedOrders
        .filter(o => new Date(parseInt(o.fillTime || o.uTime)).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0))
        .reduce((sum, o) => sum + parseFloat(o.pnl), 0);

    // 2. Calendar Heatmap Data
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const now = new Date();
    const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth());
    const monthData = Array(daysInMonth).fill(0);

    realizedOrders.forEach(o => {
        const d = new Date(parseInt(o.fillTime || o.uTime));
        // Only current month
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            monthData[d.getDate() - 1] += parseFloat(o.pnl);
        }
    });

    // --- RENDER ---
    if (!hasKey) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in">
                <h2 className="text-xl font-bold mb-4">Trading Journal Pro</h2>
                <button onClick={() => setShowSettings(true)} className="bg-primary text-background font-bold py-3 px-8 rounded-full">Kết nối OKX</button>
                <SettingsModal isOpen={showSettings} onClose={() => { setShowSettings(false); fetchData(); }} />
            </div>
        );
    }

    return (
        <div className="pb-24 animate-in fade-in duration-500">
            <header className="px-5 py-4 flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
                <div>
                    <h1 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Net Worth</h1>
                    <div className="text-2xl font-black text-white flex gap-2 items-baseline">
                        {balance ? (
                            `$${parseFloat(balance.totalEq || '0').toLocaleString()}`
                        ) : (
                            <span className="text-red-500 text-base">{error || 'Loading...'}</span>
                        )}
                        <span className={`text-sm font-bold ${todayPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                            {todayPnL > 0 ? '+' : ''}{todayPnL.toFixed(2)}$
                        </span>
                    </div>
                </div>
                <button onClick={() => setShowSettings(true)} className="bg-white/5 p-2 rounded-full"><span className="material-symbols-outlined text-sm">settings</span></button>
            </header>

            <div className="p-4 space-y-6">

                {/* 1. KPIs ROW */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-surface border border-white/5 rounded-xl p-3 text-center">
                        <p className="text-[9px] text-text-secondary uppercase font-bold">Win Rate</p>
                        <p className={`text-lg font-black ${winRate >= 50 ? 'text-bullish' : 'text-bearish'}`}>{winRate}%</p>
                    </div>
                    <div className="bg-surface border border-white/5 rounded-xl p-3 text-center">
                        <p className="text-[9px] text-text-secondary uppercase font-bold">Profit Factor</p>
                        <p className="text-lg font-black text-white">{profitFactor}</p>
                    </div>
                    <div className="bg-surface border border-white/5 rounded-xl p-3 text-center">
                        <p className="text-[9px] text-text-secondary uppercase font-bold">Trades</p>
                        <p className="text-lg font-black text-white">{totalTrades}</p>
                    </div>
                </div>

                {/* 2. MONTHLY CALENDAR HEATMAP */}
                <div className="bg-surface border border-white/5 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-text-secondary uppercase">Tháng {now.getMonth() + 1} Performance</h3>
                        <span className={`text-xs font-black ${monthData.reduce((a, b) => a + b, 0) >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                            Total: {monthData.reduce((a, b) => a + b, 0).toFixed(2)}$
                        </span>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                            <div key={d} className="text-[9px] text-center text-text-secondary font-bold">{d}</div>
                        ))}
                        {/* Empty slots for start of month alignment (simple version: verify accurate first) */}

                        {monthData.map((pnl, i) => {
                            const day = i + 1;
                            const isToday = day === now.getDate();
                            const hasTrade = pnl !== 0;
                            return (
                                <div key={i} className={`aspect-square rounded-lg flex flex-col items-center justify-center border ${isToday ? 'border-primary' : 'border-transparent'} ${hasTrade ? (pnl > 0 ? 'bg-bullish/20' : 'bg-bearish/20') : 'bg-white/5'}`}>
                                    <span className={`text-[10px] font-bold ${hasTrade ? (pnl >= 0 ? 'text-bullish' : 'text-bearish') : 'text-text-secondary'}`}>{day}</span>
                                    {hasTrade && <span className={`text-[7px] ${pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>{Math.round(pnl)}</span>}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 3. ACTIVE POSITIONS & HISTORY (TABS STYLE REPLACEMENT) */}
                <div>
                    <h3 className="text-xs font-bold text-text-secondary uppercase mb-2">Đang Chạy ({positions.length})</h3>
                    <div className="space-y-2">
                        {positions.length === 0 ? <p className="text-xs text-text-secondary italic text-center py-4 bg-surface rounded-xl">Flat Market (Không có lệnh)</p> :
                            positions.map(pos => {
                                const pnl = parseFloat(pos.upl);
                                return (
                                    <div key={pos.instId} className="bg-surface border border-white/5 rounded-xl p-3 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1 h-6 rounded-full ${pos.posSide === 'long' ? 'bg-bullish' : 'bg-bearish'}`}></div>
                                            <span className="font-black text-sm">{pos.instId.split('-')[0]}</span>
                                            <span className="text-[10px] bg-white/10 px-1.5 rounded text-text-secondary">x{pos.lever}</span>
                                        </div>
                                        <span className={`font-black ${pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                            {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}$
                                        </span>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>

            </div>
            <SettingsModal isOpen={showSettings} onClose={() => { setShowSettings(false); fetchData(); }} />
        </div>
    );
};

export default Journal;
