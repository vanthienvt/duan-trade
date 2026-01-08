
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
                        <span className="material-symbols-outlined text-primary">school</span>
                        Quy Trình 4 Bước Chuẩn
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
                    <p className="text-text-secondary text-sm mb-4">
                        Khi gặp kèo uy tín <strong>95%</strong>, hãy làm đúng 4 bước này để tối ưu lợi nhuận:
                    </p>

                    <div className="space-y-4">
                        {/* Step 1 */}
                        <div className="relative pl-4 border-l-2 border-primary">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-black border-2 border-surface">1</div>
                            <h3 className="font-bold text-sm text-primary mb-1">Liếc nhìn BTC (Thiên Thời) 🔥</h3>
                            <p className="text-xs text-text-secondary">
                                Nếu BTC đang <span className="text-red-500 font-bold">Đỏ (Down)</span> mà App báo Mua -&gt; <strong>BỎ NGAY</strong>. Chỉ chơi khi BTC Xanh hoặc Đi ngang.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative pl-4 border-l-2 border-blue-500">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] font-bold text-black border-2 border-surface">2</div>
                            <h3 className="font-bold text-sm text-blue-500 mb-1">Soi 2 Chỉ số Pro (Địa Lợi) 🔍</h3>
                            <ul className="text-xs text-text-secondary space-y-1">
                                <li>• <strong>OI Trend</strong>: Phải là <span className="text-bullish font-bold">Tăng 📈</span> hoặc mũi tên xanh (Tiền vào).</li>
                                <li>• <strong>Funding Rate</strong>:
                                    <ul className="pl-3 mt-0.5 space-y-0.5 border-l border-white/10 ml-1">
                                        <li>- Màu <span className="text-bullish font-bold">Xanh (Tốt)</span>: Thấp/Âm (An toàn để Long).</li>
                                        <li>- Màu <span className="text-bearish font-bold">Đỏ (Cao)</span>: &gt;0.04% (Đông người đu, dễ sập).</li>
                                    </ul>
                                </li>
                            </ul>
                        </div>

                        {/* Step 3 */}
                        <div className="relative pl-4 border-l-2 border-yellow-500">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[8px] font-bold text-black border-2 border-surface">3</div>
                            <h3 className="font-bold text-sm text-yellow-500 mb-1">Đo khoảng cách (Vị thế) 📏</h3>
                            <p className="text-xs text-text-secondary">
                                Giá hiện tại phải nằm trong <strong>Vùng Mua (Entry)</strong>. Nếu giá đã chạy quá xa -&gt; Bỏ, không FOMO mua đuổi.
                            </p>
                        </div>

                        {/* Step 4 */}
                        <div className="relative pl-4 border-l-2 border-green-500">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[8px] font-bold text-black border-2 border-surface">4</div>
                            <h3 className="font-bold text-sm text-green-500 mb-1">Hành động (Kỷ luật thép) 🛡️</h3>
                            <ul className="text-xs text-text-secondary space-y-1">
                                <li>• Vào lệnh (Market).</li>
                                <li>• <strong className="text-red-400">Đặt Stoploss NGAY LẬP TỨC.</strong></li>
                                <li>• Đặt sẵn TP1 chốt 50% bỏ túi.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 p-3 bg-white/5 rounded-lg border border-dashed border-white/10">
                        <p className="text-[10px] text-center italic opacity-70">
                            "Thà bỏ lỡ một cơ hội (mất 0 đồng) còn hơn vào sai một lệnh (mất tiền)."
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full h-10 rounded-xl bg-surface hover:bg-white/5 border border-white/10 font-bold text-sm transition-all"
                    >
                        Đã hiểu, đóng lại
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuideModal;
