# Guidr | Your AI-Powered Personal Growth Companion

**Live Demo**: [https://guidr-sooty.vercel.app/](https://guidr-sooty.vercel.app/)

## 📖 Project Story

Guidr was born out of a simple observation: most productivity tools tell you *what* to do, but very few help you reflect on *how* you're doing. Inspired by the "Weekly Review" methodology and built for the **RevenueCat Shipyard contest**, Guidr is designed to be a thoughtful companion that bridges the gap between raw task lists and deep personal reflection. It uses advanced AI to guide users through structured coaching "recipes" that promote clarity, reduce friction, and align daily actions with long-term quarterly goals.

![Guidr Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## ✨ Features

-   **Intelligent Coaching Spaces**: Specialized modules like the Weekly Review System, Decision Matrix, and Energy Audit.
-   **Context-Aware AI**: Powered by **Gemini 1.5 Flash**, the coach remembers your quarterly goals and current sentiment for hyper-personalized guidance.
-   **Multi-Platform Mobility**: Fully initialized with **Capacitor**, enabling seamless deployment to iOS and Android as a native app from the same codebase.
-   **Professional AI Rendering**: Full Markdown support in chat for clear, structured advice, with built-in "Copy to Clipboard" for key insights.
-   **Secure Authentication**: Robust user management powered by Firebase Auth.
-   **Cloud-Synced History**: Conversations and user context are securely persisted in Firestore.
-   **RevenueCat Integration**: A production-ready paywall system for premium coaching tiers.

## 🚀 Tech Stack

-   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS.
-   **AI Engine**: Google Gemini 1.5 Flash (via `@google/genai`).
-   **Backend**: Firebase Cloud Functions (v2), Firestore.
-   **Payments**: RevenueCat (JS SDK).
-   **Mobile Integration**: **Capacitor** (initialized and ready for platform addition).

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

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## 📦 Production Deployment

### Frontend (Vercel / Render)

Configure all `VITE_` environment variables in your deployment platform's dashboard. Guidr is optimized for Vercel.

### Backend (Firebase Functions)

Deploy the Cloud Functions using the Firebase CLI:
```bash
firebase deploy --only functions
```
*Note: The backend is pre-configured to use **Gemini 1.5 Flash** via Cloud Functions v2 for maximum security and performance.*

### Mobile App (iOS / Android)

Guidr is pre-configured with **Capacitor**. To build your native mobile app:

1.  Build the web project: `npm run build`
2.  Add your desired platforms:
    ```bash
    npx cap add ios
    npx cap add android
    ```
3.  Sync the web code to the native projects:
    ```bash
    npm run cap:sync
    ```
4.  Open in Xcode or Android Studio:
    ```bash
    npm run cap:open:ios
    ```

## 📄 License

This project is licensed under the MIT License.
