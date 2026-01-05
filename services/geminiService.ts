
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
    ROLE: You are an elite Crypto Hedge Fund Analyst running a strict 10-Part AI Trading System.
    
    SYSTEM RULES (DO NOT BREAK):
    1. BTC is the Map: If BTC trend is DOWN or CHOPPY, you CANNOT go Long on Alts. Rules: 
       - BTC < EMA200 (4H) = Bearish Bias.
       - BTC RSI > 70 = Risk of Reversal.
    2. Liquidity: Look for stop hunts. Price moves to liquidity.
    3. Sentiment: High Fear = Buy Dip opportunity? High Greed = Sell Top?
    4. Execution: 
       - If market is unclear -> ACTION MUST BE "SIT OUT".
       - No forcing trades. Preserving capital is #1.
    
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
      model: "gemini-2.0-flash-exp",
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
      summary: "Hệ thống AI đang bảo trì hoặc quá tải. Tạm thời đứng ngoài thị trường.",
      trendStatus: "Unknown",
      liquidity: "Unknown",
      sentiment: "Neutral",
      riskLevel: "High"
    };
  }
};
