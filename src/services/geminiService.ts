
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SendMessagePayload } from "../types";
import { SYSTEM_PROMPTS } from "../constants";

/**
 * Fallback service for direct Gemini calls if Cloud Functions are unavailable.
 * Note: For production, always route through Cloud Functions for security.
 */
export const getCoachResponse = async (payload: SendMessagePayload, userContextStr: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("h h Key missing in environment.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const systemInstruction = (SYSTEM_PROMPTS[payload.recipeId] || "You are a helpful and warm coach.") +
    (userContextStr ? `\n\nAbout the user: ${userContextStr}` : "");

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction
  });

  try {
    const chat = model.startChat({
      history: payload.messageHistory.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
    });

    const lastMessage = payload.messageHistory[payload.messageHistory.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
  } catch (error) {
    console.error("Gemini SDK Fallback Error:", error);
    throw error;
  }
};
