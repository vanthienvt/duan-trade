
import React from 'react';
import { View, MarketSignal, SignalType } from '../types';

interface Props {
  signal: MarketSignal | null;
  onNavigate: (view: View, signal?: MarketSignal) => void;
}

const RiskCalc: React.FC<{ signal: MarketSignal }> = ({ signal }) => {
  const [balance, setBalance] = React.useState<string>(() => localStorage.getItem('user_balance') || '1000');
  const [riskPercent, setRiskPercent] = React.useState<number>(1);

  const entryPrice = signal.price;
  const stopLossPrice = signal.price * 0.95; // 5% SL from logic
  const slDistancePercent = Math.abs((entryPrice - stopLossPrice) / entryPrice);

  const riskAmount = (parseFloat(balance) || 0) * (riskPercent / 100);
  const positionSizeUSDT = slDistancePercent > 0 ? riskAmount / slDistancePercent : 0;
  // If leverage needed, we can imply it, but for spot/perp simple calc:
  // Position Size (Coins) = riskAmount / |Entry - SL|
  const positionSizeCoins = Math.abs(entryPrice - stopLossPrice) > 0
    ? riskAmount / Math.abs(entryPrice - stopLossPrice)
    : 0;

  React.useEffect(() => {
    localStorage.setItem('user_balance', balance);
  }, [balance]);

  return (
    <div className="mx-4 mb-2 p-5 bg-surface border border-white/10 rounded-2xl shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">calculate</span>
        <h3 className="font-black text-sm uppercase tracking-wider">Máy Tính Đi Lệnh</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-[10px] uppercase font-bold text-text-secondary">Vốn của bạn ($)</label>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm font-bold mt-1 focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-text-secondary">Rủi ro (%)</label>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setRiskPercent(1)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${riskPercent === 1 ? 'bg-primary text-white border-primary' : 'border-white/10 text-text-secondary'}`}>1%</button>
            <button onClick={() => setRiskPercent(2)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${riskPercent === 2 ? 'bg-primary text-white border-primary' : 'border-white/10 text-text-secondary'}`}>2%</button>
          </div>
        </div>
      </div>

      <div className="bg-background/50 rounded-xl p-3 border border-white/5 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-text-secondary font-medium">Chấp nhận lỗ (R):</span>
          <span className="text-sm font-black text-bearish">-${riskAmount.toFixed(1)}</span>
        </div>
        <div className="h-px bg-white/5"></div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-text-secondary font-medium uppercase">Volume Cần Vào:</span>
          <span className="text-lg font-black text-primary">${positionSizeUSDT.toFixed(0)}</span>
        </div>
        <p className="text-[10px] text-right text-text-secondary opacity-70">
          ( ~ {positionSizeCoins.toFixed(4)} {signal.pair.split('/')[0]} )
        </p>
      </div>
    </div>
  );
};

// Helper to format price dynamically based on value
const formatPrice = (price: number) => {
  if (price < 0.01) return price.toFixed(8);
  if (price < 1) return price.toFixed(4);
  return price.toFixed(2);
};

