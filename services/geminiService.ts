
import { GoogleGenAI } from "@google/genai";
import { SendMessagePayload } from "../types";
import { SYSTEM_PROMPTS } from "../constants";

/**
 * Fallback service for direct Gemini calls if Cloud Functions are unavailable.
 * Note: For production, always route through Cloud Functions for security.
 */
export const getCoachResponse = async (payload: SendMessagePayload, userContextStr: string) => {
  // Use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = (SYSTEM_PROMPTS[payload.recipeId] || "You are a helpful and warm coach.") + 
    (userContextStr ? `\n\nAbout the user: ${userContextStr}` : "");

  // Convert history to Gemini format, ensuring we don't duplicate the last user message
  const chatHistory = payload.messageHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: chatHistory,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    // Directly access the .text property
    return response.text || "I'm sorry, I couldn't quite catch that. Could you say it again?";
  } catch (error) {
    console.error("Gemini SDK Fallback Error:", error);
    throw error;
  }
};
