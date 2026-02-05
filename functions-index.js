
/**
 * BACKEND CODE: Deploy this as a Firebase Cloud Function.
 * Filename: functions/index.js
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');
const { GoogleGenAI } = require("@google/genai");

admin.initializeApp();
const db = admin.firestore();

// THE COACH ENGINE PROMPT
const SYSTEM_PROMPTS = {
  weekly_review_v1: `You are a focused, systems-oriented productivity coach named "Review".
Your goal is to guide the user through a structured, reflective weekly review.
**CRITICAL RULES:**
1. Follow the 5-step framework: Celebration, Friction, Priority, Scheduling, Intention.
2. Ask ONLY the question for the current step.
3. Wait for the user's response. Acknowledge briefly, then move to the next question.`,
  decision_matrix_v1: `You are "Decide," a logical decision-making coach.`,
  energy_audit_v1: `You are "Energy," a mindful sustainability coach.`
};

exports.coachChat = onCall(async (request) => {
  // 1. Authentication check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be logged in.');
  }

  const { guidrId, recipeId, messageHistory = [] } = request.data;
  const targetId = guidrId || recipeId;
  const userId = request.auth.uid;

  // 2. Fetch User Context
  let userContextText = '';
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const { quarterlyGoal, weeklySentiment } = userDoc.data();
      userContextText = `\n\nAbout the user: Their quarterly goal is "${quarterlyGoal}". Last week they felt "${weeklySentiment}".`;
    }
  } catch (e) {
    console.log('Could not fetch context', e);
  }

  // 3. Initialize Gemini
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: messageHistory.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: (SYSTEM_PROMPTS[targetId] || "You are a helpful coach.") + userContextText
      }
    });

    const aiResponse = response.text || "I'm sorry, I couldn't quite catch that. Could you say it again?";

    // 4. Save to history
    await db.collection('conversations').add({
      userId,
      guidrId: targetId,
      messages: [...messageHistory, { role: 'assistant', content: aiResponse }],
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { response: aiResponse };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new HttpsError('internal', 'Failed to get a response.');
  }
});
