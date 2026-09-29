# EVI Setup — What's Done and What's Next

Last updated: 2026-09-24 by Claude (while you were away)

## What Claude finished

### ✅ Firebase project ready
- **Project**: `evi-house-manager`
- **Console**: https://console.firebase.google.com/project/evi-house-manager
- **Web app registered**: "EVI Mobile"
- **Config wired** into `src/services/firebase.ts` — your app can now talk to Firebase.

### ✅ Firebase Authentication enabled
- Email/Password provider is ON
- Users can sign up and log in from the app

### ✅ Cloud Firestore database created
- Location: `nam5` (United States, multi-region)
- Standard edition, production mode
- **Security rules** written locally at `firestore.rules` (not yet deployed — see below)

### ✅ App code built
- 21 source files, ~3,500 lines
- All TypeScript checks pass
- Screens: Login, Signup, Onboarding, Dashboard, Vault, Ask EVI, Calendar, Profile, Home Details, Vehicles, Add Vehicle, Members, Document Upload
- Services: auth, household, documents, tasks, alerts, events, vehicles, AI chat, document intelligence
- Navigation: bottom tabs + modal detail screens
- Firestore-aware with proper timestamp handling

### ✅ Cloud Functions written
- `functions/src/index.ts` has:
  - `askHousehold` — Ask EVI AI endpoint (wraps OpenAI GPT-4o-mini)
  - `analyzeDocument` — OCR + AI extraction from uploaded docs
  - `onDocumentUploaded` — auto-triggers analysis + creates tasks from deadlines

## What you need to do

### 🔴 1. Upgrade to Blaze plan (required for Storage + Functions)
Firebase Storage and Cloud Functions require the pay-as-you-go Blaze plan.
- Go to: https://console.firebase.google.com/project/evi-house-manager/usage/details
- Click **Upgrade** → add a credit card
- You get $300 free credit for 90 days, and Blaze itself is free for what a small app uses
- Nothing charges until you exceed the free tier (10 GB storage, 5 GB egress, 2M Function calls/month)

### 🔴 2. Enable Cloud Storage
After upgrading:
- Go to https://console.firebase.google.com/project/evi-house-manager/storage
- Click **Get started** → accept defaults (test mode is fine to start)

### 🟡 3. Deploy security rules and indexes
Once you're back at your computer:
```bash
cd /home/claude/evi-app
firebase login
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 🟡 4. Set OpenAI API key and deploy Cloud Functions
```bash
cd /home/claude/evi-app/functions
npm install
firebase functions:secrets:set OPENAI_API_KEY
# Paste your OpenAI key when prompted
cd ..
firebase deploy --only functions
```
Get an OpenAI API key: https://platform.openai.com/api-keys

### 🟡 5. Test the app
```bash
cd /home/claude/evi-app
npx expo start
```
Scan the QR code with the Expo Go app on your phone (iOS or Android).
Or press `i` for iOS simulator, `a` for Android emulator.

### 🟢 6. (Optional) Enable Google Vision for OCR
The `analyzeDocument` function uses Google Cloud Vision for OCR on PDFs and images.
- Enable at: https://console.cloud.google.com/apis/library/vision.googleapis.com?project=evi-house-manager
- No key needed — the function auto-authenticates via the project's default service account

## Firebase project reference

- **Project ID**: `evi-house-manager`
- **API key** (public, safe to expose): `AIzaSyByT9j-J6HVBV2O2c5wQRyxfUcC-ssJX6Q`
- **Sender ID**: `874771790659`
- **App ID**: `1:874771790659:web:79919d13456a59b9d84df6`
- **Measurement ID**: `G-GR6GY1BG0M`

All wired into `src/services/firebase.ts` already.

## Testing checklist

Once the above is done, verify:
- [ ] Sign up a new account from the Signup screen
- [ ] Complete onboarding (rent/own → household name)
- [ ] Land on Dashboard with your name in greeting
- [ ] Add a vehicle in Profile → Vehicles → +
- [ ] Upload a document in Vault → +
- [ ] Wait 30s — the doc should get a summary from AI
- [ ] Ask EVI a question in the Ask tab
- [ ] Add an event to the calendar
- [ ] Log out and back in

## Cost outlook

For your first 1,000 users (roughly), you should stay in free tier:
- **Firebase Auth**: free unlimited
- **Firestore**: 50k reads / 20k writes / 1 GB — free tier
- **Storage**: 5 GB free, then $0.026/GB/month
- **Functions**: 2M invocations free, then $0.40 per million
- **OpenAI GPT-4o-mini**: ~$0.15 per million input tokens
- **Google Vision**: 1000 pages/month free, then $1.50/1000

Expected: **$0–$20/month** while you're growing.

## Next big features to build (post-launch)

1. ~~**RevenueCat subscription flow**~~ — DONE. Solo $9.99/mo, Household $19.99/mo, Pro $39.99/mo (annual options too), no Lifetime tier
2. **Push notifications** — for critical alerts (lease expiry, vehicle renewal)
3. **Household invite flow** — email link that adds a new member
4. **Appliance management screens** — like vehicles but for washer/dryer/HVAC
5. **Utility tracking** — link bills to accounts, autopay flags
6. **Task recurrence UI** — set repeating schedules for maintenance
7. **Document detail view** — see extracted data, edit, delete, share
8. **iOS + Android build via EAS** — `eas build --platform all`
9. **App Store submission** — `eas submit`
