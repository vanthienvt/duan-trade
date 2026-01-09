
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
                        Hướng Dẫn & Nguyên Tắc
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
                    {/* Pro Rules Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-yellow-400">workspace_premium</span>
                            <h2 className="text-lg font-bold text-yellow-400 uppercase tracking-wider">Nguyên Tắc Vàng (Pro Rules)</h2>
                        </div>

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
                            <div className="bg-surface p-4 rounded-xl border border-white/5 hover:border-primary/30 transition-colors">
                                <h3 className="font-bold text-sm text-blue-400 mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">filter_3</span>
                                    Chất lượng hơn Số lượng
                                </h3>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    <span className="text-white font-bold block mb-1">Tối đa 3 - 5 lệnh/ngày.</span>
                                    Chỉ vào lệnh khi có tín hiệu "Điểm 10" (Uy tín &gt; 90%, Trend Tăng). Đừng cố đánh nhiều để rồi mất vốn vào những lệnh không rõ ràng.
                                </p>
                            </div>

                            <div className="bg-surface p-4 rounded-xl border border-white/5 hover:border-warning/30 transition-colors">
                                <h3 className="font-bold text-sm text-warning mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">bedtime</span>
                                    Lệnh qua đêm (Overnight)
                                </h3>
                                <div className="text-xs text-text-secondary space-y-2">
                                    <p><strong className="text-white">Day Trade:</strong> HỦY LỆNH trước khi ngủ. Đừng để rủi ro biến động đêm làm mất giấc ngủ ngon.</p>
                                    <p><strong className="text-white">Swing:</strong> Chỉ giữ khi BTC Trend còn Tốt và vị thế đang có lãi/an toàn.</p>
                                </div>
                            </div>
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
