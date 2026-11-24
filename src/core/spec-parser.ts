/**
 * spec-parser.ts
 * 
 * Parses a .kanon.md spec file into structured flows.
 * A spec file uses markdown with YAML frontmatter:
 * 
 * ---
 * app: My Todo App
 * url: http://localhost:3000
 * agent: openai          # openai | anthropic | gemini
 * max_retries: 5
 * ---
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

export interface KaneFlow {
  name: string;
  description: string;
  rawText: string;
}

export interface KaneSpec {
  appName: string;
  url: string;
  agent: 'openai' | 'anthropic' | 'gemini' | 'groq';
  maxRetries: number;
  techStack: string;
  flows: KaneFlow[];
  rawContent: string;
  filePath: string;
}

export function parseSpecFile(filePath: string): KaneSpec {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Spec file not found: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);

  const flows = extractFlows(content);

  if (flows.length === 0) {
    throw new Error(
      'No flows found in spec file. Use "## Flow: <name>" headings to define flows.'
    );
  }

  return {
    appName: frontmatter.app || frontmatter.name || 'My App',
    url: frontmatter.url || 'http://localhost:3000',
    agent: validateAgent(frontmatter.agent || 'openai'),
    maxRetries: frontmatter.max_retries || frontmatter.maxRetries || 5,
    techStack: frontmatter.tech || frontmatter.stack || 'react',
    flows,
    rawContent: raw,
    filePath: absolutePath,
  };
}

function extractFlows(content: string): KaneFlow[] {
  const flows: KaneFlow[] = [];
  const lines = content.split('\n');

  let currentFlow: { name: string; lines: string[] } | null = null;

  for (const line of lines) {
    const flowMatch = line.match(/^##\s+Flow:\s*(.+)$/i);

    if (flowMatch) {
      // Save previous flow
      if (currentFlow) {
        flows.push(buildFlow(currentFlow));
      }
      currentFlow = { name: flowMatch[1].trim(), lines: [] };
    } else if (currentFlow) {
      currentFlow.lines.push(line);
    }
  }

  // Save last flow
  if (currentFlow) {
    flows.push(buildFlow(currentFlow));
  }

  return flows;
}

function buildFlow(raw: { name: string; lines: string[] }): KaneFlow {
  const description = raw.lines
    .join('\n')
    .trim();

  return {
    name: raw.name,
    description,
    rawText: `## Flow: ${raw.name}\n${description}`,
  };
}

function validateAgent(agent: string): 'openai' | 'anthropic' | 'gemini' | 'groq' {
  const normalized = agent.toLowerCase().trim();
  if (['openai', 'anthropic', 'gemini', 'groq'].includes(normalized)) {
    return normalized as 'openai' | 'anthropic' | 'gemini' | 'groq';
  }
  console.warn(`Unknown agent "${agent}", defaulting to groq`);
  return 'groq';
}
