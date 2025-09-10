# Exprezzz Power v1.5.1 - Deployment Guide

## Environment Variables Setup

### Frontend (.env.local)
```bash
# === EXPREZZZ POWER v1.5.1 - PRODUCTION CONFIGURATION ===

# App Configuration
NEXT_PUBLIC_APP_URL=https://exprezzzo-power.vercel.app
NEXT_PUBLIC_APP_NAME="Exprezzz Power"

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_xxxxx

# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyLCMg9ru3Cv32vEDl37NxqKkbqLDHAHvY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=exprezzzo-power.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=exprezzzo-power
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=exprezzzo-power.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=72472107832
NEXT_PUBLIC_FIREBASE_APP_ID=1:72472107832:web:6cd307c4b3ad62b51e7e8d

# Firebase Admin Configuration
FIREBASE_PROJECT_ID=exprezzzo-power
FIREBASE_CLIENT_EMAIL=xxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxxxx\n-----END PRIVATE KEY-----\n"
FIREBASE_PRIVATE_KEY_ID=xxxxx
FIREBASE_CLIENT_ID=xxxxx
FIREBASE_CLIENT_CERT_URL=xxxxx

# AI Providers
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_AI_API_KEY=AIzaSyxxxxx
GROQ_API_KEY=gsk_xxxxx

# Monitoring & Environment
VERCEL_ENV=production
NODE_ENV=production
```

### Backend (backend/.env.local)
```bash
# === EXPREZZZ POWER v1.5.1 - BACKEND PRODUCTION CONFIGURATION ===

# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://exprezzzo-power.vercel.app

# Firebase Admin SDK
FIREBASE_PROJECT_ID=exprezzzo-power
FIREBASE_CLIENT_EMAIL=xxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxxxx\n-----END PRIVATE KEY-----\n"
FIREBASE_PRIVATE_KEY_ID=xxxxx
FIREBASE_CLIENT_ID=xxxxx
FIREBASE_CLIENT_CERT_URL=xxxxx

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# AI Providers
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_AI_API_KEY=AIzaSyxxxxx
GROQ_API_KEY=gsk_xxxxx

# Email Service
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@exprezzz.power

# Monitoring
VERCEL_ENV=production
NODE_ENV=production
```

## Vercel Deployment

### 1. Environment Variables in Vercel Dashboard

Add all the above environment variables in your Vercel dashboard:
- Go to your project settings
- Navigate to "Environment Variables"
- Add each variable for "Production" environment

### 2. Build Configuration

Ensure your `vercel.json` includes:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 3. Required External Services

1. **Firebase Project**: Set up Firebase project with:
   - Authentication enabled
   - Firestore database
   - Admin SDK service account

2. **Stripe Account**: Configure:
   - Live API keys
   - Monthly price ($49) and Yearly price ($399)
   - Webhook endpoints

3. **AI Provider Keys**: Obtain API keys from:
   - OpenAI (GPT models)
   - Anthropic (Claude models)
   - Google AI (Gemini models)
   - Groq (Fast inference)

## Security Configuration

### Firebase Rules (Firestore)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Metrics collection - users can only access their own
    match /metrics/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Subscriptions - users can only read their own
    match /subscriptions/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Referrals - users can read their own and create new ones
    match /referrals/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin only collections
    match /admin/{document=**} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### Firebase Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Launch Checklist

- [ ] All environment variables configured
- [ ] Firebase project set up with proper rules
- [ ] Stripe configured with live keys and price IDs
- [ ] AI provider API keys valid and have credits
- [ ] Domain configured (exprezzzo-power.vercel.app)
- [ ] SSL certificate active
- [ ] Admin user configured with proper claims
- [ ] Test payment flow works end-to-end
- [ ] Roundtable feature functional
- [ ] Margin enforcement active (50% threshold)
- [ ] All pages load without errors
- [ ] Mobile responsive design verified
- [ ] Performance metrics ≥90 on Lighthouse

## Post-Launch Monitoring

1. **Cost Monitoring**: Set up alerts for:
   - AI API usage exceeding budget
   - User margins below 50%
   - Subscription failures

2. **Error Monitoring**: Monitor:
   - API endpoint errors
   - Authentication failures
   - Payment processing issues

3. **Performance Monitoring**: Track:
   - Page load times
   - API response times
   - User session lengths

## Support & Maintenance

- Monitor Firebase costs and usage
- Review AI provider costs monthly
- Update API keys before expiration
- Regular security audits
- User feedback collection via admin dashboard

---

**Exprezzz Power v1.5.1 - 100% Launch Ready** 🚀