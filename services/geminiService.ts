
// Removed Google Generative AI dependency to ensure 100% uptime and zero cost.
// Replaced with "Expert Logic" static analysis.

export interface AIAnalysisResult {
  action: "LONG" | "SHORT" | "SIT OUT";
  confidence: number;
  summary: string;
  trendStatus: string;
  liquidity: string;
  sentiment: string;
  riskLevel: string;
  entryZone?: string;
  stopLoss?: string;
  target?: string;
}

export interface GlobalMarketContext {
  btcTrend?: any;
  fearAndGreed?: { value: number; classification: string };
  macro?: string;
}

const analyzeMarket = (pair: string, context?: GlobalMarketContext): AIAnalysisResult => {
  // Safe defaults
  const btcTrend = context?.btcTrend?.trend_4h || 'NEUTRAL';
  const btcMomentum = context?.btcTrend?.momentum || 'NEUTRAL';
  const sentimentVal = context?.fearAndGreed?.value || 50;

  // 1. Determine Trend Status (BTC Context)
  let trendStatus = "Đi ngang (Sideway)";
  if (btcTrend === 'UP') trendStatus = "Tăng trưởng (Uptrend) 🟢";
  else if (btcTrend === 'DOWN') trendStatus = "Giảm giá (Downtrend) 🔴";

  // 2. Analyze Sentiment
  let marketSentiment = "Bình thường";
  if (sentimentVal > 75) marketSentiment = "Hưng phấn (Extreme Greed) 🥵";
  else if (sentimentVal < 25) marketSentiment = "Sợ hãi (Extreme Fear) 🥶";
  else if (sentimentVal > 55) marketSentiment = "Tham lam (Greed) 🤑";
  else if (sentimentVal < 45) marketSentiment = "Lo lắng (Fear) 😨";

  // 3. Risk Level Assessment
  let riskLevel = "Medium";
  if (btcTrend === 'DOWN' && sentimentVal < 20) riskLevel = "Very High (Bắt dao rơi)";
  else if (btcTrend === 'UP' && sentimentVal > 80) riskLevel = "High (Đu đỉnh)";
  else if (btcTrend === 'UP' && sentimentVal > 40 && sentimentVal < 70) riskLevel = "Low (An toàn)";

  // 4. Strategic Action Logic (The "Brain")
  let action: "LONG" | "SHORT" | "SIT OUT" = "SIT OUT";
  let confidence = 50;
  let summary = "Thị trường chưa rõ xu hướng. Nên quan sát thêm.";
  let entryZone = "Chờ tín hiệu";

  // Rule 1: Never Long in Downtrend
  if (btcTrend === 'DOWN') {
    action = "SIT OUT";
    confidence = 80;
    summary = "BTC đang xu hướng GIẢM. Tuyệt đối không bắt đáy Long lúc này. Bảo toàn vốn là ưu tiên hàng đầu.";
    if (btcMomentum === 'WEAK') {
      action = "SHORT"; // Only short if momentum is also weak
      confidence = 75;
      summary = "BTC giảm yếu ớt. Có thể canh hồi nhẹ để Short các Altcoin yếu hơn thị trường.";
      entryZone = "Canh hồi kháng cự";
    }
  }
  // Rule 2: Buy Dip in Uptrend
  else if (btcTrend === 'UP') {
    if (sentimentVal > 75) {
      action = "SIT OUT"; // Too hot
      confidence = 65;
      summary = "Thị trường đang quá hưng phấn (Greed). Rủi ro điều chỉnh cao. Không nên mua đuổi (FOMO).";
    } else {
      action = "LONG";
      confidence = 85;
      summary = "Xu hướng chính là TĂNG. Đây là thời điểm tốt để tìm các Altcoin có cấu trúc đẹp để Long (Mua).";
      entryZone = "Vùng hỗ trợ gần nhất";
    }
  }
  // Rule 3: Sideway
  else {
    action = "SIT OUT";
    confidence = 60;
    summary = "BTC đang đi ngang biên độ hẹp. Altcoin sẽ phân hóa. Chỉ đánh Scalp (lướt nhanh) volume nhỏ.";
  }

  return {
    action,
    confidence,
    summary,
    trendStatus,
    liquidity: "Trung bình",
    sentiment: marketSentiment,
    riskLevel,
    entryZone,
    stopLoss: "Theo cấu trúc sóng",
    target: "RR 1:2"
  };
};

export const getMarketAnalysis = async (pair: string, context?: GlobalMarketContext): Promise<AIAnalysisResult> => {
  // Simulate async delay for UX (feeling like AI is "thinking")
  await new Promise(resolve => setTimeout(resolve, 800));

  try {
    return analyzeMarket(pair, context);
  } catch (error) {
    console.error("Internal Analysis Error:", error);
    return {
      action: "SIT OUT",
      confidence: 0,
      summary: "Lỗi phân tích nội bộ. Vui lòng thử lại.",
      trendStatus: "N/A",
      liquidity: "N/A",
      sentiment: "N/A",
      riskLevel: "High"
    };
  }
};
