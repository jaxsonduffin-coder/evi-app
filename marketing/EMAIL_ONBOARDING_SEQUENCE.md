# EVI — Email Onboarding & Lifecycle Sequence

Ready to paste into any ESP (Mailchimp, Klaviyo, Loops, etc). Each email lists the trigger, delay, subject line options, and body copy. Personalization tokens use `{{firstName}}` — swap for your ESP's syntax.

Send from: **EVI Team <hello@jdnorth.co>** (or a personal-feeling address like `jaxson@evihome.app` if you set one up — first-person "founder" emails outperform generic brand emails for a new app).

---

## 1. Welcome Email
**Trigger:** Immediately after signup
**Goal:** Confirm the account, set expectations, get them back into the app fast

**Subject options:**
- Welcome to EVI, {{firstName}} 👋
- You're in — here's how EVI works
- Let's get your household organized

**Body:**

> Hey {{firstName}},
>
> Welcome to EVI — I built this to be the one place your family (or your properties) can keep everything that matters: documents, dates, tasks, and the questions you'd normally have to dig through paperwork to answer.
>
> Here's what to do first, takes about 2 minutes:
>
> 1. **Upload one document** — a lease, warranty, insurance card, whatever's closest. EVI reads it automatically and files it for you.
> 2. **Ask EVI a question** — try "when does my [document] expire?" and watch it answer instantly.
> 3. **Invite your household** — everyone stays on the same page without a group text.
>
> [Open EVI →]
>
> Questions? Just reply to this email — I read every one.
>
> — Jaxson, EVI

---

## 2. First Upload Nudge
**Trigger:** 24 hours after signup, IF no document has been uploaded
**Goal:** Get to first "aha" moment (AI reading a real document)

**Subject options:**
- Quick one — have 60 seconds?
- The fastest way to see what EVI can do
- Still have that lease/warranty on your phone?

**Body:**

> Hey {{firstName}},
>
> Noticed you haven't uploaded anything to EVI yet — totally fine, just wanted to make it easy.
>
> Grab your phone, snap a photo of any document lying around (insurance card, appliance manual, lease, utility bill), and drop it in EVI. It'll read it, file it, and remember the details so you never have to dig through a drawer again.
>
> [Upload a document →]
>
> This is the moment EVI clicks for most people — give it a shot.
>
> — Jaxson

---

## 3. Household Setup / Invite Nudge
**Trigger:** 3 days after signup, IF household has only 1 member
**Goal:** Drive the invite loop (biggest lever for retention + referral growth)

**Subject options:**
- EVI works better with your whole household
- Add your partner/roommate to EVI (30 seconds)
- Stop being the only one who knows where things are

**Body:**

> Hey {{firstName}},
>
> Right now you're the only one in your EVI household — which means you're still the one person who has to remember everything.
>
> Invite your partner, roommate, or family member and everyone can see the same documents, tasks, and important dates. No more "wait, where's the wifi password" texts.
>
> [Send an invite →]
>
> Takes 10 seconds — EVI generates a link, you send it however you want (text, email, whatever).
>
> — Jaxson

---

## 4. Feature Discovery — Important Dates
**Trigger:** 5 days after signup
**Goal:** Surface a feature they may not have found, deepen habit

**Subject options:**
- Never forget another birthday
- One less thing to remember
- The feature people miss when they first sign up

**Body:**

> Hey {{firstName}},
>
> Quick tip: EVI can track birthdays, anniversaries, and any other date that matters to your household — and it'll remind you a few days ahead so you're never scrambling for a card.
>
> [Add your first important date →]
>
> Small thing, but it's one of those features that quietly saves you every year.
>
> — Jaxson

---

## 5. Value Recap / Social Proof
**Trigger:** 7 days after signup
**Goal:** Reinforce value, plant the upgrade seed softly (no hard pitch yet)

**Subject options:**
- One week in — how's EVI working for you?
- Here's everything EVI has organized for you so far
- A week with EVI

**Body:**

> Hey {{firstName}},
>
> You've been using EVI for a week now. Here's what it's already doing for your household:
>
> - Documents filed and searchable, no more folders
> - Instant answers to "when does X expire / how do I fix Y"
> - Tasks and dates everyone in your household can see
>
> If you've got more than one property, more storage needs, or want the full AI assistant unlocked, EVI Pro/Household plans open up more room and more members. No pressure — just letting you know it's there when you need it.
>
> [See plans →]
>
> — Jaxson
>
> P.S. If EVI's been helpful, forwarding this to a friend who's drowning in paperwork is the best compliment I could ask for. [Share your invite link →]

---

## 6. Trial/Upgrade Nudge (Free tier, active users)
**Trigger:** 10-14 days after signup, IF user is on Free tier AND has uploaded 3+ documents or asked 3+ questions (i.e., engaged but not paying)
**Goal:** Convert an engaged free user

**Subject options:**
- You're getting the most out of EVI — want more room?
- Your household is close to outgrowing the free plan
- Unlock the rest of EVI

**Body:**

> Hey {{firstName}},
>
> You've clearly found EVI useful — nice work getting your household set up. Wanted to flag that the free plan has some limits (storage, household members, AI questions per month), and it looks like you're getting close.
>
> Upgrading gets you:
>
> - Unlimited document storage
> - Up to 10 household members
> - Unlimited AI questions
> - Priority document processing
>
> [See plans & pricing →]
>
> — Jaxson

---

## 7. Re-engagement (Inactive Users)
**Trigger:** 14 days of no app activity
**Goal:** Win back a lapsed user before they churn entirely

**Subject options:**
- Everything okay? Your EVI household is waiting
- We kept your documents safe — come back anytime
- {{firstName}}, still there?

**Body:**

> Hey {{firstName}},
>
> Noticed it's been a couple weeks since you opened EVI. No worries — life gets busy. Just wanted you to know everything you've already added is still there, safe and organized, whenever you need it.
>
> If something wasn't working for you, or you got stuck somewhere, just reply and tell me — I actually read these and I'll help directly.
>
> [Open EVI →]
>
> — Jaxson

---

## Notes on Sending

- **Timing:** Emails 2-4 should only fire if the trigger condition is still true at send time (don't nag someone who already uploaded a document or invited their household — skip that email for them).
- **Tone:** First-person, founder-voice, no corporate "Dear Valued Customer" language. This matches EVI's brand and performs better for an early-stage app.
- **Unsubscribe:** Every email needs a working unsubscribe link (CAN-SPAM/GDPR requirement) — most ESPs add this automatically.
- **Suppress on conversion:** Once someone upgrades to a paid plan, pull them out of emails 5-6 and drop them into a separate (future) "paid customer" track instead.
- **A/B test subject lines:** Each email above has 2-3 subject options — test them once you have enough volume (50+ sends/day) to get a signal.
