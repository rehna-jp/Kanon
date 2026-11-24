/**
 * Agent factory — creates the right agent based on the spec config.
 */

import { BaseAgent } from './base-agent';
import { OpenAIAgent } from './openai-agent';
import { AnthropicAgent } from './anthropic-agent';
import { GeminiAgent } from './gemini-agent';
import { GroqAgent } from './groq-agent';

export function createAgent(type: 'openai' | 'anthropic' | 'gemini' | 'groq'): BaseAgent {
  switch (type) {
    case 'openai':
      return new OpenAIAgent();
    case 'anthropic':
      return new AnthropicAgent();
    case 'gemini':
      return new GeminiAgent();
    case 'groq':
      return new GroqAgent();
    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}

export { BaseAgent, AgentContext, AgentResponse, FileWrite } from './base-agent';
export { GroqAgent } from './groq-agent';
