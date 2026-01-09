
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

export interface LocalCoinData {
  symbol: string;
  price: number;
  change24h: number;
  rsi: number;
  ma20?: number;
  ma50?: number;
}

const analyzeMarket = (coin: LocalCoinData, context?: GlobalMarketContext): AIAnalysisResult => {
  // Safe defaults from Context
  const btcTrend = context?.btcTrend?.trend_4h || 'NEUTRAL';
  const btcMomentum = context?.btcTrend?.momentum || 'NEUTRAL';
  const sentimentVal = context?.fearAndGreed?.value || 50;

  // Local Data Evaluation (Fallback if BTC context is weak/missing)
  const isCoinBullish = coin.change24h > 0 && coin.rsi > 50;
  const isCoinBearish = coin.change24h < 0 && coin.rsi < 50;

  // 1. Determine Trend Status
  let trendStatus = "Đi ngang (Sideway)";
  if (btcTrend === 'UP') trendStatus = "Tăng trưởng (Uptrend) 🟢";
  else if (btcTrend === 'DOWN') trendStatus = "Giảm giá (Downtrend) 🔴";
  else {
    // Fallback to local coin trend if BTC is Neutral/Unknown
    if (isCoinBullish) trendStatus = "Tích cực (Positive) 🌤️";
    else if (isCoinBearish) trendStatus = "Tiêu cực (Negative) 🌧️";
  }

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
  else if (Math.abs(coin.change24h) > 10) riskLevel = "High (Biến động mạnh)";
  else if (btcTrend === 'UP' && sentimentVal > 40 && sentimentVal < 70) riskLevel = "Low (An toàn)";

  // VOLUME ANALYSIS (New Feature)
  // If Volume is exceptionally high (> 2x normal) but price is stuck -> Distribution (BAD)
  // If Volume is high + Price Up -> Strong Momentum (GOOD)
  // Since we only have raw 24h volume without average, we use basic correlation:
  const isHighVolume = true; // Placeholder until we have volAvg. For now assume volume confirms trend if price moves significantly.

  // 4. Strategic Action Logic (The "Brain")
  let action: "LONG" | "SHORT" | "SIT OUT" = "SIT OUT";
  let confidence = 50;
  let summary = "Thị trường chưa rõ xu hướng. Nên quan sát thêm.";
  let entryZone = "Chờ tín hiệu";
  let target = "RR 1:2"; // Default target

  // Rule 1: Never Long in Downtrend (unless coin is exceptionallly strong independent mover)
  if (btcTrend === 'DOWN') {
    action = "SIT OUT";
    confidence = 80;
    summary = "BTC đang xu hướng GIẢM. Tuyệt đối không bắt đáy Long lúc này. Bảo toàn vốn là ưu tiên hàng đầu.";
    if (btcMomentum === 'WEAK' || isCoinBearish) {
      action = "SHORT"; // Only short if momentum is also weak
      confidence = 75;
      summary = "BTC giảm yếu ớt. Có thể canh hồi nhẹ để Short các Altcoin yếu hơn thị trường.";
      entryZone = "Canh hồi kháng cự";
    }
  }
  // Rule 2: Buy Dip in Uptrend
  else if (btcTrend === 'UP') {
    if (sentimentVal > 75) {
      // Market is Euphoric -> High chance of correction -> SHORT OP?
      if (coin.rsi > 70) {
        action = "SHORT";
        confidence = 65;
        summary = "Đà tăng quá nóng (RSI > 70). Cảnh báo điều chỉnh giảm. Có thể Short lướt sóng (Scalp).";
        entryZone = "Kháng cự tâm lý";
        target = "RR 1:1.5";
      } else {
        action = "SIT OUT"; // Too hot but not clear short
        confidence = 60;
        summary = "Thị trường hưng phấn nhưng chưa có điểm vào an toàn. Không mua đuổi.";
      }
    } else if (coin.rsi > 70) {
      // Local coin overbought despite market ok
      action = "SHORT";
      confidence = 60;
      summary = "Coin này đã tăng nóng cục bộ (RSI cao). Có thể canh Short ngắn ăn sóng hồi.";
      entryZone = "Đỉnh cũ gần nhất";
      target = "RR 1:1.5";
    } else {
      action = "LONG";
      confidence = 85;
      summary = `Xu hướng chính là TĂNG. ${coin.rsi < 40 ? 'RSI đang thấp, cơ hội gom hàng.' : 'Tìm điểm vào lệnh hợp lý.'}`;
      entryZone = "Vùng hỗ trợ gần nhất";
    }
  }
  // Rule 3: Sideway / Neutral / Fallback
  else {
    if (isCoinBullish && coin.rsi < 70) {
      // Coin is moving up while BTC sleeps
      action = "LONG";
      confidence = 60;
      summary = "BTC đi ngang nhưng Altcoin này đang có lực mua tốt. Có thể lướt sóng ngắn (Scalp).";
      entryZone = "Test lại hỗ trợ ngắn hạn";
    }
    else if (isCoinBearish && coin.rsi > 30) {
      // Coin is weak while BTC sleeps (and not yet Oversold)
      action = "SHORT";
      confidence = 60;
      summary = "BTC đi ngang nhưng cấu trúc coin này đang xấu. Canh hồi nhẹ để Short lướt sóng.";
      entryZone = "Kháng cự cục bộ (Local Resistance)";
      target = "RR 1:1.5 (Ngắn hạn)";
    }
    else {
      action = "SIT OUT";
      confidence = 60;
      summary = "BTC đang đi ngang biên độ hẹp. Altcoin chưa có sóng rõ ràng. Nên đứng ngoài.";
    }
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
    target
  };
};

// Updated signature to accept local coin data
export const getMarketAnalysis = async (pair: string, coinData: LocalCoinData, context?: GlobalMarketContext): Promise<AIAnalysisResult> => {
  // Simulate async delay for UX (feeling like AI is "thinking")
  await new Promise(resolve => setTimeout(resolve, 600)); // Faster response

  try {
    return analyzeMarket(coinData, context);
  } catch (error) {
    console.error("Internal Analysis Error:", error);
    return {
      action: "SIT OUT",
      confidence: 0,
      summary: "Lỗi phân tích nội bộ. Vui lòng thử lại.",
      trendStatus: "Chưa rõ",
      liquidity: "Chưa rõ",
      sentiment: "Trung lập",
      riskLevel: "High"
    };
  }
};
