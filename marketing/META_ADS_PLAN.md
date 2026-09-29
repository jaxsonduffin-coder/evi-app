# EVI — Meta (Facebook/Instagram) Ads Launch Plan

I don't have a connected Meta Ads Manager account, so I can't click "publish" on a live campaign myself — Meta doesn't expose that through any tool I have access to, and spending your money is something you need to approve and execute yourself anyway. What I *can* do is hand you a ready-to-launch plan: campaign structure, audiences, budget, and finished ad copy so you can build this in the Meta Ads Manager app in about 10 minutes on your phone.

## 1. Campaign objective

Use **App installs / App promotion** (Advantage+ App Campaign) as the objective, not "Traffic" or "Engagement." Meta's algorithm optimizes for people likely to install, which is what you want pre-revenue.

- Requires: EVI listed in the App Store (TestFlight doesn't count — Meta needs a live App Store/Play Store listing to attribute installs). If you're still pre-launch, run **Instagram/Facebook Traffic campaigns to the landing page** (`landing/index.html`, once hosted) with an email-capture waitlist instead, then switch to App Installs the day you go live.
- Placements: Automatic (Advantage+) — let Meta pick Feed/Reels/Stories. Manual placement picking almost always costs more per install for a new advertiser.

## 2. Budget (bootstrap phase)

Start small and let data decide, don't lock into one big spend:

- **Days 1–7 (testing):** $20–30/day total, split across 3 ad sets below. That's ~$150–200 to find out which audience responds — enough for Meta's algorithm to exit the learning phase (it needs ~50 conversions per ad set per week to optimize well).
- **Days 8–14:** Kill anything with cost-per-install above $8–10 (typical range for a utility/productivity app), double the budget on whichever ad set is cheapest.
- Don't judge results before day 4 — the learning phase makes early numbers noisy.

## 3. Audiences (three separate ad sets — don't combine)

**A. Renters**
- Interests: Apartment hunting, Renters insurance, Zillow, Apartments.com
- Age 22–38, exclude homeowners if you have that signal
- Angle: never lose your lease again, deadline reminders, AI answers about your rental

**B. Homeowners**
- Interests: Home improvement, Home ownership, Zillow (owner intent), HGTV
- Age 28–55
- Angle: one place for warranties, maintenance, and "when did I last do X"

**C. Landlords / small property owners (Property Pro tier — highest LTV, prioritize this one)**
- Interests: Rental property investing, Real estate investing, Landlord, BiggerPockets
- Age 30–60
- Angle: manage every property from one app, $19.99/mo pays for itself the first time it saves you a missed inspection or expired policy

## 4. Ad copy (ready to paste)

### Ad Set A — Renters
**Primary text:**
"Lease deadlines, security deposit dates, maintenance requests — EVI keeps track so you don't have to. Just ask EVI anything about your home and get an instant answer."
**Headline:** Your rental, finally organized
**Description:** Free to start · No credit card needed

### Ad Set B — Homeowners
**Primary text:**
"Warranty expiring? Furnace filter due? EVI is the AI that remembers everything about your home — upload a document once, EVI extracts the dates and reminds you automatically."
**Headline:** Never miss a home deadline again
**Description:** AI-powered home management

### Ad Set C — Landlords (Property Pro)
**Primary text:**
"Managing multiple rental properties from a spreadsheet? EVI tracks leases, insurance renewals, and maintenance across every property — and answers tenant questions instantly. Built for landlords managing up to 5 properties."
**Headline:** Property management, simplified
**Description:** Property Pro: $19.99/mo · 7-day free trial

## 5. Creative

Use the app icon and a 3–4 screen carousel from actual app screens (Dashboard, Vault, Ask EVI chat) rather than stock photos — Meta's Advantage+ system rewards authentic product screenshots over polished stock creative right now. You already have `assets/icon.png`; grab fresh screenshots from a TestFlight build or the Expo Go preview for the carousel.

If you want, I can generate a short screen-recording GIF of the app flow for use as a Reels-format video ad — just say the word once you have a build running.

## 6. Tracking

- In Meta Events Manager, set up the Facebook SDK for iOS in the Expo app (`react-native-fbsdk-next` or Meta's own Expo config plugin) so install → signup → subscription events attribute correctly. This is a follow-up build task, not something you need before the first test campaign.
- Until that's wired in, judge campaigns on cost-per-install and let organic signup/subscription rates (which you can see in Firebase) tell you if traffic quality is good.

## 7. Step-by-step to launch tonight from your phone

1. Open the **Meta Ads Manager** app (not regular Facebook/Instagram app).
2. Create Campaign → objective **App promotion**.
3. Create 3 ad sets, one per audience above, $7–10/day each.
4. For each ad set, create one ad using the matching copy block above + your app icon/screenshots.
5. Set campaign budget optimization OFF for the first week (so each ad set gets its guaranteed share of spend and you get a clean read on which audience wins).
6. Submit for review — approval is usually under an hour.

---
*Drafted by Claude — review numbers against your actual budget before spending. I'm not a licensed marketing or financial advisor; treat the cost-per-install and budget figures above as industry-typical starting points, not guarantees.*
