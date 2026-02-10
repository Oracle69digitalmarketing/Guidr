# Oracle69 | Your AI-Powered Personal Growth Companion

**Live Demo:** [https://guidr-sooty.vercel.app](https://guidr-sooty.vercel.app)

Oracle69 is a high-performance personal coaching application designed to help you find clarity, reflect on your progress, and optimize your daily life. Built with React 19, Vite, and powered by Google's Gemini 1.5 Flash, Oracle69 provides a seamless, intelligent coaching experience across web and mobile.

## 🎯 Project Story

Oracle69 was conceived and built for the **RevenueCat Shipyard: Creator Contest**, specifically for creator **Simon (Better Creating)**. Inspired by his brief for a "minimalist AI coaching app," we set out to solve the core problem his audience faces: the gap between inspiration and systematic action. Rather than building another open-ended chatbot, we created **Oracle69**—a platform that productizes coaching methodologies into structured, step-by-step "Coaching Spaces." This project combines a passion for product-building with modern full-stack development to deliver a tool that is both beautifully designed and deeply practical for users obsessed with productivity and systems.

## 📱 App Access & Testing

For the RevenueCat Shipyard submission, you can access and test the app via the following methods:

### 1. Web Production (Primary)
The quickest way to test the full user journey (Auth, AI Chat, Paywall UI) is via our production Vercel deployment:
👉 **[https://guidr-sooty.vercel.app](https://guidr-sooty.vercel.app)**

### 2. Mobile Testing (Native)
Oracle69 is built with **Capacitor**, meaning the web production link above is identical to the native experience. To generate a native test build (for TestFlight or Play Store Internal Testing):
1.  Ensure you have the environment variables configured.
2.  Run `npm run build` to generate the production web assets.
3.  Run `npx cap add ios` or `npx cap add android`.
4.  Run `npm run cap:sync` to push the code to the native projects.
5.  Open in Xcode/Android Studio and archive for distribution.

## ✨ Features

-   **Intelligent Coaching Spaces**: Choose from specialized modules like the Weekly Review System, Decision Matrix, or Energy Audit.
-   **Context-Aware AI**: The AI coach understands your quarterly goals and current sentiment to provide personalized advice.
-   **Seamless Multi-Platform**: A responsive web app built with React, easily packaged for native iOS and Android submission using **Capacitor**.
-   **Secure Authentication**: Robust user management powered by Firebase Auth.
-   **Cloud-Synced History**: Never lose a conversation. Your chat history and context are securely stored in Firestore.
-   **Premium Access**: Integrated with RevenueCat for advanced coaching modules and premium features.

## 🚀 Tech Stack

-   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS.
-   **Mobile Wrapper**: Capacitor (for native iOS/Android builds).
-   **AI Engine**: Google Gemini 1.5 Flash (via `@google/genai`).
-   **Backend**: Firebase Cloud Functions (v2), Firestore.
-   **Payments**: RevenueCat (JS SDK).
-   **Icons**: FontAwesome.

## 🛠️ Getting Started

### Prerequisites

-   Node.js (v20+)
-   A Google AI Studio API Key ([Get one here](https://aistudio.google.com/apikey))
-   A Firebase Project
-   A RevenueCat Project

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/guidr.git
    cd guidr
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_fb_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# RevenueCat
VITE_REVENUECAT_API_KEY=your_rc_public_api_key
```

## 📦 Production Deployment

### Frontend (Vercel / Render / Netlify)

Ensure all `VITE_` environment variables listed above are configured in your deployment platform's settings.

### Backend (Firebase Functions)

Deploy the Cloud Functions provided in `functions/src/index.ts`:

```bash
firebase deploy --only functions
```

Set the `GEMINI_API_KEY` using Firebase Secret Manager (recommended for v2 functions):

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

## 🏗️ Architecture & Hosting

### Backend & Frontend Hosting
*   **Frontend**: Hosted on **Vercel** ([https://guidr-sooty.vercel.app](https://guidr-sooty.vercel.app)).
*   **Backend**: Hosted on **Firebase Cloud Functions** (v2).
*   **Database**: **Firebase Firestore**.
*   **Authentication**: **Firebase Auth**.

### High-Level Architecture
The frontend (React/Vite) communicates with Firebase Cloud Functions, which orchestrate the AI (Google Gemini 1.5 Flash). User data and conversation history are stored in Firestore. The RevenueCat SDK is integrated into the frontend to manage subscription states, which unlock premium content.

## 🛠️ Debugging "Error connecting..."
If you see an "Error connecting..." message in the chat, it usually indicates a missing or misconfigured API key.

### 1. Check Gemini API Keys
*   **Backend**: Ensure the `GEMINI_API_KEY` is set in your Firebase project. Use `firebase functions:secrets:set GEMINI_API_KEY`.
*   **Frontend Fallback**: Ensure `VITE_GEMINI_API_KEY` is set in your Vercel Environment Variables if you are testing without a deployed backend.

### 2. Firebase Region Mismatch
The app defaults to `us-central1`. If your functions are deployed to a different region, set the `VITE_FIREBASE_REGION` environment variable in Vercel.

### 3. Firebase Project Config
Ensure the Firebase config in `src/firebase.ts` matches your current project.

### RevenueCat Integration Details

1.  **Initialization**: The RevenueCat JS SDK is configured with platform-specific public API keys on app launch.
2.  **Entitlements**: We created a premium entitlement. A user's access to premium Oracle69s is determined by checking `Purchases.getCustomerInfo()`.
3.  **Paywall**: A custom paywall component fetches offerings via `Purchases.getOfferings()` and triggers purchases with `Purchases.purchasePackage()`.

## 📄 License

This project is licensed under the MIT License.
