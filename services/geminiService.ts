
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn("⚠️ Gemini API Key is missing! AI features will not work.");
}

const genAI = new GoogleGenerativeAI(apiKey);

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
  // Add other context fields if needed
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
    
    Return pure JSON matching the schema.
    `;


    // List of models to try in order of preference
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];

    let lastError;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying AI model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                action: { type: SchemaType.STRING, enum: ["LONG", "SHORT", "SIT OUT"] },
                confidence: { type: SchemaType.NUMBER },
                summary: { type: SchemaType.STRING },
                trendStatus: { type: SchemaType.STRING },
                liquidity: { type: SchemaType.STRING },
                sentiment: { type: SchemaType.STRING },
                riskLevel: { type: SchemaType.STRING },
                entryZone: { type: SchemaType.STRING },
                stopLoss: { type: SchemaType.STRING },
                target: { type: SchemaType.STRING }
              },
              required: ["action", "confidence", "summary", "trendStatus", "riskLevel"]
            }
          }
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        if (responseText) {
          return JSON.parse(responseText);
        }
      } catch (error) {
        console.warn(`Model ${modelName} failed:`, error);
        lastError = error;
        // Continue to next model
      }
    }

    // If all models fail, throw the last error
    throw lastError || new Error("All models failed");

  } catch (error) {
    console.error("AI Analysis Error:", error);
    // Fallback safe mode
    return {
      action: "SIT OUT",
      confidence: 0,
      summary: `Hệ thống gặp lỗi kết nối AI (đã thử nhiều server): ${(error as any)?.message || 'Unknown error'}. Vui lòng kiểm tra API Key.`,
      trendStatus: "Unknown",
      liquidity: "Unknown",
      sentiment: "Neutral",
      riskLevel: "High"
    };
  }
};
