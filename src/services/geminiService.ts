
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
    // Gemini requires the history to:
    // 1. Start with a 'user' message.
    // 2. Alternate between 'user' and 'model'.
    // 3. End with a 'model' message before we send the next 'user' message.
    const geminiHistory: any[] = [];
    let expectedRole = 'user';

    // We iterate through all messages EXCEPT the last one (which we will send via sendMessage)
    for (const msg of payload.messageHistory.slice(0, -1)) {
      const role = msg.role === 'user' ? 'user' : 'model';
      if (role === expectedRole) {
        geminiHistory.push({
          role: role,
          parts: [{ text: msg.content }]
        });
        expectedRole = role === 'user' ? 'model' : 'user';
      }
    }

    // Ensure history ends with a 'model' message so the next sendMessage('user') is valid.
    if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role === 'user') {
      geminiHistory.pop();
    }

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
