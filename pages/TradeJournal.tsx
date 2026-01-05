
import React from 'react';
import { View, MarketSignal, SignalType } from '../types';

interface Props {
  onNavigate: (view: View, signal?: MarketSignal) => void;
}

const HISTORY = [
  { pair: 'ETH/USDT', date: '24 Th10, 14:30', profit: '+$320.00', p: '+15.2%', type: 'LONG', status: 'win' },
  { pair: 'BTC/USDT', date: '23 Th10, 09:15', profit: '-$120.50', p: '-2.4%', type: 'SHORT', status: 'loss' },
  { pair: 'DOGE/USDT', date: '22 Th10, 16:45', profit: 'Bỏ qua', p: 'AI: +5%', type: 'SHORT', status: 'skipped' },
  { pair: 'SOL/USDT', date: '21 Th10, 11:20', profit: '+$85.40', p: '+8.2%', type: 'LONG', status: 'win' }
];

const TradeJournal: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col animate-in fade-in duration-500 pb-20">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background p-4 border-b border-white/5">
        <button onClick={() => onNavigate('dashboard')} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/5">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-black tracking-tight flex-1 text-center pr-10">Nhật Ký Giao Dịch</h2>
      </header>

      <div className="overflow-x-auto no-scrollbar px-4 py-6">
        <div className="flex gap-4 min-w-max">
          {[
            { label: 'Lợi nhuận ròng', val: '+$1,240', p: '+12%', color: 'text-bullish' },
            { label: 'Tỷ lệ thắng', val: '68%', p: '+2%', color: 'text-bullish' },
            { label: 'Tổng lệnh', val: '42', p: 'Tuần này', color: 'text-text-secondary' }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-2xl p-5 bg-surface shadow-lg min-w-[160px] border border-white/5">
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black tracking-tighter mt-1">{stat.val}</p>
              <p className={`${stat.color} text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-1`}>
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                {stat.p}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-stretch rounded-xl bg-surface border border-white/5 h-12 mb-6">
          <div className="flex items-center justify-center pl-4 text-text-secondary">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold placeholder:text-text-secondary/50 px-4" placeholder="Tìm kiếm coin (vd: ETH)" />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6">
          {['Tất cả', 'Thời gian', 'Kết quả', 'Trạng thái'].map((f, i) => (
             <button key={i} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${i === 0 ? 'bg-primary' : 'bg-surface border border-white/5 text-text-secondary'}`}>
               {f}
               {i > 0 && <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>}
             </button>
          ))}
        </div>

        <div className="space-y-4">
          {HISTORY.map((item, i) => (
            <div key={i} className={`flex flex-col gap-4 rounded-2xl bg-surface p-5 border border-white/5 transition-all active:scale-[0.98] ${item.status === 'skipped' ? 'opacity-50 grayscale' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border border-white/5">
                    <span className="material-symbols-outlined text-primary text-[24px]">token</span>
                  </div>
                  <div>
                    <p className="text-base font-black tracking-tight">{item.pair}</p>
                    <p className="text-text-secondary text-[10px] font-bold uppercase">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base font-black tracking-tighter ${item.status === 'win' ? 'text-bullish' : item.status === 'loss' ? 'text-bearish' : 'text-text-secondary'}`}>{item.profit}</p>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'win' ? 'text-bullish' : item.status === 'loss' ? 'text-bearish' : 'text-text-secondary'}`}>{item.p}</p>
                </div>
              </div>
              <div className="h-px w-full bg-white/5"></div>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase ${item.type === 'LONG' ? 'bg-primary/10 text-primary' : 'bg-bearish/10 text-bearish'}`}>
                  {item.type}
                </span>
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Chi tiết giao dịch <span className="material-symbols-outlined text-[12px] align-middle">chevron_right</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TradeJournal;
