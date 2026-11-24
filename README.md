<div align="center">

# Kanon

### Write English. Ship Verified.

**Kane CLI is your specification language.**

[![Kane CLI](https://img.shields.io/badge/Verified%20with-Kane%20CLI-blueviolet)](https://www.testmuai.com/kane-cli/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)

</div>

---

**Kanon** turns plain-English specifications into verified, working web applications. Write what your app should do. An AI agent builds it. Kane CLI tests it in a real browser. Failures feed back to the agent. The loop continues until every flow passes.

No code. No test files. Just English specs and a verified app.

```
                    ┌─────────────┐
                    │  .kanon.md  │
                    │  spec file  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  AI Agent   │
                    │ (generates) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
              ┌────▶│  Kane CLI   │
              │     │ (verifies)  │
              │     └──────┬──────┘
              │            │
              │     ┌──────▼──────┐
              │     │  Pass/Fail  │
              │     └──┬──────┬───┘
              │        │      │
              │   FAIL │      │ PASS
              │   ┌────▼──┐   │
              └───│ Agent │   │
                  │ fixes │   │
                  └───────┘   │
                       ┌──────▼──────┐
                       │  ✅ Verified │
                       │    App      │
                       └─────────────┘
```

## Quick Start

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [Kane CLI](https://www.testmuai.com/support/docs/kane-cli-introduction/) installed and logged in
- An API key for OpenAI, Anthropic, or Google Gemini

### Install

```bash
git clone https://github.com/YOUR_USERNAME/kanon.git
cd kanon
npm install
npm run build
```

### Create a spec

```bash
node dist/index.js init --name my-app
```

This creates `my-app.kanon.md`:

```markdown
---
app: my-app
url: http://localhost:3000
agent: openai
tech: express-html
max_retries: 5
---

# my-app

## Flow: Home page loads
Go to the app. I should see a heading with the app name.

## Flow: User can navigate
Go to the app. Click on "About". I should see information about the app.

## Flow: Form works
Go to the app. Click on "Contact". Fill in the name field with "Alice"
and the email field with "alice@example.com". Click "Submit".
I should see a success message.
```

### Run it

```bash
export OPENAI_API_KEY=sk-...
node dist/index.js run my-app.kanon.md --verbose
```

That's it. Kanon will:

1. 🤖 **Generate** a complete web app from your spec using the AI agent
2. 📦 **Install** dependencies and start the server
3. 🧪 **Verify** every flow with Kane CLI in a real browser
4. 🔁 **Fix** any failures by feeding Kane's report back to the agent
5. ✅ **Ship** when every flow passes

## Spec File Format

Spec files are Markdown with YAML frontmatter:

```yaml
---
app: My App          # App name
url: http://localhost:3000  # Where the app serves
agent: openai        # openai | anthropic | gemini
tech: express-html   # Tech stack hint for the agent
max_retries: 5       # Max fix iterations
---
```

Flows are defined with `## Flow:` headings:

```markdown
## Flow: User can sign up
Go to the signup page. Enter "alice" as username and "test@example.com" as email.
Click the submit button. I should see "Welcome, alice" on the screen.
```

Each flow becomes a Kane CLI verification run. Plain English in, pass/fail out.

## Commands

| Command | Description |
|---------|-------------|
| `kanon run <file>` | Generate app from spec, verify with Kane, fix until green |
| `kanon verify <file>` | Verify a running app against a spec (no generation) |
| `kanon init [--name]` | Create a sample spec file |

### Options for `run`

| Flag | Default | Description |
|------|---------|-------------|
| `-p, --port <n>` | `3000` | Port for the app server |
| `--headless` | `false` | Run Kane CLI headlessly |
| `-v, --verbose` | `false` | Detailed output with failure reports |
| `-o, --output <dir>` | `.` | Where to write reports |

## Output

After a run, Kanon produces:

- **`kane-verified.json`** — Machine-readable verification manifest
- **`VERIFICATION_REPORT.md`** — Human-readable report with flow results

## The Closed Loop

What makes Kanon different from "run tests after building":

1. **Kane CLI IS the spec.** There's no translation from requirements to tests. The spec file IS both.
2. **The agent never sees the browser.** It only sees Kane's pass/fail output. Kane is the sole source of truth.
3. **No human in the loop.** Spec → agent → code → Kane → failure report → agent → fix → Kane → … until green.
4. **Real browser, not mocks.** Kane CLI runs in Chrome. If it passes, it works.

## Examples

See the [`examples/`](examples/) directory:

- [`todo.kanon.md`](examples/todo.kanon.md) — A simple todo app (4 flows)
- [`signup.kanon.md`](examples/signup.kanon.md) — Signup form with validation (4 flows)
- [`checkout.kanon.md`](examples/checkout.kanon.md) — E-commerce checkout (6 flows)

## Agent Support

| Agent | API Key Env Var | Model |
|-------|----------------|-------|
| OpenAI | `OPENAI_API_KEY` | gpt-4o |
| Anthropic | `ANTHROPIC_API_KEY` | claude-sonnet-4 |
| Gemini | `GEMINI_API_KEY` | gemini-2.5-flash |

Set the agent in your spec's frontmatter:

```yaml
agent: openai     # or anthropic, gemini
```

## How It Works

```
1. PARSE     → Read .kanon.md, extract frontmatter + flows
2. GENERATE  → Send spec to AI agent, get back file contents
3. SCAFFOLD  → Write files, npm install, start server
4. VERIFY    → Run each flow through kane-cli run --agent
5. DIAGNOSE  → Parse NDJSON output, build failure report
6. FIX       → Send failures + current code to agent
7. REPEAT    → Steps 3-6 until all pass or max retries
8. REPORT    → Write kane-verified.json + VERIFICATION_REPORT.md
```

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Verify with Kanon
  run: |
    npm install -g @testmuai/kane-cli
    kane-cli login --username ${{ secrets.KANE_USER }} --access-key ${{ secrets.KANE_KEY }}
    node dist/index.js verify my-app.kanon.md --headless
```

## Built for the Kane CLI Hackathon

This project was built for the [Kane CLI Online Hackathon](https://www.kaneclihack.sh/) (Nov 12–26, 2026).

**The idea:** Most people treat Kane CLI as a testing tool. Kanon treats it as a **specification language**. The spec IS the test. The test IS the spec. There's nothing else.

## License

MIT
