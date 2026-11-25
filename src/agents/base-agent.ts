/**
 * base-agent.ts
 * 
 * Abstract base class for AI coding agents.
 * Each agent can generate and fix code based on specs and Kane failure reports.
 */

export interface AgentResponse {
  files: FileWrite[];
  explanation: string;
  dependencies?: string[];
}

export interface FileWrite {
  path: string;
  content: string;
}

export interface AgentContext {
  appName: string;
  techStack: string;
  specContent: string;
  failureReport?: string;
  currentFiles?: Record<string, string>;
  iteration: number;
}

export abstract class BaseAgent {
  abstract name: string;

  /**
   * Generate the initial app from a spec.
   */
  abstract generate(context: AgentContext): Promise<AgentResponse>;

  /**
   * Fix the app based on Kane CLI failure reports.
   */
  abstract fix(context: AgentContext): Promise<AgentResponse>;

  /**
   * Build the system prompt for code generation.
   */
  protected buildSystemPrompt(): string {
    return `You are a senior full-stack developer. You write clean, production-ready code.

RULES:
1. Return ONLY valid JSON. No markdown, no explanation outside the JSON.
2. The JSON must have this exact shape:
   {
     "files": [
       { "path": "relative/path/to/file", "content": "full file content" }
     ],
     "explanation": "brief explanation of what you built or changed",
     "dependencies": ["package-name"]
   }
3. Include ALL files needed for the app to run (package.json, index files, HTML, CSS, server code).
4. The app must start with "npm install && npm start" and serve on port 3000.
5. Use simple, standard tech. No complex build pipelines.
6. Every page must have clear, semantic HTML with proper labels, IDs, and aria attributes.
7. Forms must have visible labels, proper name attributes, and clear submit buttons.
8. Include proper error handling and form validation.
9. Make the UI visually stunning, modern, and perfectly centered:
   - Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
   - Layout MUST be centered horizontally and start with comfortable top padding: <body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col items-center pt-12 pb-20 px-4"> with a centered container <div class="max-w-4xl w-full mx-auto">. Do NOT use justify-center on the body as that pushes content down.
   - Use polished dark-mode aesthetics: slate-900 card backgrounds, subtle borders (border border-slate-800), rounded-2xl corners, glowing accent buttons (bg-indigo-600 hover:bg-indigo-500), and crisp typography.`;
  }

  /**
   * Build the generation prompt.
   */
  protected buildGeneratePrompt(context: AgentContext): string {
    return `Build a web application based on this specification:

APP NAME: ${context.appName}
TECH STACK: ${context.techStack}

SPECIFICATION (these are the user flows that must work):
${context.specContent}

Requirements:
- The app must serve on http://localhost:3000
- Every flow described above must be testable in a real browser
- Use clear, visible text, labels, and buttons
- Include proper form validation with visible error messages
- Make the UI clean and functional

Return the complete app as JSON with all files.`;
  }

  /**
   * Build the fix prompt with Kane failure context.
   */
  protected buildFixPrompt(context: AgentContext): string {
    // Filter current files: skip large assets or metadata, only include code
    const filteredFiles: Record<string, string> = {};
    for (const [p, c] of Object.entries(context.currentFiles || {})) {
      if (p.endsWith('.js') || p.endsWith('.html') || p.endsWith('.css') || p === 'package.json') {
        filteredFiles[p] = c;
      }
    }

    return `The app you built has failures detected by Kane CLI (a real browser testing tool).

APP NAME: ${context.appName}
ITERATION: ${context.iteration}

ORIGINAL SPECIFICATION:
${context.specContent}

KANE CLI FAILURE REPORT:
${context.failureReport}

CURRENT FILES:
${Object.entries(filteredFiles)
  .map(([path, content]) => `--- ${path} ---\n${content}`)
  .join('\n\n')}

FIX the code so all flows pass. Kane CLI tests in a real browser, so:
- Elements must be visible and interactable
- Text must literally appear on screen
- Forms must work end to end
- Navigation must be real (not just console logs)

Return the COMPLETE updated files as JSON. Include every file, even unchanged ones.`;
  }

  /**
   * Parse the agent's raw response into structured output.
   */
  protected parseResponse(raw: string): AgentResponse {
    // Try to extract JSON from the response
    let jsonStr = raw.trim();

    // Strip markdown code fences if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Try to find JSON object
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objMatch) {
      jsonStr = objMatch[0];
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return {
        files: parsed.files || [],
        explanation: parsed.explanation || 'No explanation provided',
        dependencies: parsed.dependencies || [],
      };
    } catch (e) {
      throw new Error(`Failed to parse agent response as JSON: ${(e as Error).message}\nRaw: ${raw.slice(0, 500)}`);
    }
  }
}
