
import * as functions from "firebase-functions";

import * as admin from "firebase-admin";
import {GoogleGenerativeAI} from "@google/generative-ai";
import OpenAI from 'openai';

admin.initializeApp();
const db = admin.firestore();

const getPromptFromFirestore = async (promptId: string) => {
  const promptDoc = await db.collection('prompts').doc(promptId).get();
  if (!promptDoc.exists) {
    return null;
  }
  return promptDoc.data()?.content;
};

const getOpenAICoachResponse = async (payload: any, systemInstruction: string, openaiApiKey: string) => {
  if (!openaiApiKey) {
    throw new functions.https.HttpsError("failed-precondition", "OpenAI API key not configured on server.");
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });
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
      model: "gpt-3.5-turbo", // or "gpt-4"
      messages: messages,
    });
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI SDK Cloud Function Error:", error);
    throw new functions.https.HttpsError("internal", "OpenAI Service currently unavailable.");
  }
};

/**
 * CLOUD FUNCTION: coachChat
 * High-performance coaching logic with Gemini 1.5 Flash.
 */
export const coachChat = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }

    const {recipeId, guidrId, messageHistory = []} = data;
  const targetRecipeId = recipeId || guidrId;
  const userId = context.auth.uid;

  if (!targetRecipeId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing recipeId.");
  }

  const systemInstructionFromFirestore = await getPromptFromFirestore(targetRecipeId);

  if (!systemInstructionFromFirestore) {
    throw new functions.https.HttpsError("not-found", `System instruction for recipeId: ${targetRecipeId} not found.`);
  }

  // Fetch Context
  let userContextText = '';
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const quarterlyGoal = userData?.quarterlyGoal;
      const weeklySentiment = userData?.weeklySentiment;
      userContextText = `\n\nContext: The user's quarterly goal is "${quarterlyGoal}" and they've been feeling "${weeklySentiment}".`;
    }
  } catch (e) {
    console.warn("User context unavailable for current request.");
  }

  const combinedSystemInstruction = systemInstructionFromFirestore + userContextText;

  const AI_PROVIDER = functions.config().ai?.provider || 'gemini';
  const OPENAI_API_KEY = functions.config().openai?.api_key || "";

  let aiResponse: string | null = null;

  if (AI_PROVIDER === 'openai') {
    aiResponse = await getOpenAICoachResponse(data, combinedSystemInstruction, OPENAI_API_KEY);
  } else {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    if (!apiKey) {
      throw new functions.https.HttpsError("failed-precondition", "Gemini AI API key not configured on server.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: combinedSystemInstruction
    });

    try {
      // Gemini requires the history to:
      // 1. Start with a 'user' message.
      // 2. Alternate between 'user' and 'model'.
      // 3. End with a 'model' message before we send the next 'user' message.
      const geminiHistory: any[] = [];
      let expectedRole = 'user';

      // We iterate through all messages EXCEPT the last one (which we will send via sendMessage)
      for (const msg of messageHistory.slice(0, -1)) {
        const role = msg.role === 'user' ? 'user' : 'model';
        if (role === expectedRole) {
          geminiHistory.push({
            role: role,
            parts: [{text: msg.content}]
          });
          expectedRole = role === 'user' ? 'model' : 'user';
        }
      }

      // Ensure history ends with a 'model' message so the next sendMessage('user') is valid.
      if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role === 'user') {
        geminiHistory.pop();
      }

      // Convert messageHistory to Google Generative AI format
      const chat = model.startChat({
        history: geminiHistory,
      });

      const lastMessage = messageHistory[messageHistory.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      aiResponse = result.response.text();
    } catch (error) {
      console.error("Gemini Execution Error:", error);
      throw new functions.https.HttpsError("internal", "AI Service currently unavailable.");
    }
  }

  // Async history logging (doesn't block response)
  db.collection('conversations').add({
    userId,
    recipeId: targetRecipeId,
    messages: [...messageHistory, {role: 'assistant', content: aiResponse}],
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  }).catch(console.error);

  return {response: aiResponse};
});

/**
 * CLOUD FUNCTION: saveUserContext
 */
export const saveUserContext = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Unauthorized.");

  const {quarterlyGoal, weeklySentiment} = data;

  try {
    await db.collection("users").doc(context.auth.uid).set({
      quarterlyGoal,
      weeklySentiment,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, {merge: true});

    return {success: true};
  } catch (e) {
    console.error("Firestore persistence failure:", e);
    throw new functions.https.HttpsError("internal", "Failed to save context.");
  }
});
