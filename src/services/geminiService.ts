
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
    throw new Error("Gemini API Key missing in environment.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const systemInstruction = (SYSTEM_PROMPTS[payload.recipeId] || "You are a helpful and warm coach.") +
    (userContextStr ? `\n\nAbout the user: ${userContextStr}` : "");

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction
  });

  try {
    // Gemini requires the first message in history to be from 'user'.
    // We skip any initial assistant messages (like the greeting).
    const history = payload.messageHistory.slice(0, -1);
    const firstUserIndex = history.findIndex(m => m.role === 'user');

    const geminiHistory = (firstUserIndex === -1 ? [] : history.slice(firstUserIndex)).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: geminiHistory,
    });

    const lastMessage = payload.messageHistory[payload.messageHistory.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
  } catch (error) {
    console.error("Gemini SDK Fallback Error:", error);
    throw error;
  }
};
