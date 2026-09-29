# RevenueCat Product IDs

**Status: DONE.** All products, entitlements, and the offering below are already created and live in App Store Connect + RevenueCat as of 2026-09-27. This doc is kept for reference only.

## Products (created in App Store Connect)

| Product ID | Display Name | Price | Duration | RC Package Key |
|-----------|--------------|-------|----------|----------------|
| `com.jdnorth.evi.solo.monthly` | Solo Monthly | $9.99 | 1 month | `solo_monthly` |
| `com.jdnorth.evi.solo.annual` | Solo Annual | $99.99 | 1 year | `solo_annual` |
| `com.jdnorth.evi.household.monthly` | Household Monthly | $19.99 | 1 month | `household_monthly` |
| `com.jdnorth.evi.household.annual` | Household Annual | $199.99 | 1 year | `household_annual` |
| `com.jdnorth.evi.pro.monthly` | Property Pro Monthly | $39.99 | 1 month | `pro_monthly` |
| `com.jdnorth.evi.pro.annual` | Property Pro Annual | $399.99 | 1 year | `pro_annual` |

No Lifetime / one-time-purchase tier exists anywhere — intentionally excluded, do not add one.

## Trial config (all monthly + annual subscriptions)

- **Free trial**: 7 days
- **Introductory offer**: Trial ends → charged full price
- **Family Sharing**: Enable for all 6 subscription products (Solo M/A, Household M/A, Pro M/A)

## Entitlements configured in RevenueCat

1. Entitlement **`solo`** — attached to: `com.jdnorth.evi.solo.monthly`, `com.jdnorth.evi.solo.annual`
2. Entitlement **`household`** — attached to: `com.jdnorth.evi.household.monthly`, `com.jdnorth.evi.household.annual`
3. Entitlement **`pro`** — attached to: `com.jdnorth.evi.pro.monthly`, `com.jdnorth.evi.pro.annual`

(App code in `subscriptionService.ts` checks these three entitlement names directly — `solo`, `household`, `pro` — so they must stay exactly as-is.)

## Offering

Single offering: **`default`** ("The standard set of packages"), with all 6 packages above attached and pointed at their App Store Connect products. This is what `PaywallScreen.tsx` reads via `offerings?.[pkgKey]` where `pkgKey = ${tier}_${interval}` (e.g. `solo_monthly`).

## Still needed

- **Google Play products**: only the App Store (iOS) side has been created and wired. If launching Android, create the matching 6 products in Google Play Console → Monetize → Products with the same prices/durations, and add them to the same RevenueCat entitlements/offering.
