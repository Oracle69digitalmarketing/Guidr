
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from 'openai'; // Add this line
import { SendMessagePayload } from "../types";
import { db } from "../firebase"; // Import db from firebase.ts

const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'gemini'; // 'gemini' or 'openai'
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";


const getPromptFromFirestore = async (promptId: string) => {
  try {
    const promptDoc = await db.collection('prompts').doc(promptId).get();
    if (promptDoc.exists) {
      return promptDoc.data()?.content;
    }
  } catch (error) {
    console.error("Error fetching prompt from Firestore:", error);
  }
  return null;
};

const getOpenAICoachResponse = async (payload: SendMessagePayload, systemInstruction: string) => {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API Key missing in environment.");
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true });
  const messages: any[] = [
    { role: "system", content: systemInstruction }
  ];

  for (const msg of payload.messageHistory) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  }

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
    });
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI SDK Fallback Error:", error);
    throw error;
  }
};

/**
 * Fallback service for direct Gemini calls if Cloud Functions are unavailable.
 * Note: For production, always route through Cloud Functions for security.
 */
export const getCoachResponse = async (payload: SendMessagePayload, userContextStr: string) => {
  let systemInstruction = "You are a helpful and warm coach."; // Default system instruction
  const firestorePrompt = await getPromptFromFirestore(payload.recipeId);
  if (firestorePrompt) {
    systemInstruction = firestorePrompt;
  }

  systemInstruction = (systemInstruction) +
    (userContextStr ? `\n\nAbout the user: ${userContextStr}` : "");

  if (AI_PROVIDER === 'openai') {
    return getOpenAICoachResponse(payload, systemInstruction);
  } else {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    if (!apiKey) {
      throw new Error("Gemini API Key missing in environment.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

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
  }
};
