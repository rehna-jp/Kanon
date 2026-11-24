---
app: Todo App
url: http://localhost:3000
agent: groq
tech: express-html
max_retries: 5
---

# Todo App

A simple todo application to demonstrate kane-spec.

## Flow: Home page loads with title
Go to the app. I should see a heading that says "Todo App".

## Flow: User can add a todo
Go to the app. Type "Buy groceries" into the input field. Click the "Add" button. I should see "Buy groceries" in the todo list.

## Flow: User can add multiple todos
Go to the app. Type "Walk the dog" into the input field. Click the "Add" button. Type "Read a book" into the input field. Click the "Add" button. I should see both "Walk the dog" and "Read a book" in the list.

## Flow: Empty input shows validation
Go to the app. Leave the input field empty. Click the "Add" button. I should see an error message or the input should be highlighted. No empty todo should appear in the list.
