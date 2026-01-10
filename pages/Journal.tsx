
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
        // Don't clear error immediately to avoid flicker if it persists

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
        const interval = setInterval(fetchData, 15000); // Faster refresh (15s)
        return () => clearInterval(interval);
    }, []);

    // --- STATS CALCULATION ---
    const totalPnL = positions.reduce((sum, p) => sum + parseFloat(p.upl), 0);

    // Win Rate from History (Last 100)
    const closedOrders = history.filter(o => parseFloat(o.pnl) !== 0);
    const winningOrders = closedOrders.filter(o => parseFloat(o.pnl) > 0);
    const winRate = closedOrders.length > 0
        ? Math.round((winningOrders.length / closedOrders.length) * 100)
        : 0;

    // --- PnL CALCULATIONS (Today & Month) ---
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const dailyPnL = closedOrders
        .filter(o => parseInt(o.fillTime || o.uTime) >= startOfDay)
        .reduce((sum, o) => sum + parseFloat(o.pnl), 0);

    const monthlyPnL = closedOrders
        .filter(o => parseInt(o.fillTime || o.uTime) >= startOfMonth)
        .reduce((sum, o) => sum + parseFloat(o.pnl), 0);

    // Safe formatting helper
    const safeBalance = balance && balance.totalEq ? parseFloat(balance.totalEq).toLocaleString() : '---';

    // --- RENDER ---
    if (!hasKey) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-in fade-in">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <span className="material-symbols-outlined text-4xl text-primary">account_balance_wallet</span>
                </div>
                <h2 className="text-xl font-bold mb-2">Kết nối Ví OKX</h2>
                <p className="text-text-secondary text-sm mb-8 max-w-[250px]">
                    Nhập API Key để App tự động thống kê Lời/Lỗ và hiệu suất giao dịch của bạn.
                </p>
                <button
                    onClick={() => setShowSettings(true)}
                    className="bg-primary text-background font-bold py-3 px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                    Nhập API Key
                </button>
                <SettingsModal isOpen={showSettings} onClose={() => { setShowSettings(false); fetchData(); }} />
            </div>
        );
    }

    return (
        <div className="pb-24 animate-in fade-in duration-500">
            {/* HEADER */}
            <header className="px-5 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    My Portfolio
                </h1>
                <button onClick={() => setShowSettings(true)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                    <span className="material-symbols-outlined text-sm text-text-secondary">settings</span>
                </button>
            </header>

            <div className="px-4 space-y-6">

                {/* 1. HERO SECTION: PORTFOLIO VALUE + STATISTICS */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Total Balance (Full Width Top) */}
                    <div className="col-span-2 bg-gradient-to-br from-surface to-surface/50 border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <span className="material-symbols-outlined text-9xl">attach_money</span>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">Tổng Tài Sản</p>
                        <div className="text-4xl font-black text-white tracking-tight flex items-baseline gap-1">
                            {safeBalance} <span className="text-lg font-medium text-text-secondary">USDT</span>
                        </div>
                    </div>

                    {/* Today's PnL */}
                    <div className="bg-surface border border-white/5 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-lg text-text-secondary">calendar_today</span>
                            <span className="text-[10px] font-bold text-text-secondary uppercase">Hôm nay</span>
                        </div>
                        <div className={`text-xl font-black ${dailyPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                            {dailyPnL > 0 ? '+' : ''}{dailyPnL.toFixed(2)}$
                        </div>
                    </div>

                    {/* Monthly PnL */}
                    <div className="bg-surface border border-white/5 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-lg text-text-secondary">date_range</span>
                            <span className="text-[10px] font-bold text-text-secondary uppercase">Tháng này</span>
                        </div>
                        <div className={`text-xl font-black ${monthlyPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                            {monthlyPnL > 0 ? '+' : ''}{monthlyPnL.toFixed(2)}$
                        </div>
                    </div>

                    {/* Winrate Strip */}
                    <div className="col-span-2 bg-surface border border-white/5 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-text-secondary uppercase">Tỷ lệ thắng (100 lệnh gần nhất)</span>
                        <span className={`text-sm font-black ${winRate >= 50 ? 'text-primary' : 'text-text-secondary'}`}>{winRate}% Win</span>
                    </div>
                </div>

                {/* 2. ACTIVE POSITIONS (GRID CARD) */}
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Đang Chạy ({positions.length})
                        </h3>
                        <span className={`text-xs font-black ${totalPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                            PnL: {totalPnL > 0 ? '+' : ''}{totalPnL.toFixed(2)}$
                        </span>
                    </div>

                    {positions.length === 0 ? (
                        <div className="bg-surface/30 border border-white/5 border-dashed rounded-xl h-24 flex items-center justify-center text-text-secondary text-xs">
                            Không có lệnh nào đang mở
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {positions.map((pos) => {
                                const isLong = pos.posSide === 'long';
                                const pnl = parseFloat(pos.upl);
                                return (
                                    <div key={pos.instId} className="bg-surface border border-white/5 rounded-2xl p-3 relative overflow-hidden group hover:border-white/20 transition-all">
                                        {/* Side Indicator Stripe */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isLong ? 'bg-bullish' : 'bg-bearish'}`}></div>

                                        <div className="pl-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-sm tracking-tight">{pos.instId.split('-')[0]}</span>
                                                <span className={`text-[9px] font-black px-1.5 rounded ${isLong ? 'bg-bullish/10 text-bullish' : 'bg-bearish/10 text-bearish'}`}>
                                                    x{pos.lever}
                                                </span>
                                            </div>

                                            <div className={`text-xl font-black ${pnl >= 0 ? 'text-bullish' : 'text-bearish'} tracking-tighter`}>
                                                {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}
                                            </div>
                                            <div className="text-[10px] text-text-secondary flex justify-between mt-1">
                                                <span>ROI</span>
                                                <span className={pnl >= 0 ? 'text-bullish' : 'text-bearish'}>
                                                    {(parseFloat(pos.uplRatio) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 3. RECENT ACTIVITY (COMPACT ROW) */}
                <div className="bg-surface/50 border border-white/5 rounded-2xl p-4">
                    <h3 className="text-xs font-bold text-text-secondary uppercase mb-3">Lịch sử gần đây</h3>
                    <div className="space-y-3">
                        {history.slice(0, 3).map((order) => {
                            const pnl = parseFloat(order.pnl || '0');
                            return (
                                <div key={order.ordId} className="flex items-center justify-between text-xs border-b border-white/5 last:border-0 pb-2 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${pnl >= 0 ? 'bg-bullish' : 'bg-bearish'}`}></div>
                                        <span className="font-bold text-white">{order.instId.split('-')[0]}</span>
                                        <span className="text-[10px] text-text-secondary">{order.side === 'buy' ? 'Long' : 'Short'}</span>
                                    </div>
                                    <span className={`font-bold ${pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                        {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}$
                                    </span>
                                </div>
                            )
                        })}
                        {history.length === 0 && <p className="text-[10px] text-text-secondary italic text-center">Chưa có lịch sử</p>}
                    </div>
                </div>

            </div>

            <SettingsModal isOpen={showSettings} onClose={() => { setShowSettings(false); fetchData(); }} />
        </div>
    );
};

export default Journal;
