---
app: Signup Form
url: http://localhost:3000
agent: openai
tech: express-html
max_retries: 5
---

# Signup Form

A signup form with validation, demonstrating the full kane-spec loop.

## Flow: Page loads with signup form
Go to the app. I should see a heading that says "Sign Up" and a form with fields for name, email, and password.

## Flow: Successful signup
Go to the app. Enter "Alice" in the name field. Enter "alice@example.com" in the email field. Enter "password123" in the password field. Click the "Sign Up" button. I should see a success message like "Welcome, Alice" or "Account created".

## Flow: Empty form shows validation errors
Go to the app. Leave all fields empty. Click the "Sign Up" button. I should see error messages indicating that the fields are required.

## Flow: Invalid email shows error
Go to the app. Enter "Bob" in the name field. Enter "not-an-email" in the email field. Enter "password123" in the password field. Click the "Sign Up" button. I should see an error message about the email being invalid.
