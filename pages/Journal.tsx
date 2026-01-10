
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
        setError('');

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
        } catch (err: any) {
            setError(err.message || 'Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto refresh every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Calculate Totals
    const totalPnL = positions.reduce((sum, p) => sum + parseFloat(p.upl), 0);
    const totalInvested = positions.reduce((sum, p) => sum + (parseFloat(p.sz) * parseFloat(p.avgPx) / parseFloat(p.lever)), 0);

    if (!hasKey) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-in fade-in">
                <div className="h-16 w-16 bg-surface rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl text-primary">account_balance_wallet</span>
                </div>
                <h2 className="text-xl font-bold mb-2">Kết nối OKX</h2>
                <p className="text-text-secondary text-sm mb-6">
                    Nhập API Key để xem Nhật ký giao dịch, quản lý Lời/Lỗ tự động.
                </p>
                <button
                    onClick={() => setShowSettings(true)}
                    className="bg-primary text-background font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                >
                    Nhập API Key Ngay
                </button>
                <SettingsModal isOpen={showSettings} onClose={() => { setShowSettings(false); fetchData(); }} />
            </div>
        );
    }

    return (
        <div className="pb-24 animate-in slide-in-from-right duration-300">
            <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md px-4 py-4 flex items-center justify-between">
                <h1 className="text-xl font-extrabold flex items-center gap-2">
                    <span className="material-symbols-outlined fill-1">history_edu</span>
                    Nhật Ký Lời/Lỗ
                </h1>
                <button
                    onClick={fetchData}
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-surface hover:bg-white/10"
                >
                    <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
                </button>
            </header>

            <div className="px-4 space-y-4">
                {/* SUMMARY CARD */}
                <div className="bg-surface rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="material-symbols-outlined text-8xl">account_balance</span>
                    </div>

                    <p className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-1">Tổng Tài Sản (Equity)</p>
                    <div className="text-3xl font-black tracking-tight flex items-baseline gap-1">
                        {balance ? `$${parseFloat(balance.totalEq).toLocaleString()}` : '---'}
                        <span className="text-sm font-medium text-text-secondary">USDT</span>
                    </div>

                    <div className="mt-4 flex gap-4">
                        <div>
                            <p className="text-[10px] text-text-secondary uppercase">Đang Ký Quỹ</p>
                            <p className="font-bold text-lg">{totalInvested ? `$${totalInvested.toFixed(2)}` : '$0.00'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-text-secondary uppercase">PnL Thả Nổi</p>
                            <p className={`font-bold text-lg ${totalPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                {totalPnL > 0 ? '+' : ''}{totalPnL.toFixed(2)} $
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {error}
                    </div>
                )}

                {/* POSITIONS LIST */}
                <div>
                    <h3 className="text-sm font-bold text-text-secondary uppercase mb-3 px-1">Vị thế đang mở ({positions.length})</h3>

                    {positions.length === 0 ? (
                        <div className="text-center py-8 text-text-secondary text-sm bg-surface/30 rounded-xl border border-white/5 border-dashed">
                            Chưa có lệnh nào đang chạy.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {positions.map((pos) => {
                                const isLong = pos.posSide === 'long';
                                const pnl = parseFloat(pos.upl);
                                const pnlPercent = parseFloat(pos.uplRatio) * 100;

                                return (
                                    <div key={pos.instId} className="bg-surface rounded-xl p-4 border border-white/5 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-8 w-1 rounded-full ${isLong ? 'bg-bullish' : 'bg-bearish'}`}></div>
                                                <div>
                                                    <h4 className="font-bold">{pos.instId.replace('-USDT-SWAP', '')}</h4>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isLong ? 'bg-bullish/20 text-bullish' : 'bg-bearish/20 text-bearish'}`}>
                                                        {isLong ? 'LONG' : 'SHORT'} x{pos.lever}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold text-lg ${pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                                    {pnl > 0 ? '+' : ''}{pnl.toFixed(2)} $
                                                </p>
                                                <p className={`text-xs font-medium ${pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                                    {pnlPercent > 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-[10px] text-text-secondary bg-background/50 p-2 rounded-lg">
                                            <div>
                                                <p>Giá vào</p>
                                                <p className="text-white font-medium">{parseFloat(pos.avgPx).toFixed(4)}</p>
                                            </div>
                                            <div>
                                                <p>Thanh lý</p>
                                                <p className="text-warning font-medium">{pos.liqPx || '---'}</p>
                                            </div>
                                            <div>
                                                <p>Ký quỹ</p>
                                                <p className="text-white font-medium">{(parseFloat(pos.sz) * parseFloat(pos.avgPx) / parseFloat(pos.lever)).toFixed(2)}$</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* HISTORY LIST */}
                <div>
                    <h3 className="text-sm font-bold text-text-secondary uppercase mb-3 px-1 mt-6">Lịch sử lệnh đã đóng (Gần đây)</h3>
                    {history.length === 0 ? (
                        <p className="text-xs text-text-secondary italic px-1">Chưa có dữ liệu lịch sử.</p>
                    ) : (
                        <div className="space-y-2">
                            {history.map((order: any) => {
                                const isBuy = order.side === 'buy';
                                const pnl = parseFloat(order.pnl || '0');
                                return (
                                    <div key={order.ordId} className="bg-surface/50 rounded-lg p-3 border border-white/5 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-1 rounded ${isBuy ? 'bg-bullish/20 text-bullish' : 'bg-bearish/20 text-bearish'}`}>
                                                    {isBuy ? 'MUA' : order.side === 'sell' ? 'BÁN' : order.side}
                                                </span>
                                                <span className="font-bold text-sm">{order.instId.replace('-USDT-SWAP', '')}</span>
                                            </div>
                                            <p className="text-[10px] text-text-secondary">{new Date(parseInt(order.uTime)).toLocaleString('vi-VN')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                                {pnl > 0 ? '+' : ''}{pnl.toFixed(2)} $
                                            </p>
                                            <p className="text-[10px] text-text-secondary">Giá: {order.avgPx}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            <SettingsModal isOpen={showSettings} onClose={() => { setShowSettings(false); fetchData(); }} />
        </div>
    );
};

export default Journal;