return (
  <div className="flex flex-col animate-in slide-in-from-bottom duration-500 pb-32">
    <header className="sticky top-0 z-50 flex items-center justify-between bg-background/90 px-4 py-4 backdrop-blur-md border-b border-white/5">
      <button onClick={() => onNavigate('signals')} className="h-10 w-10 flex items-center justify-center rounded-full">
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
      <div className="text-center">
        <h2 className="text-base font-black tracking-tight">{signal.pair}</h2>
        <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{signal.exchange}</span>
      </div>
      <button className="h-10 w-10 flex items-center justify-center rounded-full">
        <span className="material-symbols-outlined">share</span>
      </button>
    </header>

    <div className="flex flex-col items-center pt-8 pb-6 px-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
          {signal.pair[0]}
        </div>
        <h1 className="text-5xl font-black tracking-tighter">${formatPrice(signal.price)}</h1>
      </div>
      <div className="flex items-center gap-2 bg-bullish/10 px-4 py-1.5 rounded-full border border-bullish/20">
        <span className="material-symbols-outlined text-bullish text-[20px]">trending_up</span>
        <p className="text-bullish text-xs font-black uppercase tracking-widest">+{signal.change24h}% (24h)</p>
      </div>
    </div>

    {/* Risk Calculator Logic */}
    <RiskCalc signal={signal} />

    <div className="px-4 space-y-6">
      <div className="bg-surface rounded-2xl p-5 border border-white/5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">psychology</span>
            <h3 className="font-black text-sm uppercase tracking-wider">Phân tích AI</h3>
          </div>
          <span className="px-2.5 py-1 rounded text-[9px] font-black bg-primary/20 text-primary uppercase tracking-[0.2em]">STRONG BUY</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-text-secondary uppercase">Độ mạnh xu hướng</span>
            <span className="text-white">{signal.confidence}% Tăng</span>
          </div>
          <div className="h-2 w-full bg-background rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-primary" style={{ width: `${signal.confidence}%` }}></div>
          </div>
          <p className="text-[11px] text-text-secondary font-medium leading-relaxed italic opacity-80">
            {signal.summary}
          </p>
        </div>
      </div>

      <h3 className="font-black text-lg px-1 tracking-tighter">Thiết Lập Giao Dịch</h3>

      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl border-l-4 border-l-primary bg-surface border-y border-r border-white/5 p-5 group">
          <span className="material-symbols-outlined absolute -top-4 -right-4 text-7xl opacity-5">my_location</span>
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase text-primary tracking-widest mb-2 block">Vùng Mua (Sniper Entry)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">${formatPrice(signal.price * 0.98)}</span>
              <span className="text-text-secondary font-black">-</span>
              <span className="text-2xl font-black">${formatPrice(signal.price * 0.995)}</span>
            </div>
            <p className="text-[10px] text-text-secondary mt-2 font-bold uppercase tracking-wider">Vùng giá tối ưu để vào lệnh với rủi ro thấp nhất.</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border-l-4 border-l-warning bg-surface border-y border-r border-white/5 p-5 group">
          <span className="material-symbols-outlined absolute -top-4 -right-4 text-7xl opacity-5">do_not_disturb</span>
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase text-warning tracking-widest mb-2 block">Vùng Nguy Hiểm (Danger Zone)</span>
            <span className="text-xl font-black">Trên ${formatPrice(signal.price * 1.05)}</span>
            <p className="text-[10px] text-text-secondary mt-2 font-bold uppercase tracking-wider">Không nên FOMO mua đuổi tại mức giá này.</p>
          </div>
        </div>
      </div>

      <h3 className="font-black text-lg px-1 tracking-tighter pt-4">Mục Tiêu & Rủi Ro</h3>
      <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
        {[
          { label: 'TP 1 (Ngắn hạn)', target: formatPrice(signal.price * 1.08), p: '+8.0%', color: 'text-bullish', icon: '1' },
          { label: 'TP 2 (Swing)', target: formatPrice(signal.price * 1.15), p: '+15.2%', color: 'text-bullish', icon: '2' },
          { label: 'TP 3 (Moonbag)', target: formatPrice(signal.price * 1.30), p: '+30.0%', color: 'text-bullish', icon: 'rocket_launch' },
          { label: 'Cắt Lỗ (Stop Loss)', target: formatPrice(signal.price * 0.95), p: '-5.0%', color: 'text-bearish', icon: 'shield' }
        ].map((item, i) => (
          <div key={i} className={`flex items-center justify-between p-5 hover:bg-white/5 transition-colors cursor-pointer group ${item.label.includes('Cắt Lỗ') ? 'bg-bearish/5' : ''}`}>
            <div className="flex items-center gap-4">
              <div className={`size-8 rounded-full flex items-center justify-center font-black text-xs ${item.label.includes('Cắt Lỗ') ? 'bg-bearish/20 text-bearish' : 'bg-bullish/20 text-bullish'}`}>
                {item.icon.length === 1 ? item.icon : <span className="material-symbols-outlined text-[16px]">{item.icon}</span>}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-secondary uppercase">{item.label}</span>
                <span className={`text-base font-black ${item.color}`}>${item.target}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black px-2 py-1 rounded bg-white/5 uppercase ${item.color}`}>{item.p}</span>
              <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors">content_copy</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <footer className="fixed bottom-0 left-0 w-full p-4 bg-background/90 backdrop-blur-xl border-t border-white/5 z-50 safe-bottom">
      <button
        onClick={() => onNavigate('dashboard')}
        className="w-full h-14 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-2xl shadow-primary/40"
      >
        <span>Giao Dịch Ngay</span>
        <span className="material-symbols-outlined">arrow_outward</span>
      </button>
    </footer>
  </div>
);
};

export default TradeSetup;
