
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { UserContext, Recipe } from './types';
import { getCoachResponse } from './services/geminiService';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "guidr-shipyard.firebaseapp.com",
  projectId: "guidr-shipyard",
  storageBucket: "guidr-shipyard.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Connectivity Check: Detect if user has provided real keys
export const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

let app: FirebaseApp | null = null;
if (isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } catch (e) {
    console.error("Firebase App initialization failed", e);
  }
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const functions = app ? getFunctions(app) : null;

/**
 * The unified communication bridge.
 * Checks for Cloud Functions first, then falls back to Local Gemini SDK.
 */
export const sendMessageToCoach = async (data: { 
  guidrId: string, 
  messageHistory: { role: string, content: string }[],
  isNewSession?: boolean 
}) => {
  // 1. Attempt Cloud Function (Production Mode)
  if (functions && isConfigured) {
    try {
      const coachChat = httpsCallable(functions, 'coachChat');
      return await coachChat({
        ...data,
        recipeId: data.guidrId,
        userId: auth?.currentUser?.uid || "mock-uid"
      });
    } catch (e: any) {
      console.warn("Backend Function call failed, utilizing local AI fallback.");
    }
  }

  // 2. Direct AI Fallback (Developer/Local Mode)
  // This ensures the app works immediately even without Firebase keys.
  const lastUserMessage = data.messageHistory.filter(m => m.role === 'user').pop()?.content || "";
  const contextStr = localStorage.getItem('user_context') || "";
  
  try {
    const responseText = await getCoachResponse({
      userId: auth?.currentUser?.uid || "local-user",
      recipeId: data.guidrId,
      messageText: lastUserMessage,
      messageHistory: data.messageHistory as any
    }, contextStr);

    return { data: { response: responseText } };
  } catch (err) {
    console.error("AI Fallback Error:", err);
    throw new Error("Connectivity lost. Please check your internet connection.");
  }
};

export const saveUserContext = async (context: UserContext) => {
  try {
    if (functions && isConfigured) {
      const saveFn = httpsCallable(functions, 'saveUserContext');
      const result = await saveFn(context);
      return (result.data as any).success;
    }
    // Default to local storage if Firebase is not yet ready
    localStorage.setItem('user_context', JSON.stringify(context));
    return true;
  } catch (error) {
    localStorage.setItem('user_context', JSON.stringify(context));
    return true; 
  }
};

export const getRecipes = async (): Promise<Recipe[]> => {
  return [
    {
      id: 'weekly_review_v1',
      name: 'The Weekly Review System',
      description: 'A structured 5-step chat to reflect on your week and plan the next with clarity.',
      icon: '📋',
      category: 'Productivity'
    },
    {
      id: 'decision_matrix_v1',
      name: 'The Decision Matrix',
      description: 'Make tough choices using a weighted criteria system and your core values.',
      icon: '⚖️',
      category: 'Decisions'
    },
    {
      id: 'energy_audit_v1',
      name: 'The Energy Audit',
      description: 'Audit your activities to boost your daily energy and reduce mental drain.',
      icon: '⚡',
      category: 'Mindset'
    }
  ];
};
