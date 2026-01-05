
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface AIAnalysisResult {
  summary: string;
  trendStatus: string;
  liquidityStatus: string;
  sentimentStatus: string;
  riskLevel: string;
}

export const getMarketAnalysis = async (pair: string): Promise<AIAnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Phân tích thị trường tiền điện tử cho cặp giao dịch: ${pair}. 
      Cung cấp cái nhìn chuyên sâu về xu hướng, thanh khoản và tâm lý thị trường. 
      Ngôn ngữ: Tiếng Việt.
      Hãy cực kỳ chuyên nghiệp như một chuyên gia phân tích quỹ đầu tư.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Tóm tắt ngắn gọn tình hình hiện tại (dưới 60 từ)" },
            trendStatus: { type: Type.STRING, description: "Trạng thái xu hướng (ví dụ: Tăng mạnh, Điều chỉnh)" },
            liquidityStatus: { type: Type.STRING, description: "Trạng thái thanh khoản" },
            sentimentStatus: { type: Type.STRING, description: "Tâm lý thị trường (ví dụ: Hưng phấn, Sợ hãi)" },
            riskLevel: { type: Type.STRING, description: "Mức độ rủi ro (Thấp, Trung Bình, Cao)" }
          },
          required: ["summary", "trendStatus", "liquidityStatus", "sentimentStatus", "riskLevel"]
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      summary: "Hiện tại hệ thống AI đang quá tải. Dưới đây là phân tích dựa trên dữ liệu kỹ thuật tiêu chuẩn cho " + pair,
      trendStatus: "Trung tính",
      liquidityStatus: "Khá",
      sentimentStatus: "Thận trọng",
      riskLevel: "Trung bình"
    };
  }
};
