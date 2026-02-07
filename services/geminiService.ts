
import { GoogleGenAI } from "@google/genai";
import { SendMessagePayload } from "../types";
import { SYSTEM_PROMPTS } from "../constants";

/**
 * Fallback service for direct Gemini calls if Cloud Functions are unavailable.
 * Note: For production, always route through Cloud Functions for security.
 */
export const getCoachResponse = async (payload: SendMessagePayload, userContextStr: string) => {
  // Use process.env.GEMINI_API_KEY or API_KEY which are defined in vite.config.ts
  const apiKey = (process.env as any).GEMINI_API_KEY || (process.env as any).API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = (SYSTEM_PROMPTS[payload.recipeId] || "You are a helpful and warm coach.") + 
    (userContextStr ? `\n\nAbout the user: ${userContextStr}` : "");

  // Convert history to Gemini format
  const chatHistory = payload.messageHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: chatHistory,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "I was unable to generate a response. Please try again.";
  } catch (error) {
    console.error("Gemini SDK Fallback Error:", error);
    throw error;
  }
};
