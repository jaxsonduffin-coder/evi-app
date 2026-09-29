# EVI - Your Action List
Updated: 2026-09-28

## 🔴 Right now — get the code onto your computer

All the work described below is committed locally in a cloud sandbox that can't push directly to your GitHub (blocked by the sandbox's own network policy, unrelated to permissions). To move to Claude Code on your own computer:

1. Unzip the project export you were sent (or if you already created `github.com/jaxsonduffin-coder/evi-app`, use that).
2. In a terminal, in that folder: `git init && git add . && git commit -m "Initial commit" && git branch -M main && git remote add origin https://github.com/jaxsonduffin-coder/evi-app.git && git push -u origin main`
3. Open that same folder in Claude Code on your computer.
4. Tell it: "read TODO_FOR_JAXSON.md, HANDOFF.md, and CLAUDE.md to get up to speed" — it'll have full context immediately.
5. From there, Claude Code can run `npx eas-cli credentials -p ios` and walk you through the Apple ID/2FA login directly in your terminal — something no cloud session can do for you.

## ✅ Already done (no action needed)

- RevenueCat + App Store Connect subscription products: all 6 created and wired (Solo $9.99/mo or $99.99/yr, Household $19.99/mo or $199.99/yr, Property Pro $39.99/mo or $399.99/yr). **No Lifetime tier** — intentionally left out per your instruction, don't add one.
- App Store Connect app entry + API key (`ascAppId` and API key already configured in `eas.json`/`secrets/`)
- Identification document uploads (driver's license, passport, state ID, credit/debit card, vehicle registration) with AI-extracted expiration dates
- Move-In / Move-Out / "Adulting 101" checklists, reachable from the Dashboard

## 🔧 Full app audit (2026-09-27) — bugs found and fixed today

Went through every screen in the app looking for dead buttons, broken navigation, crashes, and monetization gaps. Found and fixed:

- **Vehicles screen was completely broken** — tapping a vehicle did nothing (it linked to a screen that was never built). Now opens a working edit/delete screen, same pattern as your other detail screens.
- **Referral "Copy code" / "Copy link" buttons would have crashed the app** — they used a clipboard API that was removed from React Native years ago. Installed the correct package (`expo-clipboard`) and fixed both buttons. This would have shown up the first time anyone tried to copy their referral code.
- **Referrals screen could get stuck on a spinner forever** if the data failed to load (no error handling, no retry) — added a real error state with a "Try again" button.
- **Document/storage limits were never enforced anywhere** — a Free user could upload unlimited documents despite the pricing page saying "10 documents." Now upload is blocked past your plan's limit with an upgrade prompt, and the Vault screen shows a usage warning as people approach it. This was a real revenue leak — nothing was actually backing the plan limits you're charging for.
- **No way to remove a household member or leave a household** — invites worked but were permanent. Added remove/leave with the owner protected from being removed.
- **Multi-page document scanning silently dropped every page after the first** with zero warning — someone scanning a 3-page lease would only get page 1 saved and never know pages 2-3 vanished. Now it warns clearly before discarding anything. (Real PDF bundling for multi-page scans is a bigger job — flagged as a future improvement, not fixed today since it needs a new native module I can't test without a device.)
- Payment/paywall audit — see item 0 below, this was the big one.

Checked and confirmed solid (no changes needed): account deletion flow (Apple-mandated, works correctly with double confirmation), data export, household invite code redemption (server-side member-limit and expiry checks are already correct), all checklist screens, onboarding, login/signup, Ask EVI chat error handling.

## 🔴 Do these first — needed to actually ship builds

### 0. Payment-flow audit (this is what got Fairshare rejected) — READ THIS
I checked App Store Connect directly. Found the actual bug: **the paywall promises "7 days free" but none of the 6 subscription products have a Free Trial (Introductory Offer) configured in ASC** — "Introductory Offers (0)" on every one. That means a real user tapping "Start 7-Day Free Trial" would've been charged immediately, with zero trial — a direct mismatch between what the screen says and what actually happens. This is a textbook Guideline 2.3.1 / 3.1.2 rejection, and almost certainly what happened with Fairshare.

I fixed the app code so it can't lie about this anymore: the paywall now only shows trial copy when RevenueCat reports the product actually has an intro offer. Right now that means it truthfully shows "Subscribe to [Plan]" with no trial claim — safe to submit, but you lose the trial as a conversion tool until you configure one.

**Decided: adding the real 7-day free trial (option a).** In progress —

- ✅ **Property Pro Monthly** — 7-day free trial confirmed LIVE (all 175 countries, no end date)
- ⬜ **Property Pro Annual** — not yet done
- ⬜ **Household Monthly** — not yet done
- ⬜ **Household Annual** — not yet done
- ⬜ **Solo Monthly** — not yet done
- ⬜ **Solo Annual** — not yet done

To finish the remaining 5: go to App Store Connect → EVI Home app → Distribution → Subscriptions → EVII Home Plans → click each subscription name → click the blue **+** next to "Subscription Prices" → **Create Introductory Offer** → leave all countries checked → Next → Start Date: today, End Date: "No End Date" → Next → choose **Free**, duration **1 Week** → Next → **Confirm**. ~1 minute each, same steps for all 5.

Also fixed while I was in there: the paywall was showing hardcoded prices from the app instead of Apple's live price for the user's actual country/currency (now uses the live price when available); a failed purchase used to fail silently with no error shown to the user (now shows an alert); and there were no Terms of Use / Privacy Policy links on the paywall, which Apple's subscription guideline requires — added, pointing at `jdnorth.co/evi/terms` and `/privacy` (still needs those actually hosted — see item 4 below).

**Also found (separate, blocks submission either way):** each of the 6 subscriptions in ASC has an empty "Review Screenshot" field under Review Information — Apple requires one screenshot per subscription group showing the purchase screen before you can submit for review. I can't generate this myself (it has to be a real screenshot of the running app); once you have a TestFlight build, screenshot the Paywall screen and upload it there.

**Not an issue:** double-checked "In-App Purchases" in ASC — it's empty, no stray Lifetime/one-time product exists. Only the 6 correct subscriptions are there.

### 1. Rotate the OpenAI API key (if you haven't already)
- Go to https://platform.openai.com/api-keys
- If "EVI Mobile" key is still active and hasn't leaked anywhere, you can skip this
- Otherwise: delete it, create a new one named "EVI Mobile v2", copy it, paste it here
- ⏱ 2 min

### 2. ~~Generate an Expo access token~~ — DONE
Token received and verified — EAS project `@jduff_75/evi-app` confirmed linked. Still blocked on iOS build **credentials** (separate from the token): run `npx eas-cli credentials -p ios` yourself and log into your Apple ID when prompted — I won't do that step myself (won't enter your Apple password), see below.

### 3. Create the app in Google Play Console (if targeting Android at launch)
- Go to https://play.google.com/console/developers/apps
- Click **Create app** → name **EVI - Your House Manager**, English (US), App, Free (subscriptions are IAP)
- Then create a Google Play service account JSON key (Play Console → Setup → API access) and send it to me so I can wire Android submissions and RevenueCat Play Store products
- ⏱ 15 min
- Skip this for now if you're launching iOS-only first

---

## 🟡 Important — do this week

### 4. Host Privacy Policy + Terms
- Files are ready: `/legal/PRIVACY_POLICY.md` and `/legal/TERMS_OF_SERVICE.md`
- Pick one: Termly.com generator (free, fastest), `jdnorth.co/evi/privacy`+`/terms` (best), or GitHub Pages (free)
- Send me the URLs and I'll update `store-listing/APP_STORE_LISTING.md`
- ⏱ 15 min

### 5. Enable Google Vision API
- https://console.cloud.google.com/apis/library/vision.googleapis.com?project=evi-house-manager
- Click **Enable** — improves document scanning accuracy
- ⏱ 30 sec

### 6. Buy a domain (if you don't have one for EVI yet)
- Suggestions: `evi.app`, `getevi.com`, `useevi.com`, `evihome.app`
- Point it at the landing page, use it as your App Store marketing URL
- ⏱ 10 min

---

## 🟢 Nice to have — before public launch

### 7. Take App Store screenshots
- Once a TestFlight build is ready, install on your phone and screenshot: dashboard, ask, vault, calendar, checklists, pricing
- Add device frame + tagline in Canva
- ⏱ 1–2 hours

### 8. Enable Family Sharing on iOS subscriptions
- In App Store Connect, toggle Family Sharing ON for each of the 6 subscription products
- ⏱ 5 min

---

## 📊 What's built (for your reference)

- ✅ Firebase project fully configured (Auth, Firestore, Storage, security rules)
- ✅ 3 Cloud Functions (Ask EVI, Document Analysis + ID/card expiration extraction, auto-trigger on upload)
- ✅ 17 screens including Dashboard, Vault, Ask, Calendar, Checklists, Profile, Paywall, and more
- ✅ Full pricing: Free, Solo ($9.99/mo, $99.99/yr), Household ($19.99/mo, $199.99/yr), Property Pro ($39.99/mo, $399.99/yr) — no Lifetime tier. Free trial claim is now gated on a real ASC Introductory Offer (not yet configured — see item 0)
- ✅ RevenueCat entitlements + offering fully wired to real App Store Connect products
- ✅ Move-In / Move-Out / Adulting-101 checklists
- ✅ Identification & card document tracking with AI-extracted expiration reminders
- ✅ Referral program, document scanner, Privacy Policy + Terms of Service, marketing landing page
- ✅ Zero TypeScript errors

## 💰 Revenue math at current pricing

*(Corrected 2026-09-28 — the previous version had the annual-subscriber counts inverted: annual plans pay ~17% less per effective month, so hitting the same MRR takes MORE annual subscribers than monthly ones, not fewer. Also fixed the Property Pro monthly figure, which a Claude Code review caught.)*

To hit **$100k MRR** you need any combo of:
- ~10,010 Solo monthly (or ~12,001 Solo annual) subscribers, **or**
- ~5,003 Household monthly (or ~6,000 Household annual) subscribers, **or**
- ~2,501 Property Pro monthly (or ~3,000 Property Pro annual) subscribers

**Realistic mixed early target:** 2,000 Solo + 800 Household + 100 Pro (monthly plans) ≈ **$40k MRR** from ~2,900 users — a more approachable milestone than $100k on day one.

---

**Send me the Expo access token (item #2) and I can trigger the first real TestFlight build today.**
