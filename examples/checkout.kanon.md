---
app: Self-Healing Checkout
url: http://localhost:3000
agent: openai
tech: express-html
max_retries: 7
---

# Self-Healing Checkout

A checkout that deliberately introduces bugs, then heals itself.
This demonstrates kane-spec's power: the agent builds, Kane finds the break, the agent fixes.

## Flow: Product page loads
Go to the app. I should see at least one product with a name, a price, and an "Add to Cart" button.

## Flow: Add item to cart
Go to the app. Click the "Add to Cart" button on the first product. I should see a cart indicator showing 1 item.

## Flow: View cart
Go to the app. Click "Add to Cart" on a product. Then click on the "Cart" link or icon. I should see the product name and price in my cart.

## Flow: Checkout form
Go to the app. Click "Add to Cart" on a product. Click "Cart". Click "Checkout". I should see a checkout form with fields for name, email, and card number.

## Flow: Complete purchase
Go to the app. Click "Add to Cart" on a product. Click "Cart". Click "Checkout". Enter "Jane Doe" for name, "jane@example.com" for email, and "4111111111111111" for card number. Click "Place Order". I should see an order confirmation with a message like "Thank you" or "Order confirmed".

## Flow: Empty cart checkout prevented
Go to the app. Click "Cart" without adding any items. I should see a message like "Your cart is empty" and should not be able to proceed to checkout.
