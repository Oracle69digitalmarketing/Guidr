
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

admin.initializeApp();
const db = admin.firestore();

const SYSTEM_PROMPTS: Record<string, string> = {
  weekly_review_v1: `You are "Review," a focused, systems-oriented productivity coach.
Guide the user through a 5-step review: Celebration, Friction, Priority, Scheduling, and Intention.
Ask ONLY ONE question at a time. Be concise and empathetic. Do not list all steps at once.`,
  decision_matrix_v1: `You are "Decide," a logical decision-making coach using weighted matrices.`,
  energy_audit_v1: `You are "Energy," a mindful sustainability coach.`
};

/**
 * CLOUD FUNCTION: coachChat
 * High-performance coaching logic with Gemini 1.5 Flash.
 */
export const coachChat = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const { recipeId, guidrId, messageHistory = [] } = request.data;
  const targetRecipeId = recipeId || guidrId;
  const userId = request.auth.uid;

  if (!targetRecipeId || !SYSTEM_PROMPTS[targetRecipeId]) {
    throw new HttpsError("invalid-argument", "Missing or invalid recipeId.");
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

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "AI API key not configured on server.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPTS[targetRecipeId] + userContextText
  });

  try {
    // Convert messageHistory to Google Generative AI format
    const chat = model.startChat({
      history: messageHistory.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
    });

    const lastMessage = messageHistory[messageHistory.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const aiResponse = result.response.text();

    // Async history logging (doesn't block response)
    db.collection('conversations').add({
      userId,
      recipeId: targetRecipeId,
      messages: [...messageHistory, { role: 'assistant', content: aiResponse }],
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }).catch(console.error);

    return { response: aiResponse };
  } catch (error) {
    console.error("Gemini Execution Error:", error);
    throw new HttpsError("internal", "AI Service currently unavailable.");
  }
});

/**
 * CLOUD FUNCTION: saveUserContext
 */
export const saveUserContext = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Unauthorized.");
  
  const { quarterlyGoal, weeklySentiment } = request.data;
  
  try {
    await db.collection("users").doc(request.auth.uid).set({
      quarterlyGoal,
      weeklySentiment,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true };
  } catch (e) {
    console.error("Firestore persistence failure:", e);
    throw new HttpsError("internal", "Failed to save context.");
  }
});
