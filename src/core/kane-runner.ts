/**
 * kane-runner.ts
 * 
 * Executes Kane CLI flows against a running app and parses results.
 * Uses --agent flag for structured NDJSON output.
 */

import { spawn, ChildProcess } from 'child_process';
import { KaneFlow } from './spec-parser';

export interface KaneEvent {
  event: string;
  status?: string;
  action?: string;
  detail?: string;
  error?: string;
  exit_code?: number;
  evidence_url?: string;
  timestamp?: string;
  objective?: string;
  [key: string]: any;
}

export interface KaneResult {
  flow: KaneFlow;
  passed: boolean;
  exitCode: number;
  events: KaneEvent[];
  error?: string;
  evidenceUrl?: string;
  rawOutput: string;
  duration: number;
}

export interface KaneRunnerOptions {
  headless?: boolean;
  timeout?: number;  // ms
  url?: string;
}

export class KaneRunner {
  private options: Required<KaneRunnerOptions>;

  constructor(options: KaneRunnerOptions = {}) {
    this.options = {
      headless: options.headless ?? false,
      timeout: options.timeout ?? 120_000,
      url: options.url ?? 'http://localhost:3000',
    };
  }

  /**
   * Run a single flow through Kane CLI and return structured results.
   */
  async runFlow(flow: KaneFlow): Promise<KaneResult> {
    const startTime = Date.now();
    const events: KaneEvent[] = [];
    let rawOutput = '';

    // Build the objective: prepend the URL context
    const objective = `Go to ${this.options.url}. ${flow.description}`;

    const args = ['run', objective, '--agent'];
    if (this.options.headless) {
      args.push('--headless');
    }

    return new Promise<KaneResult>((resolve) => {
      const proc: ChildProcess = spawn('kane-cli', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      let killed = false;

      const timer = setTimeout(() => {
        killed = true;
        proc.kill('SIGTERM');
      }, this.options.timeout);

      proc.stdout?.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        rawOutput += text;

        // Parse NDJSON lines
        const lines = text.split('\n').filter((l: string) => l.trim());
        for (const line of lines) {
          try {
            const event: KaneEvent = JSON.parse(line);
            events.push(event);
          } catch {
            // Not JSON, store as raw
          }
        }
      });

      proc.stderr?.on('data', (chunk: Buffer) => {
        rawOutput += chunk.toString();
      });

      proc.on('close', (code: number | null) => {
        clearTimeout(timer);
        const duration = Date.now() - startTime;

        const runEnd = events.find((e) => e.event === 'run_end');
        const passed = killed ? false : (runEnd?.status === 'pass' || code === 0);
        const error = killed
          ? 'Timeout: Kane CLI did not complete in time'
          : runEnd?.error || (code !== 0 ? `Kane CLI exited with code ${code}` : undefined);

        resolve({
          flow,
          passed,
          exitCode: code ?? 1,
          events,
          error,
          evidenceUrl: runEnd?.evidence_url,
          rawOutput,
          duration,
        });
      });

      proc.on('error', (err: Error) => {
        clearTimeout(timer);
        resolve({
          flow,
          passed: false,
          exitCode: 2,
          events,
          error: `Failed to run Kane CLI: ${err.message}`,
          rawOutput,
          duration: Date.now() - startTime,
        });
      });
    });
  }

  /**
   * Run all flows sequentially and return all results.
   */
  async runAllFlows(flows: KaneFlow[]): Promise<KaneResult[]> {
    const results: KaneResult[] = [];
    for (const flow of flows) {
      const result = await this.runFlow(flow);
      results.push(result);
    }
    return results;
  }

  /**
   * Build a human-readable failure report for the agent.
   */
  static buildFailureReport(results: KaneResult[]): string {
    const failures = results.filter((r) => !r.passed);
    if (failures.length === 0) return '';

    let report = `## Kane CLI Verification Failures\n\n`;
    report += `${failures.length} of ${results.length} flows failed.\n\n`;

    for (const f of failures) {
      report += `### ❌ ${f.flow.name}\n`;
      report += `**Objective:** ${f.flow.description}\n\n`;
      report += `**Error:** ${f.error || 'Unknown failure'}\n`;
      report += `**Exit code:** ${f.exitCode}\n`;
      report += `**Duration:** ${(f.duration / 1000).toFixed(1)}s\n`;

      // Include relevant step events for debugging context
      const stepEvents = f.events.filter(
        (e) => e.event === 'step' && e.status === 'failed'
      );
      if (stepEvents.length > 0) {
        report += `\n**Failed steps:**\n`;
        for (const se of stepEvents) {
          report += `- ${se.action || 'step'}: ${se.detail || se.error || 'failed'}\n`;
        }
      }

      if (f.evidenceUrl) {
        report += `\n**Evidence:** ${f.evidenceUrl}\n`;
      }

      report += '\n---\n\n';
    }

    return report;
  }
}
