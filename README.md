# ⚡ Exprezzzo Power

**One API, All AI, Built for the Future.**

## Overview

Exprezzzo Power is a secure, modular, and scalable SaaS platform offering a unified API for cutting-edge AI models alongside a user-friendly AI playground. Designed for high-availability, rapid onboarding, and cost-optimized delivery, Exprezzzo Power enables seamless integration with leading LLMs and provides a superior user experience, all behind a single, unified API.

-   **🔒 Enterprise-grade security:** Built with modern best practices for authentication, access control, and data privacy.
-   **⚡ Lightning-fast API gateway:** Aggregate multiple AI models (OpenAI, Google Gemini, Claude, Groq) via a single, unified endpoint with intelligent routing for performance and cost savings.
-   **🚀 Seamless Deployment:** Fully automated CI/CD with Vercel and GitHub Actions for continuous delivery.
-   **🏗️ Modular architecture:** Designed for easy extensibility and multi-tenant scaling.

## Key Features

-   **Unified API for Leading LLMs:** Access GPT-4o, Claude Opus, Google Gemini Pro, Llama 3, and more through one simplified API.
-   **AI Playground Interface:** Intuitive web-based chat and document Q&A for non-developers, leveraging the same powerful backend.
-   **Secure Authentication Flows:** Supports email/password sign-in/sign-up, password reset, and guest checkout options via Firebase Auth.
-   **Instant Stripe Payments:** Integrated with Stripe Checkout for seamless subscription purchases, including webhooks for automated user access.
-   **Flexible Checkout Experience:** Users can create accounts during checkout or proceed as guests, with secure account creation handled automatically via webhooks.
-   **Viral Sharing & Referrals:** Built-in system to invite friends and earn rewards, boosting user growth.
-   **Real-Time Analytics & Monitoring:** Integrated with PostHog (optional) and other tools for usage tracking and performance insights.
-   **Developer-Friendly Tools:** API Key management, usage dashboards, and comprehensive documentation.
-   **Modern User Experience:** Cutting-edge design with smooth animations, mobile responsiveness, and intuitive navigation.

## Tech Stack

-   **Frontend:** Next.js 15+, React 19+, Tailwind CSS, TypeScript
-   **API Layer:** Next.js API Routes (serverless functions on Vercel) for primary frontend interactions (e.g., Stripe checkout, webhook).
-   **Backend (Optional/Additional):** Node.js, Express (separate server, e.g., in `backend/` folder) for additional core API functionalities, potentially deployed independently.
-   **Database:** Firebase Firestore (serverless, real-time, user profiles, usage data).
-   **Authentication:** Firebase Authentication (email/password, Google Sign-In ready, passwordless magic links ready).
-   **Payments:** Stripe (`@stripe/stripe-js`, `stripe` SDKs).
-   **AI Providers:** OpenAI, Anthropic, Google Gemini, Groq SDKs.
-   **Cloud Platform:** Vercel (primary deployment for Next.js app), Firebase (for Auth, Firestore, Storage).
-   **CI/CD:** GitHub Actions, Vercel automatic deployments.
-   **Utilities:** Zod (validation), Zustand (state management), Resend (email delivery).

