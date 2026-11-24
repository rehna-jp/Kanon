/**
 * logger.ts
 * 
 * Pretty console output for kane-spec.
 */

import chalk from 'chalk';

export class Logger {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  header(text: string): void {
    console.log('');
    console.log(chalk.bold.cyan(`  ╔══════════════════════════════════╗`));
    console.log(chalk.bold.cyan(`  ║`) + chalk.bold.white(`  ${text.padEnd(30)}  `) + chalk.bold.cyan(`║`));
    console.log(chalk.bold.cyan(`  ║`) + chalk.gray(`  Write English. Ship Verified. `) + chalk.bold.cyan(`║`));
    console.log(chalk.bold.cyan(`  ╚══════════════════════════════════╝`));
    console.log('');
  }

  info(msg: string): void {
    console.log(chalk.gray(`  ℹ ${msg}`));
  }

  success(msg: string): void {
    console.log(chalk.green(`  ✓ ${msg}`));
  }

  warning(msg: string): void {
    console.log(chalk.yellow(`  ⚠ ${msg}`));
  }

  error(msg: string): void {
    console.log(chalk.red(`  ✗ ${msg}`));
  }

  step(iteration: number, msg: string): void {
    console.log(chalk.blue(`  [${iteration}] ${msg}`));
  }

  flowPass(name: string, durationMs: number): void {
    const dur = `${(durationMs / 1000).toFixed(1)}s`;
    console.log(chalk.green(`    ✓ PASS `) + chalk.white(name) + chalk.gray(` (${dur})`));
  }

  flowFail(name: string, error: string, durationMs: number): void {
    const dur = `${(durationMs / 1000).toFixed(1)}s`;
    console.log(chalk.red(`    ✗ FAIL `) + chalk.white(name) + chalk.gray(` (${dur})`));
    if (this.verbose) {
      console.log(chalk.gray(`           ${error}`));
    }
  }

  detail(msg: string): void {
    if (this.verbose) {
      const lines = msg.split('\n');
      for (const line of lines) {
        console.log(chalk.gray(`    │ ${line}`));
      }
    }
  }

  victory(msg: string): void {
    console.log('');
    console.log(chalk.bold.green(`  🎉 ${msg}`));
    console.log('');
  }

  divider(): void {
    console.log(chalk.gray(`  ${'─'.repeat(50)}`));
  }
}
