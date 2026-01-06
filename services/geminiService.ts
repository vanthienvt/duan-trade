
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn("⚠️ Gemini API Key is missing! AI features will not work.");
}
const ai = new GoogleGenAI({ apiKey });

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

export const getMarketAnalysis = async (pair: string, context?: GlobalMarketContext): Promise<AIAnalysisResult> => {
  try {
    const btcContext = context?.btcTrend ? `
    BTC Trend (The Map):
    - Price: ${context.btcTrend.price}
    - 4H Trend: ${context.btcTrend.trend_4h}
    - Momentum: ${context.btcTrend.momentum}
    - RSI: ${context.btcTrend.rsi_4h}
    ` : "BTC Context: Not available (assume Neutral)";

    const sentimentContext = context?.fearAndGreed ? `
    Market Sentiment:
    - Index: ${context.fearAndGreed.value} (${context.fearAndGreed.classification})
    ` : "Sentiment: Unknown";

    const prompt = `
    ROLE: You are an elite Crypto Spot Trader & Analyst. You focus on ACCUMULATION and HODL strategies.
    
    SYSTEM RULES (DO NOT BREAK):
    1. SPOT ONLY: You CANNOT Short. If the market is Bearish, your advice must be "SIT OUT" (keep USDT) or "SELL" (Exit).
    2. BTC is the King: 
       - BTC < EMA200 (4H) = Bearish Market -> Recommend SIT OUT/KEEP CASH.
       - BTC > EMA200 (4H) = Bullish Market -> Look for Dip Buy.
    3. Capital Preservation: 
       - "Cash is a position". Do not force buys in a downtrend.
    4. Execution: 
       - If market is unclear -> ACTION MUST BE "SIT OUT".
       - Focus on 'Buy the Dip' in uptrends.
    
    INPUT DATA:
    - Pair: ${pair}
    - ${btcContext}
    - ${sentimentContext}
    
    TASK:
    Analyze the above context and the specific pair.
    Determine the optimal strategy for the next 24 hours.
    
    OUTPUT JSON SCHEMA:
    {
      "action": "LONG" | "SHORT" | "SIT OUT",
      "confidence": number (0-100),
      "summary": "Concise executive summary (max 2 sentences) explaining WHY.",
      "trendStatus": "Bullish/Bearish/Neutral/Choppy",
      "liquidity": "Where is the liquidity? (e.g., 'Heatmap above 65k')",
      "sentiment": "Market psychology reading",
      "riskLevel": "Low/Medium/High/Extreme",
      "entryZone": "Sniper entry price range (optional)",
      "stopLoss": "Invalidation point (optional)",
      "target": "Take profit zone (optional)"
    }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-001",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ["LONG", "SHORT", "SIT OUT"] },
            confidence: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            trendStatus: { type: Type.STRING },
            liquidity: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
            entryZone: { type: Type.STRING },
            stopLoss: { type: Type.STRING },
            target: { type: Type.STRING }
          },
          required: ["action", "confidence", "summary", "trendStatus", "riskLevel"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response");

  } catch (error) {
    console.error("AI Analysis Error:", error);
    // Fallback safe mode
    return {
      action: "SIT OUT",
      confidence: 0,
      summary: `Hệ thống gặp lỗi kết nối AI: ${(error as any)?.message || 'Unknown error'}. Vui lòng kiểm tra API Key.`,
      trendStatus: "Unknown",
      liquidity: "Unknown",
      sentiment: "Neutral",
      riskLevel: "High"
    };
  }
};
