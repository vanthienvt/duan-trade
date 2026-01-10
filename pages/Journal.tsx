
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

    // --- STATS & CHARTS CALCULATIONS ---
    const totalPnL = positions.reduce((sum, p) => sum + parseFloat(p.upl), 0);

    // Safe Balance
    const safeBalance = balance && balance.totalEq ? parseFloat(balance.totalEq).toLocaleString() : '---';

    // Daily PnL Chart Data (Last 7 Days)
    const daysMap = new Map<string, number>();
    const now = new Date();

    // Init last 7 days with 0
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        daysMap.set(key, 0);
    }

    history.forEach(order => {
        const d = new Date(parseInt(order.fillTime || order.uTime));
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        if (daysMap.has(key)) {
            daysMap.set(key, (daysMap.get(key) || 0) + parseFloat(order.pnl));
        }
    });

    const chartData = Array.from(daysMap.entries()).map(([date, pnl]) => ({ date, pnl }));
    const maxPnL = Math.max(...chartData.map(d => Math.abs(d.pnl)), 10); // Find max for scaling (min 10)

    // Today Stats
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayOrders = history.filter(o => parseInt(o.fillTime || o.uTime) >= startOfDay);
    const todayPnL = todayOrders.reduce((sum, o) => sum + parseFloat(o.pnl), 0);
    const todayTrades = todayOrders.length;
    const todayWins = todayOrders.filter(o => parseFloat(o.pnl) > 0).length;

    // --- RENDER ---
    if (!hasKey) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-in fade-in">
                <h2 className="text-xl font-bold mb-2">Kết nối Ví OKX</h2>
                <button
                    onClick={() => setShowSettings(true)}
                    className="bg-primary text-background font-bold py-3 px-8 rounded-full shadow-lg transition-all"
                >
                    Nhập API Key
                </button>
                <SettingsModal isOpen={showSettings} onClose={() => { setShowSettings(false); fetchData(); }} />
            </div>
        );
    }

    return (
        <div className="pb-24 animate-in fade-in duration-500">
            <header className="px-5 py-4 flex items-center justify-between">
                <h1 className="text-xl font-black text-white">My Portfolio</h1>
                <button onClick={() => setShowSettings(true)}>
                    <span className="material-symbols-outlined text-text-secondary">settings</span>
                </button>
            </header>

            <div className="px-4 space-y-4">

                {/* 1. BALANCE CARD */}
                <div className="bg-gradient-to-r from-surface to-surface/50 border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5 transform rotate-12">
                        <span className="material-symbols-outlined text-9xl">wallet</span>
                    </div>
                    <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Tổng Tài Sản (Equity)</p>
                    <div className="text-4xl font-black text-white mt-1">
                        {safeBalance} <span className="text-sm font-medium text-text-secondary">USDT</span>
                    </div>
                    <div className="mt-4 flex gap-4">
                        <div>
                            <p className="text-[9px] text-text-secondary uppercase">Hôm nay</p>
                            <p className={`font-bold ${todayPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                {todayPnL > 0 ? '+' : ''}{todayPnL.toFixed(2)}$
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] text-text-secondary uppercase">Số lệnh</p>
                            <p className="font-bold">{todayTrades} ({todayWins} Win)</p>
                        </div>
                    </div>
                </div>

                {/* 2. BAR CHART (7 DAYS) */}
                <div className="bg-surface border border-white/5 rounded-2xl p-4">
                    <h3 className="text-[10px] font-bold text-text-secondary uppercase mb-4">Hiệu suất 7 ngày qua</h3>
                    <div className="flex justify-between items-end h-32 gap-2">
                        {chartData.map((day, index) => {
                            const heightPercent = Math.max((Math.abs(day.pnl) / maxPnL) * 100, 5); // Win 5% height
                            const isPositive = day.pnl >= 0;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div className="relative w-full flex justify-center items-end h-full">
                                        <div
                                            className={`w-full max-w-[12px] rounded-sm transition-all duration-500 group-hover:opacity-80 ${isPositive ? 'bg-bullish' : 'bg-bearish'}`}
                                            style={{ height: `${heightPercent}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[9px] text-text-secondary">{day.date}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 3. ACTIVE POSITIONS (COMPACT LIST) */}
                <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h3 className="text-xs font-bold text-text-secondary uppercase">Đang Chạy ({positions.length})</h3>
                        {positions.length > 0 && (
                            <span className={`text-xs font-bold ${totalPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                Tổng: {totalPnL > 0 ? '+' : ''}{totalPnL.toFixed(2)}$
                            </span>
                        )}
                    </div>

                    <div className="bg-surface border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                        {positions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-text-secondary italic">Chưa có lệnh nào.</div>
                        ) : (
                            positions.map((pos) => {
                                const isLong = pos.posSide === 'long';
                                const pnl = parseFloat(pos.upl);
                                return (
                                    <div key={pos.instId} className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1 h-8 rounded-full ${isLong ? 'bg-bullish' : 'bg-bearish'}`}></div>
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-bold text-sm">{pos.instId.split('-')[0]}</span>
                                                    <span className={`text-[9px] px-1 rounded ${isLong ? 'bg-bullish/10 text-bullish' : 'bg-bearish/10 text-bearish'}`}>x{pos.lever}</span>
                                                </div>
                                                <p className="text-[10px] text-text-secondary">Entry: {parseFloat(pos.avgPx).toFixed(4)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                                {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}$
                                            </p>
                                            <p className={`text-[10px] ${pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                                {(parseFloat(pos.uplRatio) * 100).toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 4. RECENT HISTORY (COMPACT) */}
                <div>
                    <h3 className="text-xs font-bold text-text-secondary uppercase mb-2 px-1">Lịch sử gần đây</h3>
                    <div className="bg-surface border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                        {history.slice(0, 5).map((order) => {
                            const pnl = parseFloat(order.pnl || '0');
                            return (
                                <div key={order.ordId} className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold ${pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                            {pnl >= 0 ? 'WIN' : 'LOSS'}
                                        </span>
                                        <span className="text-xs font-medium text-white">{order.instId.split('-')[0]}</span>
                                    </div>
                                    <span className={`text-xs font-bold ${pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                        {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}$
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {error && <div className="text-center text-red-500 text-xs mt-4">{error}</div>}

            </div>

            <SettingsModal isOpen={showSettings} onClose={() => { setShowSettings(false); fetchData(); }} />
        </div>
    );
};

export default Journal;