## Quick Start (For Local Development)

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Exprezzzo/exprezzzo-power.git](https://github.com/Exprezzzo/exprezzzo-power.git)
    cd exprezzzo-power
    ```

2.  **Frontend/Next.js Setup:**
    ```bash
    # Copy example env file for frontend/root
    cp .env.local.example .env.local
    # IMPORTANT: Edit .env.local with your actual NEXT_PUBLIC_ keys, and other root-level secrets.
    # THIS FILE SHOULD NOT BE COMMITTED TO GIT!
    
    npm install # Install root dependencies (Next.js, React, etc.)
    ```

3.  **Backend Express Setup (if running locally):**
    ```bash
    cd backend
    # Copy example env file for backend
    cp .env.local.example .env.local
    # IMPORTANT: Edit backend/.env.local with your actual FIREBASE_ keys, STRIPE_SECRET_KEY, etc.
    # THIS FILE SHOULD NOT BE COMMITTED TO GIT!

    npm install # Install backend dependencies
    npm run build # Build the backend TypeScript
    cd .. # Go back to project root
    ```

4.  **Install Git Hooks (Optional but Recommended):**
    ```bash
    npm run prepare
    ```

5.  **Run Type Checking & Linting:**
    ```bash
    npm run type-check # Check TypeScript errors
    npm run lint     # Check ESLint errors
    npm run format   # Auto-format code with Prettier
    ```

6.  **Start Development Servers:**
    ```bash
    # Start Next.js frontend (and its API routes)
    npm run dev
    
    # In a separate terminal, start the Express backend (if you intend to use it)
    cd backend
    npm run dev
    ```

## Deployment

Deploy directly to Vercel via Git integration. Ensure all sensitive environment variables are configured securely in your [Vercel Dashboard](https://vercel.com/dashboard) under your project's settings, for Production, Preview, and Development environments.

---

### **Action Plan for Your Mobile Device**

**Step 1: Perform All Code Updates & File/Folder Creations on GitHub.com**

* **Update `components/PaymentButton.tsx`**: Replace its entire content with the **Phase 1, A.1 code** above.
* **Update `app/api/stripe/checkout-session/route.ts`**: Replace its entire content with the **Phase 1, B.2 code** above.
* **Update `app/api/stripe/webhook/route.ts`**: Replace its entire content with the **Phase 1, B.3 code** above.
* **Update `app/page.tsx`**: Replace its entire content with the **Phase 1, C.4 code** above.
* **Update `app/pricing/page.tsx`**: Create the `app/pricing` folder and `page.tsx` file (if missing), then paste the **Phase 1, C.3 code** above.
* **Create `app/checkout/page.tsx`**: Create the `app/checkout` folder and `page.tsx` file, then paste the **Phase 1, C.5 code** above.
* **Create `lib/publicRoutes.ts`**: Create the `lib` folder and `publicRoutes.ts` file, then paste the **Phase 1, D.1 code** above.
* **Create `lib/auth.ts`**: Create the `lib` folder and `auth.ts` file, then paste the **Phase 1, D.6 code** above.
* **Create `types/index.ts`**: Create the `types` folder and `index.ts` file, then paste the **Phase 1, D.8 code** above.
* **Create `lib/constants.ts`**: Create the `lib` folder and `constants.ts` file, then paste the **Phase 1, D.9 code** above.
* **Create `.prettierrc`**: Create the `.prettierrc` file at the root, then paste the **Phase 1, D.10 code** above.
* **Update `app/login/page.tsx`**: (Phase 1, D.2 from this response).
* **Update `app/playground/page.tsx`**: (Phase 1, D.9 from previous response).
* **Append CSS to `app/globals.css`**: (Phase 1, A.4 from previous response, the animation CSS).
* **Update `tailwind.config.js`**: (Phase 1, A.5 from previous response).
* **Update `postcss.config.js`**: (Phase 1, A.5 from previous response - ensure it exists and has content).

**2. Backend Express Files (Updates & Creation you provided in previous prompt)**

* **Update `backend/package.json`**: (Phase 1, A.1 from previous response).
* **Update `backend/tsconfig.json`**: (Phase 1, A.2 from previous response).
* **Update `backend/src/server.ts`**: (Phase 1, A.3 from previous response).
* **Update `backend/src/api/middleware/errorHandler.ts`**: (Phase 1, A.4 from previous response).
* **Update `backend/src/config/firebase.ts`**: (Phase 1, A.5 from previous response).
* **Create `backend/.eslintrc.json`**: If missing. (Code provided in previous comprehensive response).
* **Create `backend/.env.local.example`**: If missing. (Code provided in previous comprehensive response).

**3. Confirm Correct Page Paths (CRITICAL for 404s)**

* **Delete `app/app/signup/` folder and its contents.** (This is the path correction you've already done).
* **Ensure `app/signup/page.tsx` exists directly under `app/`.** (Code provided in Phase 1, #1 from my *last* response).
* **Ensure `app/dashboard/page.tsx` exists directly under `app/`.** (Code provided in Phase 1, #2 from my *last* response).
* **Create other placeholder pages (if not yet done):**
    * `app/api-keys/page.tsx`
    * `app/usage/page.tsx`
    * `app/chat-history/page.tsx`
    * `app/faq/page.tsx`
    * `app/contact/page.tsx`

**4. Commit all these combined code changes** (frontend and backend) to your `main` branch on GitHub.com. This triggers a new Vercel deployment.

**Step 2: Perform All Environment Variable Setup (in Vercel Dashboard)**

* **This is ABSOLUTELY ESSENTIAL for runtime functionality, especially payments.**
* **Firebase Admin SDK Keys:** Find and correctly set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (ensure `private_key` is the **full string** including `-----BEGIN...` and `\n` characters). Refer to Phase 2, #1 from my *last* response for detailed finding instructions.
* **Stripe Price ID Environment Variables:** Set `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` (`price_1Ron5iHMIqbrm277EwcrZ1QD`) and `NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID` (`price_1Ron8kHMIqbrm2776x3uVAH5`).
* **App URL Environment Variables:** Set `NEXT_PUBLIC_APP_URL` (e.g., `https://your-app-name.vercel.app`) and `FRONTEND_URL` (this should match `NEXT_PUBLIC_APP_URL`).
* **Stripe API Keys:** Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
* **AI API Keys:** Set `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `GOOGLE_AI_API_KEY`.
* **Email Service Keys:** Set `RESEND_API_KEY`, `EMAIL_FROM`.
* **Database/Analytics (if you use them):** `DATABASE_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_ENABLE_ANALYTICS`, `NEXT_PUBLIC_ENABLE_PWA`, `NEXT_PUBLIC_USE_FIREBASE_EMULATOR`.
* **Ensure all keys are consistent (all test mode keys if you're testing, or all live mode keys if you're live).**
* **Save all changes in Vercel.**

**Step 3: Test Your Live Application (Once Deployment is Complete)**

Once the Vercel deployment completes after all these code and environment variable updates:

* **Verify Design:** Load your application's base URL. The modern design with colors, fonts, and animations should now be correctly applied.
* **Verify Page Navigation:** Ensure all pages (especially `/signup`, `/dashboard`, `/pricing`, `/checkout`, `/invite`, and all placeholders) load without `404` errors.
* **Test Authentication:** Attempt to sign up for a new account, then log in.
* **Most importantly, test the payment flow:**
    * Click "Get Started Free" on the landing page (which scrolls to pricing), then choose a plan and click "Get Power Access" (you'll be redirected to `/checkout`).
    * Or, if logged in, click "Get Power Access Now" on the landing page.
    * On the `/checkout` page, fill in details (if needed) and click "Proceed to Payment." You should now be successfully redirected to **Stripe's hosted checkout page**.

Please proceed with these comprehensive steps. This should fully address the remaining build errors, activate all features, and get your application ready for public launch. Let me know the results of your testing!
