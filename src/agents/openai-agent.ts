/**
 * openai-agent.ts
 * 
 * OpenAI GPT-4o agent for code generation and fixing.
 */

import OpenAI from 'openai';
import { BaseAgent, AgentContext, AgentResponse } from './base-agent';

export class OpenAIAgent extends BaseAgent {
  name = 'openai';
  private client: OpenAI;
  private model: string;

  constructor(model: string = 'gpt-4o') {
    super();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generate(context: AgentContext): Promise<AgentResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: this.buildSystemPrompt() },
        { role: 'user', content: this.buildGeneratePrompt(context) },
      ],
      temperature: 0.3,
      max_tokens: 16000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
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
      temperature: 0.2,
      max_tokens: 16000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return this.parseResponse(content);
  }
}
