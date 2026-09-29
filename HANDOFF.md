# EVI - Handoff to Jaxson

**Session ended:** 2026-09-25 (evening)
**Owner:** JD North LLC / Jaxson Duffin

## TL;DR — What I did while you ate

- ✅ Built out full app UI (13 screens now — added Task creation, Appliances, Utilities, Paywall)
- ✅ Wrote **Privacy Policy** and **Terms of Service** (in `/legal/`)
- ✅ Wrote **App Store copy** with keywords, descriptions, screenshot ideas (in `/store-listing/`)
- ✅ Built a **marketing landing page** (in `/landing/`)
- ✅ Generated **real brand icon + splash screen** (SVG + PNG in `/assets/`)
- ✅ Created **`eas.json`** ready for cloud builds
- ✅ Fully wired **RevenueCat subscription flow** for $9.99/$19.99/$39.99 tiers (no Lifetime)
- ✅ **Zero TypeScript errors** across the whole codebase

## What YOU need to do next — in order

### 🔴 CRITICAL (do these first)

**1. Rotate OpenAI API key** *(30 sec — since you pasted the key in chat)*
- Go to https://platform.openai.com/api-keys
- Delete "EVI Mobile" key
- Create a new one
- Send it to me → I'll update Firebase Secret Manager

**2. Give me your Expo access token** *(2 min)*
- Go to https://expo.dev/settings/access-tokens
- Log in with the account you used for Fairshare
- Click "Create token" → name it "EVI Deploy" → Create
- Copy immediately and send to me
- I'll use it to configure EAS + trigger builds

**3. App Store Connect API Key** *(3 min if you have one from Fairshare)*
- Go to https://appstoreconnect.apple.com/access/integrations/api
- If Fairshare's key is still there: send me Key ID + Issuer ID + attach the `.p8` file (or generate a new one)
- Otherwise: click "Generate API Key" → role: **App Manager** → download `.p8` → send me file + Key ID + Issuer ID
- This lets EAS auto-manage iOS certificates

### 🟡 IMPORTANT (do this week)

**4. Add EVI to App Store Connect**
- Go to https://appstoreconnect.apple.com/apps
- Click "+" → "New App"
- Platform: iOS
- Name: **EVI - Your House Manager**
- Bundle ID: `com.jdnorth.evi` (create it in "Certificates, IDs & Profiles" first)
- Language: English (U.S.)
- SKU: `evi-mobile-2026`

**5. Add EVI to Google Play Console**
- Go to https://play.google.com/console/developers/apps
- Click "Create app"
- App name: **EVI - Your House Manager**
- Default language: English (US)
- App or game: App
- Free or paid: Free (subscriptions are IAP)

**6. Deploy privacy policy + terms**
- Host `/legal/PRIVACY_POLICY.md` and `/legal/TERMS_OF_SERVICE.md` somewhere with URLs
- Easiest: paste them into a free service like Termly, GitHub Pages, or your JD North site
- App Store requires URLs before submission
- Update `store-listing/APP_STORE_LISTING.md` with the URLs

**7. RevenueCat — DONE (2026-09-27)**
- All 6 iOS products created in App Store Connect: Solo $9.99/mo & $99.99/yr, Household $19.99/mo & $199.99/yr, Property Pro $39.99/mo & $399.99/yr
- All 3 entitlements (`solo`, `household`, `pro`) and the `default` offering are wired in RevenueCat and match `subscriptionService.ts` / `PaywallScreen.tsx`
- No Lifetime tier — intentionally excluded
- Still open: matching Google Play products, if/when Android launches

### 🟢 NICE TO HAVE (before public launch)

