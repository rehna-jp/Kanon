/**
 * anthropic-agent.ts
 * 
 * Anthropic Claude agent for code generation and fixing.
 */

import { BaseAgent, AgentContext, AgentResponse } from './base-agent';
import https from 'https';

export class AnthropicAgent extends BaseAgent {
  name = 'anthropic';
  private apiKey: string;
  private model: string;

  constructor(model: string = 'claude-sonnet-4-20250514') {
    super();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(context: AgentContext): Promise<AgentResponse> {
    const content = await this.callAnthropic(
      this.buildSystemPrompt(),
      this.buildGeneratePrompt(context)
    );
    return this.parseResponse(content);
  }

  async fix(context: AgentContext): Promise<AgentResponse> {
    const content = await this.callAnthropic(
      this.buildSystemPrompt(),
      this.buildFixPrompt(context)
    );
    return this.parseResponse(content);
  }

  private callAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        model: this.model,
        max_tokens: 16000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              reject(new Error(`Anthropic API error: ${parsed.error.message}`));
              return;
            }
            const text = parsed.content?.[0]?.text;
            if (!text) {
              reject(new Error('Empty response from Anthropic'));
              return;
            }
            resolve(text);
          } catch (e) {
            reject(new Error(`Failed to parse Anthropic response: ${data.slice(0, 500)}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}
