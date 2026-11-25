---
app: Apex SaaS
url: http://localhost:3000
agent: groq
tech: express-html-tailwind-single-page
max_retries: 5
---

# Apex SaaS

A modern single-page SaaS pricing and checkout app with annual discounts and verified order validation.

## Flow: Pricing page displays plans and toggle
Go to the app. I should see pricing tiers including "Starter" and "Pro". The billing toggle should default to "Monthly".

## Flow: Annual billing toggle updates pricing
Go to the app. Click on the "Annual" billing toggle. The prices should update to reflect yearly savings, and I should see a "Save 20%" badge appear.

## Flow: Checkout form validates required fields
Go to the app. Click "Get Started" on the "Pro" plan card to open the checkout modal. Leave the name and email fields empty. Click "Complete Order". I should see validation error messages indicating that the fields are required.
