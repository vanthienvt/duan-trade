
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

    // --- STATS ---
    // Safe Balance: Check if totalEq exists, otherwise try logic or 0
    const totalEquity = balance ? parseFloat(balance.totalEq || '0') : 0;

    // Filter History: Only show REALIZED PnL (Trade Close)
    // Logic: pnl != 0. If pnl == 0, it's likely an opening trade.
    const realizedHistory = history.filter(h => parseFloat(h.pnl) !== 0);

    // Today PnL
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayOrders = realizedHistory.filter(o => parseInt(o.fillTime || o.uTime) >= startOfDay);
    const todayPnL = todayOrders.reduce((sum, o) => sum + parseFloat(o.pnl), 0);
    const todayTrades = todayOrders.length;
    const todayWins = todayOrders.filter(o => parseFloat(o.pnl) > 0).length;

    // Chart Data (Last 7 Days)
    const daysMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        daysMap.set(key, 0);
    }
    realizedHistory.forEach(order => {
        const d = new Date(parseInt(order.fillTime || order.uTime));
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        if (daysMap.has(key)) {
            daysMap.set(key, (daysMap.get(key) || 0) + parseFloat(order.pnl));
        }
    });
    const chartData = Array.from(daysMap.entries()).map(([date, pnl]) => ({ date, pnl }));
    const maxPnL = Math.max(...chartData.map(d => Math.abs(d.pnl)), 10);

    // --- RENDER ---
    if (!hasKey) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-in fade-in">
                <h2 className="text-xl font-bold mb-2">Kết nối Ví OKX</h2>
                <button onClick={() => setShowSettings(true)} className="bg-primary text-background font-bold py-3 px-8 rounded-full shadow-lg">Nhập API Key</button>
                <SettingsModal isOpen={showSettings} onClose={() => { setShowSettings(false); fetchData(); }} />
            </div>
        );
    }

    return (
        <div className="pb-24 animate-in fade-in duration-500">
            <header className="px-5 py-4 flex items-center justify-between">
                <h1 className="text-xl font-black text-white">Quản Lý Vốn</h1>
                <button onClick={() => setShowSettings(true)}><span className="material-symbols-outlined text-text-secondary">settings</span></button>
            </header>

            <div className="px-4 space-y-4">

                {/* 1. BALANCE CARD (Fix NaN) */}
                <div className="bg-gradient-to-r from-surface to-surface/50 border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5 transform rotate-12"><span className="material-symbols-outlined text-9xl">wallet</span></div>
                    <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Tổng Tài Sản (Equity)</p>
                    <div className="text-4xl font-black text-white mt-1">
                        {totalEquity > 0 ? `$${totalEquity.toLocaleString()}` : error ? <span className="text-red-500 text-sm">Lỗi</span> : '...'}
                        <span className="text-sm font-medium text-text-secondary ml-1">USDT</span>
                    </div>
                    <div className="mt-4 flex gap-6 border-t border-white/5 pt-3">
                        <div>
                            <p className="text-[9px] text-text-secondary uppercase mb-0.5">Lãi hôm nay</p>
                            <p className={`font-bold text-lg leading-none ${todayPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                {todayPnL > 0 ? '+' : ''}{todayPnL.toFixed(2)}$
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] text-text-secondary uppercase mb-0.5">Số lệnh</p>
                            <p className="font-bold text-lg leading-none text-white">{todayTrades}</p>
                        </div>
                    </div>
                </div>

                {/* 2. BAR CHART */}
                <div className="bg-surface border border-white/5 rounded-2xl p-4">
                    <h3 className="text-[10px] font-bold text-text-secondary uppercase mb-4">Biểu đồ Lãi/Lỗ (7 ngày)</h3>
                    <div className="flex justify-between items-end h-24 gap-2">
                        {chartData.map((day, index) => {
                            const heightPercent = Math.max((Math.abs(day.pnl) / maxPnL) * 100, 5);
                            const isPositive = day.pnl >= 0;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
                                    <span className={`text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-4 ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                                        {Math.round(day.pnl)}$
                                    </span>
                                    <div className="relative w-full flex justify-center items-end h-full">
                                        <div
                                            className={`w-full max-w-[8px] rounded-full opacity-80 group-hover:opacity-100 transition-all ${isPositive ? 'bg-bullish' : 'bg-bearish'}`}
                                            style={{ height: `${heightPercent}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[8px] text-text-secondary">{day.date}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 3. ACTIVE POSITIONS (ULTRA COMPACT) */}
                <div>
                    <h3 className="text-xs font-bold text-text-secondary uppercase mb-2 px-1">Đang Chạy ({positions.length})</h3>
                    <div className="bg-surface border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                        {positions.length === 0 ? (
                            <div className="p-3 text-center text-xs text-text-secondary italic">Không có lệnh nào.</div>
                        ) : (
                            positions.map((pos) => {
                                const isLong = pos.posSide === 'long';
                                const pnl = parseFloat(pos.upl);
                                return (
                                    <div key={pos.instId} className="flex items-center justify-between p-3 py-2 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${isLong ? 'bg-bullish' : 'bg-bearish'}`}></div>
                                            <span className="font-bold text-sm text-white">{pos.instId.split('-')[0]}</span>
                                            <span className={`text-[9px] font-bold px-1.5 rounded ${isLong ? 'bg-bullish/10 text-bullish' : 'bg-bearish/10 text-bearish'}`}>
                                                {isLong ? 'L' : 'S'} x{pos.lever}
                                            </span>
                                        </div>
                                        <span className={`font-mono font-bold text-sm ${pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                            {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}$
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 4. REALIZED HISTORY (FILTERED) */}
                <div>
                    <h3 className="text-xs font-bold text-text-secondary uppercase mb-2 px-1">Lịch sử chốt (Đã lọc)</h3>
                    <div className="bg-surface border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                        {realizedHistory.slice(0, 5).map((order) => {
                            const pnl = parseFloat(order.pnl || '0');
                            return (
                                <div key={order.ordId} className="flex items-center justify-between p-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${pnl > 0 ? 'bg-bullish/20 text-bullish' : 'bg-bearish/20 text-bearish'}`}>
                                            {pnl > 0 ? 'WIN' : 'LOSS'}
                                        </span>
                                        <span className="text-xs font-medium text-white">{order.instId.split('-')[0]}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`font-bold text-sm block ${pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                            {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}$
                                        </span>
                                        <span className="text-[10px] text-text-secondary">
                                            {new Date(parseInt(order.fillTime || order.uTime)).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                        {realizedHistory.length === 0 && <p className="p-3 text-center text-xs text-text-secondary">Chưa có lệnh chốt lời/lỗ nào.</p>}
                    </div>
                </div>

                {error && <div className="text-center text-red-500 text-xs mt-4 bg-red-500/10 p-2 rounded">{error}</div>}

            </div>
            <SettingsModal isOpen={showSettings} onClose={() => { setShowSettings(false); fetchData(); }} />
        </div>
    );
};

export default Journal;
