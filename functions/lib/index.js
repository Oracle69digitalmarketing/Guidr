"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUserContext = exports.coachChat = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const generative_ai_1 = require("@google/generative-ai");
const openai_1 = require("openai");
admin.initializeApp();
const db = admin.firestore();
const getPromptFromFirestore = async (promptId) => {
    const promptDoc = await db.collection('prompts').doc(promptId).get();
    if (!promptDoc.exists) {
        return null;
    }
    return promptDoc.data()?.content;
};
const getOpenAICoachResponse = async (payload, systemInstruction, openaiApiKey) => {
    if (!openaiApiKey) {
        throw new functions.https.HttpsError("failed-precondition", "OpenAI API key not configured on server.");
    }
    const openai = new openai_1.default({ apiKey: openaiApiKey });
    const messages = [
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
    }
    catch (error) {
        console.error("OpenAI SDK Cloud Function Error:", error);
        throw new functions.https.HttpsError("internal", "OpenAI Service currently unavailable.");
    }
};
exports.coachChat = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }
    const { recipeId, guidrId, messageHistory = [] } = data;
    const targetRecipeId = recipeId || guidrId;
    const userId = context.auth.uid;
    if (!targetRecipeId) {
        throw new functions.https.HttpsError("invalid-argument", "Missing recipeId.");
    }
    const systemInstructionFromFirestore = await getPromptFromFirestore(targetRecipeId);
    if (!systemInstructionFromFirestore) {
        throw new functions.https.HttpsError("not-found", `System instruction for recipeId: ${targetRecipeId} not found.`);
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
    const combinedSystemInstruction = systemInstructionFromFirestore + userContextText;
    const AI_PROVIDER = functions.config().ai?.provider || 'gemini';
    const OPENAI_API_KEY = functions.config().openai?.api_key || "";
    let aiResponse = null;
    if (AI_PROVIDER === 'openai') {
        aiResponse = await getOpenAICoachResponse(data, combinedSystemInstruction, OPENAI_API_KEY);
    }
    else {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
        if (!apiKey) {
            throw new functions.https.HttpsError("failed-precondition", "Gemini AI API key not configured on server.");
        }
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: combinedSystemInstruction
        });
        try {
            const geminiHistory = [];
            let expectedRole = 'user';
            for (const msg of messageHistory.slice(0, -1)) {
                const role = msg.role === 'user' ? 'user' : 'model';
                if (role === expectedRole) {
                    geminiHistory.push({
                        role: role,
                        parts: [{ text: msg.content }]
                    });
                    expectedRole = role === 'user' ? 'model' : 'user';
                }
            }
            if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role === 'user') {
                geminiHistory.pop();
            }
            const chat = model.startChat({
                history: geminiHistory,
            });
            const lastMessage = messageHistory[messageHistory.length - 1];
            const result = await chat.sendMessage(lastMessage.content);
            aiResponse = result.response.text();
        }
        catch (error) {
            console.error("Gemini Execution Error:", error);
            throw new functions.https.HttpsError("internal", "AI Service currently unavailable.");
        }
    }
    db.collection('conversations').add({
        userId,
        recipeId: targetRecipeId,
        messages: [...messageHistory, { role: 'assistant', content: aiResponse }],
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    }).catch(console.error);
    return { response: aiResponse };
});
exports.saveUserContext = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "Unauthorized.");
    const { quarterlyGoal, weeklySentiment } = data;
    try {
        await db.collection("users").doc(context.auth.uid).set({
            quarterlyGoal,
            weeklySentiment,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return { success: true };
    }
    catch (e) {
        console.error("Firestore persistence failure:", e);
        throw new functions.https.HttpsError("internal", "Failed to save context.");
    }
});
//# sourceMappingURL=index.js.map