/**
 * groq-agent.ts
 * 
 * Free and ultra-fast inference using Groq (Llama 3.3 70B / Llama 3.1 70B).
 * Fully OpenAI API compatible.
 */

import OpenAI from 'openai';
import { BaseAgent, AgentContext, AgentResponse } from './base-agent';

export class GroqAgent extends BaseAgent {
  name = 'groq';
  private client: OpenAI;
  private model: string;

  constructor(model?: string) {
    super();
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required. Get a free key at https://console.groq.com');
    }
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
    // Use llama-3.1-8b-instant (fast, high TPM) or env override
    this.model = model || process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  }

  async generate(context: AgentContext): Promise<AgentResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: this.buildSystemPrompt() },
        { role: 'user', content: this.buildGeneratePrompt(context) },
      ],
      temperature: 0.2,
      max_tokens: 6000,
      // No response_format: json_object — avoids server-side JSON validation
      // which causes 400 errors when the response is long. We parse manually.
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    return this.parseResponse(content);
  }

  async fix(context: AgentContext): Promise<AgentResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: this.buildSystemPrompt() },
        { role: 'user', content: this.buildFixPrompt(context) },
      ],
      temperature: 0.1,
      max_tokens: 6000,
      // No response_format: json_object — same reason as generate()
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    return this.parseResponse(content);
  }
}
