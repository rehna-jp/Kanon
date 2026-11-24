---
app: Apex SaaS Platform
url: http://localhost:3000
agent: groq
tech: express-html-tailwind
max_retries: 5
---

# Apex SaaS Platform

A sleek SaaS pricing and checkout experience with interactive plan toggling, live coupon calculation, and billing verification.

## Flow: Pricing page displays plans and monthly toggle
Go to the app. I should see three pricing tiers: "Starter", "Pro", and "Enterprise". The billing toggle should default to "Monthly".

## Flow: Annual billing toggle applies discount
Go to the app. Click on the "Annual" billing toggle. The prices should update to reflect yearly savings, and I should see a "Save 20%" badge appear.

## Flow: Select plan and open checkout
Go to the app. Click "Get Started" on the "Pro" plan card. I should see a checkout modal open with an order form.

## Flow: Apply promo coupon code
Go to the app. Click "Get Started" on the "Pro" plan. In the checkout drawer, enter "KANE2026" into the coupon field and click "Apply". I should see a success message and the total price should be discounted.

## Flow: Complete subscription checkout
Go to the app. Click "Get Started" on the "Pro" plan. Fill in the name field with "Alex Chen", the email field with "alex@company.com", and card number with "4242424242424242". Click "Complete Order". I should see a confirmation screen with an order receipt and "Subscription Active".