**8. Take screenshots for App Store**
- Use the phone builds (once they're ready) to capture 6-10 screenshots
- Add device frames + captions using Canva or Figma
- Ideas listed in `store-listing/APP_STORE_LISTING.md`

**9. Enable Google Vision API** *(for document OCR)*
- Go to https://console.cloud.google.com/apis/library/vision.googleapis.com?project=evi-house-manager
- Click Enable
- No key needed — Functions auto-authenticate

**10. Buy a domain**
- Suggestions: `evi.app`, `usevi.com`, `eviapp.co`, `getevi.com`, `evihome.app`
- Point it at your landing page
- Use it as your marketing URL in App Store

## Once we have credentials, I will:

1. Run `eas build:configure` to link Expo project
2. Trigger `eas build --platform ios --profile preview` → TestFlight-ready IPA
3. Trigger `eas build --platform android --profile preview` → APK for direct install
4. Trigger `eas submit --platform ios` → upload to TestFlight
5. Trigger `eas submit --platform android` → upload to Google Play internal testing
6. Update RevenueCat keys once you set them
7. Continue polishing based on what you find in TestFlight

## What's in this codebase

```
evi-app/
├── App.tsx                          Root component
├── app.json                         Expo config (with iPad support + bundle ID)
├── eas.json                         EAS Build profiles
├── firebase.json                    Firebase deployment config
├── firestore.rules                  Firestore security rules (deployed ✓)
├── storage.rules                    Storage security rules (deployed ✓)
├── firestore.indexes.json           Composite indexes
├── package.json                     Dependencies
│
├── src/
│   ├── theme/colors.ts              Brand colors + spacing tokens
│   ├── types/index.ts               All TypeScript types
│   ├── context/AuthContext.tsx      Auth + household state
│   ├── navigation/AppNavigator.tsx  All routes wired up
│   │
│   ├── services/
│   │   ├── firebase.ts              Firebase config (creds wired in ✓)
│   │   ├── authService.ts           Sign up / login / logout
│   │   ├── householdService.ts      Household CRUD
│   │   ├── documentService.ts       Upload / list / delete docs
│   │   ├── taskService.ts           Tasks
│   │   ├── alertService.ts          Alerts + proactive engine
│   │   ├── eventService.ts          Calendar events
│   │   ├── vehicleService.ts        Vehicles
│   │   ├── aiService.ts             Ask EVI (calls Cloud Function)
│   │   ├── documentIntelligenceService.ts  Document AI
│   │   └── subscriptionService.ts   RevenueCat integration
│   │
│   └── screens/                     13 screens
│       ├── auth/         Login, Signup
│       ├── onboarding/   Household setup
│       ├── dashboard/    Home (greeting, alerts, tasks)
│       ├── vault/        Document Vault
│       ├── ask/          Ask EVI AI chat
│       ├── calendar/     Month view + events
│       ├── profile/      Settings + subscription banner
│       ├── home/         Home details editor
│       ├── vehicles/     List + add vehicle
│       ├── appliances/   List + add appliance
│       ├── utilities/    List + add utility
│       ├── documents/    Upload screen (camera + file picker)
│       ├── tasks/        Add task modal
│       ├── members/      Household members
│       └── subscription/ Paywall
│
├── functions/                       Cloud Functions (deployed ✓)
│   └── src/index.ts                 askHousehold, analyzeDocument, onDocumentUploaded
│
├── assets/
│   ├── icon.svg + icon.png          App icon (1024x1024)
│   ├── splash.svg + splash.png      Splash screen (1284x2778)
│   ├── favicon.png                  Web favicon
│   └── android-icon-*.png           Android adaptive icons
│
├── legal/
│   ├── PRIVACY_POLICY.md            Ready to host
│   └── TERMS_OF_SERVICE.md          Ready to host
│
├── store-listing/
│   └── APP_STORE_LISTING.md         Copy for iOS + Android stores
│
├── landing/
│   └── index.html                   Marketing landing page
│
├── SETUP.md                         Original setup notes
└── HANDOFF.md                       This document
```

## Live services

- **Firebase project:** https://console.firebase.google.com/project/evi-house-manager
- **Cloud Functions endpoints** (deployed ✓):
  - `https://us-central1-evi-house-manager.cloudfunctions.net/askHousehold`
  - `https://us-central1-evi-house-manager.cloudfunctions.net/analyzeDocument`
- **Firestore rules:** Deployed ✓
- **Storage rules:** Deployed ✓
- **Auth:** Email/Password enabled ✓
- **OpenAI:** Stored as Firebase Secret (needs rotation)

## Anything I would add (you asked)

**Yes — a few things worth considering:**

1. **Free trial** — 7-day free trial on paid plans typically doubles conversion vs. no trial. RevenueCat makes this trivial to add.

2. **Referral program** — "Invite 3 people, get a free month" would fit your business style (Fairshare had this vibe). Firebase Dynamic Links handles the invites.

3. **Photo scanning for the "Scan" button** — right now it just goes to upload. A real scanner (using `expo-image-picker` with cropping + `expo-image-manipulator` for perspective correction) makes the Vault feel magical for paper documents.

4. **Two-tier storage** — RevenueCat entitlements support "add-ons" like extra storage. Selling "50GB extra for $2/mo" past the base tier could be a low-friction upsell.

5. **Alexa/Google Home skill** — "Alexa, ask EVI when my lease ends" is a killer feature and probably a 2-week build. Great for retention and press.

6. **Family Sharing (iOS)** — App Store supports letting parents share a subscription with kids. Enabling this makes the Household plan feel more valuable.

I did NOT do these — you can pick which ones sound worth doing after MVP launch.

## Cost outlook (running right now)

- **Firebase:** $0/month (well within free tier)
- **Cloud Functions:** $0/month (2M invocations free)
- **OpenAI:** whatever you prepaid — probably 3000+ chats per $10
- **Storage:** $0/month (5GB free)
- **Anthropic (me):** Only when we work together

For your first 100 real users, expect $0–20/month total infrastructure cost. Solo pricing at $9.99/mo means 2 subscribers covers all of it plus profit.

---

**When you're back, just paste the three credentials from step 1-3 above and I'll take it from there.**
