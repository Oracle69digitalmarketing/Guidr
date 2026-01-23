
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

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
 * High-performance coaching logic with Gemini 3 Flash.
 */
export const coachChat = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }

  const recipeId = data.recipeId || data.guidrId;
  const messageHistory = data.messageHistory || [];
  const userId = context.auth.uid;

  if (!recipeId || !SYSTEM_PROMPTS[recipeId]) {
    throw new functions.https.HttpsError("invalid-argument", "Missing or invalid recipeId.");
  }

  // Fetch Context
  let userContextText = '';
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const { quarterlyGoal, weeklySentiment } = userDoc.data() || {};
      userContextText = `\n\nContext: The user's quarterly goal is "${quarterlyGoal}" and they've been feeling "${weeklySentiment}".`;
    }
  } catch (e) {
    console.warn("User context unavailable for current request.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const systemInstruction = SYSTEM_PROMPTS[recipeId] + userContextText;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: messageHistory.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      config: { 
        systemInstruction,
        temperature: 0.7 
      }
    });

    const aiResponse = response.text || "I apologize, I'm processing your request. Please continue.";

    // Async history logging (doesn't block response)
    db.collection('conversations').add({
      userId,
      recipeId,
      messages: [...messageHistory, { role: 'assistant', content: aiResponse }],
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }).catch(console.error);

    return { response: aiResponse };
  } catch (error) {
    console.error("Gemini Execution Error:", error);
    throw new functions.https.HttpsError("internal", "AI Service currently unavailable.");
  }
});

/**
 * CLOUD FUNCTION: saveUserContext
 */
export const saveUserContext = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Unauthorized.");
  
  const { quarterlyGoal, weeklySentiment } = data;
  
  try {
    await db.collection("users").doc(context.auth.uid).set({
      quarterlyGoal,
      weeklySentiment,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true };
  } catch (e) {
    console.error("Firestore persistence failure:", e);
    throw new functions.https.HttpsError("internal", "Failed to save context.");
  }
});
