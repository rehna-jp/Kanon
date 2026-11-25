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
    // Use openai/gpt-oss-120b or env override
    this.model = model || process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
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
      response_format: { type: 'json_object' },
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
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    return this.parseResponse(content);
  }
}
