
import React from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const GuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-surface border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-400">workspace_premium</span>
                        4 Nguyên Tắc Vàng
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto custom-scrollbar">
                    {/* Image */}
                    <div className="mb-6 rounded-xl overflow-hidden border border-white/20 shadow-lg relative group">
                        <img
                            src="./pro-rules.png"
                            alt="Trading Pro Rules"
                            className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                        <p className="absolute bottom-2 right-3 text-[10px] text-white/50 italic">Designed by AI Assistant</p>
                    </div>

                    <div className="space-y-4">
                        {/* Rule 1 */}
                        <div className="bg-surface p-4 rounded-xl border border-white/5 hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-black font-bold text-xs">1</div>
                                <h3 className="font-bold text-sm text-primary">Liếc nhìn BTC (Thiên Thời) 🔥</h3>
                            </div>
                            <p className="text-xs text-text-secondary pl-9">
                                Nếu BTC đang <span className="text-red-500 font-bold">Đỏ (Down)</span> mà App báo Mua -&gt; <strong>BỎ NGAY</strong>. Chỉ chơi khi BTC Xanh hoặc Đi ngang.
                            </p>
                        </div>

                        {/* Rule 2 */}
                        <div className="bg-surface p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-black font-bold text-xs">2</div>
                                <h3 className="font-bold text-sm text-blue-500">Soi 2 Chỉ số Pro (Địa Lợi) 🔍</h3>
                            </div>
                            <ul className="text-xs text-text-secondary pl-9 space-y-1">
                                <li>• <strong>OI Trend</strong>: Phải là <span className="text-bullish font-bold">Tăng 📈</span> (Tiền vào).</li>
                                <li>• <strong>Funding Rate</strong>: Xanh (Thấp/Âm) là Tốt. Đỏ (Cao) là Nguy hiểm.</li>
                            </ul>
                        </div>

                        {/* Rule 3 */}
                        <div className="bg-surface p-4 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-xs">3</div>
                                <h3 className="font-bold text-sm text-yellow-500">Đo khoảng cách (Vị thế) 📏</h3>
                            </div>
                            <p className="text-xs text-text-secondary pl-9">
                                Giá phải nằm trong <strong>Vùng Mua (Entry)</strong>. Nếu giá đã chạy quá xa -&gt; Bỏ, không FOMO.
                            </p>
                        </div>

                        {/* Rule 4 */}
                        <div className="bg-surface p-4 rounded-xl border border-white/5 hover:border-green-500/30 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-black font-bold text-xs">4</div>
                                <h3 className="font-bold text-sm text-green-500">Hành động (Kỷ luật thép) 🛡️</h3>
                            </div>
                            <ul className="text-xs text-text-secondary pl-9 space-y-1">
                                <li>• Vào lệnh Market/Limit.</li>
                                <li>• <strong className="text-red-400">Đặt Stoploss (7%) NGAY LẬP TỨC.</strong></li>
                                <li>• Tuân thủ chốt lời TP1, TP2.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:brightness-110 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-lg shadow-primary/25"
                    >
                        Đã hiểu, Tôi sẽ tuân thủ!
                    </button>
                </div>
            </div>
        </div >
    );
};

export default GuideModal;
