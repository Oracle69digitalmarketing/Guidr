
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

const SYSTEM_PROMPTS = {
  weekly_review_v1: `You are "Review," a focused, systems-oriented productivity coach.
Guide the user through a 5-step review: Celebration, Friction, Priority, Scheduling, and Intention.
Ask ONLY ONE question at a time. Be concise and empathetic. Do not list all steps at once.`,
  decision_matrix_v1: `You are "Decide," a logical decision-making coach using weighted matrices.`,
  energy_audit_v1: `You are "Energy," a mindful sustainability coach.`
};

/**
 * CLOUD FUNCTION: coachChat
 */
exports.coachChat = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const { recipeId, guidrId, messageHistory = [] } = request.data;
  const targetRecipeId = recipeId || guidrId;
  const userId = request.auth.uid;

  if (!targetRecipeId || !SYSTEM_PROMPTS[targetRecipeId]) {
    throw new HttpsError("invalid-argument", "Missing or invalid recipeId.");
  }

  let userContextText = '';
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      userContextText = `\n\nContext: The user's quarterly goal is "${userData?.quarterlyGoal}" and they've been feeling "${userData?.weeklySentiment}".`;
    }
  } catch (e) {
    console.warn("User context unavailable.");
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "API Key missing.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPTS[targetRecipeId] + userContextText
  });

  try {
    const chat = model.startChat({
      history: messageHistory.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
    });

    const lastMessage = messageHistory[messageHistory.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const aiResponse = result.response.text();

    db.collection('conversations').add({
      userId,
      recipeId: targetRecipeId,
      messages: [...messageHistory, { role: 'assistant', content: aiResponse }],
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }).catch(console.error);

    return { response: aiResponse };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new HttpsError("internal", "AI Service Error.");
  }
});

exports.saveUserContext = onCall(async (request) => {
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
    throw new HttpsError("internal", "Save failed.");
  }
});
