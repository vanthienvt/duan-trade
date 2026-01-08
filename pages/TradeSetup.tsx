
import React, { useState, useEffect } from 'react';
import { View, MarketSignal, SignalType } from '../types';
import { formatPrice } from '../utils';
import SystemHealth from '../components/SystemHealth';
import { getMarketData } from '../services/apiService';

interface Props {
  signal: MarketSignal | null;
  onNavigate: (view: View, signal?: MarketSignal) => void;
}

const TradeSetup: React.FC<Props> = ({ signal, onNavigate }) => {
  if (!signal) return null;

  const [loading, setLoading] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const [displaySignal, setDisplaySignal] = useState<MarketSignal>(signal);

  // Update state when prop changes
  useEffect(() => {
    if (signal) setDisplaySignal(signal);
  }, [signal]);


  // Helper to format price dynamically based on value
  // Uses utils.formatPrice

  useEffect(() => {
    const initData = async () => {
      // If we have "Skeleton Data" (Price=0 or OI=N/A), show full loading screen
      const isSkeleton = !displaySignal.price || displaySignal.price === 0 || displaySignal.openInterest === 'N/A';
      if (isSkeleton) setLoading(true); // Only blocking load if data is missing

      const fetchDataWithRetry = async (retries = 3, delay = 1000): Promise<any> => {
        try {
          const data = await getMarketData(displaySignal.pair);
          if (!data || data.price === 0) throw new Error("Invalid Data");
          return data;
        } catch (err) {
          if (retries > 0) {
            await new Promise(res => setTimeout(res, delay));
            return fetchDataWithRetry(retries - 1, delay * 1.5);
          }
          return null;
        }
      };

      // FETCH DATA
      const freshData = await fetchDataWithRetry();

      if (freshData) {
        setDisplaySignal(prev => ({
          ...prev,
          price: freshData.price,
          change24h: freshData.change24h,
          // Update Pro Data
          openInterest: freshData.openInterest,
          fundingRate: freshData.fundingRate,
          oiTrend: freshData.oiTrend,
        }));
      }

      setLoading(false);
    };

    initData();
  }, [signal?.id]);

  // Blocking Loading Screen (Only if we have NO valid data)
  if (loading && (!displaySignal.price || displaySignal.openInterest === 'N/A')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-text-secondary animate-pulse">Đang đồng bộ dữ liệu {signal?.pair}...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-in slide-in-from-bottom duration-500 pb-40">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background/90 px-4 py-4 backdrop-blur-md border-b border-white/5">
        <button onClick={() => onNavigate('signals')} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/5">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="text-center">
          <h2 className="text-base font-black tracking-tight">{displaySignal.pair}</h2>
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{displaySignal.exchange} v2.5 Full</span>
        </div>
        <button
          onClick={() => setShowHealth(true)}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">wifi_tethering</span>
        </button>
      </header>

      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
            {displaySignal.pair[0]}
          </div>
          <h1 className="text-5xl font-black tracking-tighter">${formatPrice(displaySignal.price)}</h1>
        </div>
        <div className="flex items-center gap-2 bg-bullish/10 px-4 py-1.5 rounded-full border border-bullish/20">
          <span className="material-symbols-outlined text-bullish text-[20px]">trending_up</span>
          <p className="text-bullish text-xs font-black uppercase tracking-widest">+{displaySignal.change24h}% (24h)</p>
        </div>
      </div>

      <div className="px-4 space-y-6">
        <div className="bg-surface rounded-2xl p-5 border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">psychology</span>
              <h3 className="font-black text-sm uppercase tracking-wider">Phân tích AI</h3>
            </div>
            <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-[0.2em] ${displaySignal.type === SignalType.LONG ? 'bg-bullish/20 text-bullish' : 'bg-bearish/20 text-bearish'}`}>
              {displaySignal.type === SignalType.LONG ? 'STRONG BUY' : 'STRONG SELL'}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-text-secondary uppercase">Độ mạnh xu hướng</span>
              <span className="text-white">{displaySignal.confidence}% {displaySignal.type === SignalType.LONG ? 'Tăng' : 'Giảm'}</span>
            </div>
            <div className="h-2 w-full bg-background rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${displaySignal.type === SignalType.LONG ? 'from-blue-500 to-bullish' : 'from-orange-500 to-bearish'}`}
                style={{ width: `${displaySignal.confidence}%` }}>
              </div>
            </div>
            <p className="text-[11px] text-text-secondary font-medium leading-relaxed italic opacity-80">
              {displaySignal.summary}
            </p>
            {/* Pro Indicators Display */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
              <div className="bg-background/40 rounded-lg p-2 border border-white/5 relative overflow-hidden">
                <p className="text-[9px] text-text-secondary uppercase font-bold">Open Interest</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-white">{displaySignal.openInterest || 'N/A'}</p>
                  {displaySignal.oiTrend && (
                    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${displaySignal.oiTrend === 'UP' ? 'bg-bullish/20 text-bullish' :
                      displaySignal.oiTrend === 'DOWN' ? 'bg-bearish/20 text-bearish' :
                        'bg-white/10 text-text-secondary'
                      }`}>
                      <span>{displaySignal.oiTrend === 'UP' ? 'Tăng' : displaySignal.oiTrend === 'DOWN' ? 'Giảm' : 'Đi ngang'}</span>
                      <span className="material-symbols-outlined text-[10px]">{
                        displaySignal.oiTrend === 'UP' ? 'trending_up' :
                          displaySignal.oiTrend === 'DOWN' ? 'trending_down' :
                            'remove'
                      }</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-background/40 rounded-lg p-2 border border-white/5">
                <p className="text-[9px] text-text-secondary uppercase font-bold">Funding Rate</p>
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-black ${parseFloat(displaySignal.fundingRate || '0') > 0.04 ? 'text-bearish' :
                    parseFloat(displaySignal.fundingRate || '0') < 0.01 ? 'text-bullish' : 'text-white'
                    }`}>
                    {displaySignal.fundingRate || '0.00%'}
                  </p>
                  {/* Funding Rate Visual Indicator */}
                  {(parseFloat(displaySignal.fundingRate || '0') > 0.04) && (
                    <span className="bg-bearish/20 text-bearish text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Cao ⚠️</span>
                  )}
                  {(parseFloat(displaySignal.fundingRate || '0') <= 0.01) && (
                    <span className="bg-bullish/20 text-bullish text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Tốt ✅</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <h3 className="font-black text-lg px-1 tracking-tighter">Thiết Lập Giao Dịch</h3>

        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border-l-4 border-l-primary bg-surface border-y border-r border-white/5 p-5 group">
            <span className="material-symbols-outlined absolute -top-4 -right-4 text-7xl opacity-5">my_location</span>
            <div className="relative z-10">
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest mb-2 block">
                  {displaySignal.confidence > 88 ? 'Vùng Mua (Market Entry)' : 'Vùng Mua (Limit Entry)'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black">
                    ${displaySignal.confidence > 88
                      ? formatPrice(displaySignal.price * 0.998) // Sát giá hiện tại
                      : formatPrice(displaySignal.price * 0.98)  // Chờ chỉnh sâu
                    }
                  </span>
                  <span className="text-text-secondary font-black">-</span>
                  <span className="text-2xl font-black">
                    ${displaySignal.confidence > 88
                      ? formatPrice(displaySignal.price) // Giá hiện tại
                      : formatPrice(displaySignal.price * 0.995) // Chờ chỉnh nhẹ
                    }
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary mt-2 font-bold uppercase tracking-wider">
                  {displaySignal.confidence > 88
                    ? 'Tín hiệu rất mạnh. Có thể vào lệnh ngay giá hiện tại.'
                    : 'Tín hiệu tốt. Nên kê lệnh Limit chờ giá hồi về vùng này.'}
                </p>
                <div className="relative overflow-hidden rounded-2xl border-l-4 border-l-warning bg-surface border-y border-r border-white/5 p-5 group">
                  <span className="material-symbols-outlined absolute -top-4 -right-4 text-7xl opacity-5">do_not_disturb</span>
                  <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase text-warning tracking-widest mb-2 block">Vùng Nguy Hiểm (Danger Zone)</span>
                    <span className="text-xl font-black">Trên ${formatPrice(displaySignal.price * 1.05)}</span>
                    <p className="text-[10px] text-text-secondary mt-2 font-bold uppercase tracking-wider">Không nên FOMO mua đuổi tại mức giá này.</p>
                  </div>
                </div>
              </div>

              <h3 className="font-black text-lg px-1 tracking-tighter pt-4">Mục Tiêu & Rủi Ro</h3>
              <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
                {[
                  { label: 'TP 1 (Ngắn hạn)', target: formatPrice(displaySignal.price * (displaySignal.type === SignalType.LONG ? 1.08 : 0.92)), p: '8.0%', color: 'text-bullish', icon: '1' },
                  { label: 'TP 2 (Swing)', target: formatPrice(displaySignal.price * (displaySignal.type === SignalType.LONG ? 1.15 : 0.85)), p: '15.0%', color: 'text-bullish', icon: '2' },
                  { label: 'TP 3 (Moonbag)', target: formatPrice(displaySignal.price * (displaySignal.type === SignalType.LONG ? 1.30 : 0.70)), p: '30.0%', color: 'text-bullish', icon: 'rocket_launch' },
                  { label: 'Cắt Lỗ (Stop Loss)', target: formatPrice(displaySignal.price * (displaySignal.type === SignalType.LONG ? 0.93 : 1.07)), p: '-7.0%', color: 'text-bearish', icon: 'shield' }
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Remove dots (thousands) and replace comma with dot (decimal) for exchange compatibility
                          // "1.234,56" -> "1234.56" (Binance understands this)
                          // OR "1234,56" (Binance might also understand this depending on locale, but dot decimal is standard for API/Input)
                          // User requested: "đổi giấy . thành ," (meaning display comma). 
                          // And previously: "copy bỏ lên sàn sẽ thành số lớn" -> likely because "1,234" was interpreted as 1234 in a locale that expects dot.
                          // Safest for Exchange Input: Raw Number "1234.56"

                          // Convert "1.234,56" back to "1234.56"
                          const rawPrice = item.target.replace(/\./g, '').replace(',', '.');
                          navigator.clipboard.writeText(rawPrice);
                        }}
                        className="material-symbols-outlined text-text-secondary hover:text-primary transition-colors active:scale-90"
                      >
                        content_copy
                      </button>
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

            {showHealth && <SystemHealth onClose={() => setShowHealth(false)} />}
          </div >
          );
};

          export default TradeSetup;
