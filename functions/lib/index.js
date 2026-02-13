"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUserContext = exports.coachChat = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const generative_ai_1 = require("@google/generative-ai");
admin.initializeApp();
const db = admin.firestore();
const SYSTEM_PROMPTS = {
    weekly_review_v1: `You are "Review," a focused, systems-oriented productivity coach.
Guide the user through a 5-step review: Celebration, Friction, Priority, Scheduling, and Intention.
Ask ONLY ONE question at a time. Be concise and empathetic. Do not list all steps at once.`,
    decision_matrix_v1: `You are "Decide," a logical decision-making coach using weighted matrices.`,
    energy_audit_v1: `You are "Energy," a mindful sustainability coach.`
};
exports.coachChat = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    }
    const { recipeId, guidrId, messageHistory = [] } = request.data;
    const targetRecipeId = recipeId || guidrId;
    const userId = request.auth.uid;
    if (!targetRecipeId || !SYSTEM_PROMPTS[targetRecipeId]) {
        throw new https_1.HttpsError("invalid-argument", "Missing or invalid recipeId.");
    }
    let userContextText = '';
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const quarterlyGoal = userData?.quarterlyGoal;
            const weeklySentiment = userData?.weeklySentiment;
            userContextText = `\n\nContext: The user's quarterly goal is "${quarterlyGoal}" and they've been feeling "${weeklySentiment}".`;
        }
    }
    catch (e) {
        console.warn("User context unavailable for current request.");
    }
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    if (!apiKey) {
        throw new https_1.HttpsError("failed-precondition", "AI API key not configured on server.");
    }
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_PROMPTS[targetRecipeId] + userContextText
    });
    try {
        const history = messageHistory.slice(0, -1);
        const firstUserIndex = history.findIndex((m) => m.role === 'user');
        const geminiHistory = (firstUserIndex === -1 ? [] : history.slice(firstUserIndex)).map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));
        const chat = model.startChat({
            history: geminiHistory,
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
    }
    catch (error) {
        console.error("Gemini Execution Error:", error);
        throw new https_1.HttpsError("internal", "AI Service currently unavailable.");
    }
});
exports.saveUserContext = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Unauthorized.");
    const { quarterlyGoal, weeklySentiment } = request.data;
    try {
        await db.collection("users").doc(request.auth.uid).set({
            quarterlyGoal,
            weeklySentiment,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return { success: true };
    }
    catch (e) {
        console.error("Firestore persistence failure:", e);
        throw new https_1.HttpsError("internal", "Failed to save context.");
    }
});
//# sourceMappingURL=index.js.map