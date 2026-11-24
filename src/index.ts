#!/usr/bin/env node

/**
 * kane-spec CLI
 * 
 * Write English specs. Ship verified apps.
 * Kane CLI is your specification language.
 * 
 * Usage:
 *   kane-spec run <spec-file>       Run the spec-to-verified-app loop
 *   kane-spec init                  Create a sample .kane.md spec file
 *   kane-spec verify <spec-file>    Only verify (skip generation, app must be running)
 */

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { parseSpecFile } from './core/spec-parser';
import { Engine } from './core/engine';
import { KaneRunner } from './core/kane-runner';
import { writeOutputs } from './utils/report';
import { Logger } from './utils/logger';

const program = new Command();

program
  .name('kanon')
  .description('Write English specs. Ship verified apps. Kane CLI is your specification language.')
  .version('1.0.0');

// === RUN command ===
program
  .command('run')
  .description('Generate an app from a spec and verify it with Kane CLI')
  .argument('<spec-file>', 'Path to your .kane.md spec file')
  .option('-p, --port <port>', 'Port for the app server', '3000')
  .option('--headless', 'Run Kane CLI in headless mode', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .option('-o, --output <dir>', 'Output directory for reports', '.')
  .action(async (specFile: string, options: any) => {
    try {
      const spec = parseSpecFile(specFile);
      const workDir = process.cwd();

      const engine = new Engine(spec, {
        workDir,
        headless: options.headless,
        port: parseInt(options.port),
        verbose: options.verbose,
      });

      const result = await engine.run();

      // Write outputs
      const outputDir = path.resolve(options.output);
      writeOutputs(result, outputDir);

      if (result.success) {
        console.log(chalk.green(`\n  ✓ Verified! App at: ${result.appDir}`));
        console.log(chalk.gray(`  ✓ Report: ${path.join(outputDir, 'VERIFICATION_REPORT.md')}`));
        console.log(chalk.gray(`  ✓ Manifest: ${path.join(outputDir, 'kane-verified.json')}`));
        process.exit(0);
      } else {
        console.log(chalk.red(`\n  ✗ Verification incomplete. See report for details.`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n  ✗ Error: ${(error as Error).message}`));
      if ((options as any)?.verbose) {
        console.error(error);
      }
      process.exit(1);
    }
  });

// === VERIFY command ===
program
  .command('verify')
  .description('Verify a running app against a spec (no generation, app must be running)')
  .argument('<spec-file>', 'Path to your .kane.md spec file')
  .option('--headless', 'Run Kane CLI in headless mode', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .action(async (specFile: string, options: any) => {
    try {
      const logger = new Logger(options.verbose);
      const spec = parseSpecFile(specFile);

      logger.header('kanon verify');
      logger.info(`Verifying ${spec.flows.length} flows against ${spec.url}`);
      logger.divider();

      const runner = new KaneRunner({
        headless: options.headless,
        url: spec.url,
      });

      const results = await runner.runAllFlows(spec.flows);

      let allPassed = true;
      for (const r of results) {
        if (r.passed) {
          logger.flowPass(r.flow.name, r.duration);
        } else {
          allPassed = false;
          logger.flowFail(r.flow.name, r.error || 'Unknown', r.duration);
        }
      }

      logger.divider();
      if (allPassed) {
        logger.victory(`All ${results.length} flows verified!`);
        process.exit(0);
      } else {
        const failed = results.filter((r) => !r.passed).length;
        logger.warning(`${failed} of ${results.length} flows failed.`);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n  ✗ Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// === INIT command ===
program
  .command('init')
  .description('Create a sample .kanon.md spec file')
  .option('-n, --name <name>', 'App name', 'my-app')
  .action((options: any) => {
    const fileName = `${options.name}.kanon.md`;
    const filePath = path.join(process.cwd(), fileName);

    if (fs.existsSync(filePath)) {
      console.error(chalk.red(`  ✗ ${fileName} already exists`));
      process.exit(1);
    }

    const template = `---
app: ${options.name}
url: http://localhost:3000
agent: openai
tech: express-html
max_retries: 5
---

# ${options.name}

## Flow: Home page loads
Go to the app. I should see a heading with the app name.

## Flow: User can navigate
Go to the app. Click on "About". I should see information about the app.

## Flow: Form works
Go to the app. Click on "Contact". Fill in the name field with "Alice" and the email field with "alice@example.com". Click "Submit". I should see a success message.
`;

    fs.writeFileSync(filePath, template, 'utf-8');
    console.log(chalk.green(`  ✓ Created ${fileName}`));
    console.log(chalk.gray(`  Edit it, then run: kanon run ${fileName}`));
  });

program.parse();
