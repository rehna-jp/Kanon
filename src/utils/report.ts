/**
 * report.ts
 * 
 * Generates a kane-verified.json manifest and markdown report
 * after a successful (or failed) run.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EngineResult } from '../core/engine';

export interface VerificationManifest {
  app: string;
  verified: boolean;
  timestamp: string;
  agent: string;
  iterations: number;
  flows: {
    name: string;
    passed: boolean;
    duration: number;
    error?: string;
    evidenceUrl?: string;
  }[];
}

export function generateManifest(result: EngineResult): VerificationManifest {
  return {
    app: result.spec.appName,
    verified: result.success,
    timestamp: new Date().toISOString(),
    agent: result.spec.agent,
    iterations: result.totalIterations,
    flows: result.finalResults.map((r) => ({
      name: r.flow.name,
      passed: r.passed,
      duration: r.duration,
      error: r.error,
      evidenceUrl: r.evidenceUrl,
    })),
  };
}

export function generateReport(result: EngineResult): string {
  const status = result.success ? '✅ VERIFIED' : '❌ NOT VERIFIED';
  const passCount = result.finalResults.filter((r) => r.passed).length;
  const totalCount = result.finalResults.length;

  let report = `# Kane-Spec Verification Report\n\n`;
  report += `**Status:** ${status}\n`;
  report += `**App:** ${result.spec.appName}\n`;
  report += `**Agent:** ${result.spec.agent}\n`;
  report += `**Iterations:** ${result.totalIterations}\n`;
  report += `**Flows:** ${passCount}/${totalCount} passed\n`;
  report += `**Timestamp:** ${new Date().toISOString()}\n\n`;

  report += `## Flow Results\n\n`;

  for (const r of result.finalResults) {
    const icon = r.passed ? '✅' : '❌';
    const dur = `${(r.duration / 1000).toFixed(1)}s`;
    report += `### ${icon} ${r.flow.name}\n`;
    report += `- **Status:** ${r.passed ? 'PASS' : 'FAIL'}\n`;
    report += `- **Duration:** ${dur}\n`;
    if (r.error) {
      report += `- **Error:** ${r.error}\n`;
    }
    if (r.evidenceUrl) {
      report += `- **Evidence:** [View](${r.evidenceUrl})\n`;
    }
    report += '\n';
  }

  if (result.iterations.length > 1) {
    report += `## Iteration History\n\n`;
    for (const iter of result.iterations) {
      report += `### Iteration ${iter.iteration + 1}\n`;
      report += `- Passed: ${iter.passedFlows.join(', ') || 'none'}\n`;
      report += `- Failed: ${iter.failedFlows.join(', ') || 'none'}\n\n`;
    }
  }

  return report;
}

export function writeOutputs(result: EngineResult, outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });

  // Write manifest
  const manifest = generateManifest(result);
  fs.writeFileSync(
    path.join(outputDir, 'kane-verified.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  // Write report
  const report = generateReport(result);
  fs.writeFileSync(
    path.join(outputDir, 'VERIFICATION_REPORT.md'),
    report,
    'utf-8'
  );
}
