```markdown
# Guidr | Your AI-Powered Personal Growth Companion

**Live Demo:** [https://guidr-sooty.vercel.app](https://guidr-sooty.vercel.app)

Guidr is a high-performance personal coaching application designed to help you find clarity, reflect on your progress, and optimize your daily life. Built with React 19, Vite, and powered by Google's Gemini 1.5 Flash, Guidr provides a seamless, intelligent coaching experience across web and mobile.

## 🎯 Project Story

Guidr was conceived and built for the **RevenueCat Shipyard: Creator Contest**, specifically for creator **Simon (Better Creating)**. Inspired by his brief for a "minimalist AI coaching app," we set out to solve the core problem his audience faces: the gap between inspiration and systematic action. Rather than building another open-ended chatbot, we created **Guidr**—a platform that productizes coaching methodologies into structured, step-by-step "Coaching Spaces." This project combines a passion for product-building with modern full-stack development to deliver a tool that is both beautifully designed and deeply practical for users obsessed with productivity and systems.

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
-   A RevenueCat Project (optional for local development)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Oracle69digitalmarketing/Guidr.git
    cd guidr
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up your environment variables (see below).

### Environment Variables

Create a `.env.local` file in the root directory and add the following:

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

Running Locally

```bash
npm run dev
```

The app will be available at http://localhost:3000.

📦 Production Deployment

Frontend (Vercel / Render / Netlify)

Ensure all VITE_ environment variables listed above are configured in your deployment platform's settings.

Backend (Firebase Functions)

Deploy the Cloud Functions provided in functions-index.ts (or functions-index.js):

```bash
firebase deploy --only functions
```

Set the GEMINI_API_KEY in your Firebase Function environment:

```bash
firebase functions:config:set gemini.api_key="YOUR_KEY"
```

Note: For v2 functions, prefer using Secret Manager or .env files within the functions directory.

Architecture & RevenueCat Implementation

High-Level Architecture

The frontend (React/Vite) communicates with Firebase Cloud Functions, which orchestrate the AI (Google Gemini 1.5 Flash). User data and conversation history are stored in Firestore. The RevenueCat SDK is integrated into the frontend to manage subscription states, which unlock premium content flagged by an isLocked field in the Firestore guidrs collection.

RevenueCat Integration Details

1. Initialization: The RevenueCat JS SDK is configured with platform-specific public API keys on app launch.
2. Entitlements: We created a premium entitlement. A user's access to premium Guidrs is determined by checking Purchases.getCustomerInfo().
3. Paywall: A custom paywall component fetches offerings via Purchases.getOfferings() and triggers purchases with Purchases.purchasePackage().
4. Server-Side Verification (Optional): For enhanced security, the Cloud Function can verify a user's subscription status via the RevenueCat REST API before serving premium content.

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

```
