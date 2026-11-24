/**
 * Agent factory — creates the right agent based on the spec config.
 */

import { BaseAgent } from './base-agent';
import { OpenAIAgent } from './openai-agent';
import { AnthropicAgent } from './anthropic-agent';
import { GeminiAgent } from './gemini-agent';

export function createAgent(type: 'openai' | 'anthropic' | 'gemini'): BaseAgent {
  switch (type) {
    case 'openai':
      return new OpenAIAgent();
    case 'anthropic':
      return new AnthropicAgent();
    case 'gemini':
      return new GeminiAgent();
    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}

export { BaseAgent, AgentContext, AgentResponse, FileWrite } from './base-agent';
