/**
 * gemini-agent.ts
 * 
 * Google Gemini agent for code generation and fixing.
 */

import { BaseAgent, AgentContext, AgentResponse } from './base-agent';
import https from 'https';

export class GeminiAgent extends BaseAgent {
  name = 'gemini';
  private apiKey: string;
  private model: string;

  constructor(model: string = 'gemini-2.5-flash') {
    super();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(context: AgentContext): Promise<AgentResponse> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildGeneratePrompt(context);
    const content = await this.callGemini(systemPrompt, userPrompt);
    return this.parseResponse(content);
  }

  async fix(context: AgentContext): Promise<AgentResponse> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildFixPrompt(context);
    const content = await this.callGemini(systemPrompt, userPrompt);
    return this.parseResponse(content);
  }

  private callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: userPrompt }] },
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 16000,
          responseMimeType: 'application/json',
        },
      });

      const path = `/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              reject(new Error(`Gemini API error: ${parsed.error.message}`));
              return;
            }
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
              reject(new Error(`Empty response from Gemini: ${data.slice(0, 500)}`));
              return;
            }
            resolve(text);
          } catch (e) {
            reject(new Error(`Failed to parse Gemini response: ${data.slice(0, 500)}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}
