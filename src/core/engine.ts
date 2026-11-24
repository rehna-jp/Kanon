/**
 * engine.ts
 * 
 * The core spec-to-verified-app engine.
 * Orchestrates: parse spec → generate code → start app → run Kane → fix → repeat
 */

import { KaneSpec, KaneFlow } from './spec-parser';
import { KaneRunner, KaneResult } from './kane-runner';
import { AppManager } from './app-manager';
import { createAgent, BaseAgent, AgentContext } from '../agents';
import { Logger } from '../utils/logger';

export interface EngineOptions {
  workDir: string;
  headless?: boolean;
  port?: number;
  verbose?: boolean;
}

export interface IterationResult {
  iteration: number;
  kaneResults: KaneResult[];
  allPassed: boolean;
  failedFlows: string[];
  passedFlows: string[];
}

export interface EngineResult {
  success: boolean;
  totalIterations: number;
  iterations: IterationResult[];
  finalResults: KaneResult[];
  spec: KaneSpec;
  appDir: string;
}

export class Engine {
  private spec: KaneSpec;
  private agent: BaseAgent;
  private runner: KaneRunner;
  private appManager: AppManager;
  private logger: Logger;
  private port: number;

  constructor(spec: KaneSpec, options: EngineOptions) {
    this.spec = spec;
    this.port = options.port || 3000;
    this.logger = new Logger(options.verbose || false);

    this.agent = createAgent(spec.agent);
    this.runner = new KaneRunner({
      headless: options.headless,
      url: spec.url || `http://localhost:${this.port}`,
    });
    this.appManager = new AppManager(options.workDir);
  }

  /**
   * Run the full spec-to-verified-app loop.
   */
  async run(): Promise<EngineResult> {
    const iterations: IterationResult[] = [];
    let currentFiles: Record<string, string> = {};

    this.logger.header('kanon');
    this.logger.info(`App: ${this.spec.appName}`);
    this.logger.info(`Agent: ${this.spec.agent}`);
    this.logger.info(`Flows: ${this.spec.flows.length}`);
    this.logger.info(`Max retries: ${this.spec.maxRetries}`);
    this.logger.divider();

    try {
      // === ITERATION 0: Initial generation ===
      this.logger.step(0, 'Generating app from spec...');

      const genContext: AgentContext = {
        appName: this.spec.appName,
        techStack: this.spec.techStack,
        specContent: this.spec.flows.map((f) => f.rawText).join('\n\n'),
        iteration: 0,
      };

      const genResponse = await this.agent.generate(genContext);
      this.logger.success(`Generated ${genResponse.files.length} files`);
      this.logger.detail(genResponse.explanation);

      // Write files and install
      this.appManager.clean();
      this.appManager.writeFiles(genResponse.files);

      this.logger.step(0, 'Installing dependencies...');
      await this.appManager.installDeps();

      this.logger.step(0, 'Starting server...');
      await this.appManager.startServer(this.port);
      this.logger.success(`Server running on port ${this.port}`);

      // Read current files for future fix context
      currentFiles = this.appManager.readCurrentFiles();

      // === VERIFICATION LOOP ===
      for (let i = 0; i <= this.spec.maxRetries; i++) {
        this.logger.divider();
        this.logger.step(i, `Running Kane CLI verification (attempt ${i + 1}/${this.spec.maxRetries + 1})...`);

        const kaneResults = await this.runner.runAllFlows(this.spec.flows);

        const passed = kaneResults.filter((r) => r.passed);
        const failed = kaneResults.filter((r) => !r.passed);

        const iterResult: IterationResult = {
          iteration: i,
          kaneResults,
          allPassed: failed.length === 0,
          passedFlows: passed.map((r) => r.flow.name),
          failedFlows: failed.map((r) => r.flow.name),
        };
        iterations.push(iterResult);

        // Report results
        for (const r of kaneResults) {
          if (r.passed) {
            this.logger.flowPass(r.flow.name, r.duration);
          } else {
            this.logger.flowFail(r.flow.name, r.error || 'Unknown', r.duration);
          }
        }

        // All passed!
        if (failed.length === 0) {
          this.logger.divider();
          this.logger.victory(
            `All ${this.spec.flows.length} flows verified in ${i + 1} iteration(s)!`
          );

          await this.appManager.stopServer();

          return {
            success: true,
            totalIterations: i + 1,
            iterations,
            finalResults: kaneResults,
            spec: this.spec,
            appDir: this.appManager.directory,
          };
        }

        // Last iteration — no more retries
        if (i === this.spec.maxRetries) {
          this.logger.warning(
            `Max retries reached. ${failed.length} flow(s) still failing.`
          );
          break;
        }

        // === FIX CYCLE ===
        this.logger.step(i + 1, 'Feeding failures to agent for fix...');

        const failureReport = KaneRunner.buildFailureReport(kaneResults);
        this.logger.detail(failureReport);

        const fixContext: AgentContext = {
          appName: this.spec.appName,
          techStack: this.spec.techStack,
          specContent: this.spec.flows.map((f) => f.rawText).join('\n\n'),
          failureReport,
          currentFiles,
          iteration: i + 1,
        };

        const fixResponse = await this.agent.fix(fixContext);
        this.logger.success(`Agent produced fix: ${fixResponse.explanation}`);

        // Apply fixes
        await this.appManager.stopServer();
        this.appManager.writeFiles(fixResponse.files);

        if (fixResponse.dependencies && fixResponse.dependencies.length > 0) {
          this.logger.info(`Installing new dependencies: ${fixResponse.dependencies.join(', ')}`);
          await this.appManager.installDeps();
        }

        await this.appManager.startServer(this.port);
        currentFiles = this.appManager.readCurrentFiles();
      }

      // If we reach here, we didn't pass all flows
      await this.appManager.stopServer();

      const lastIteration = iterations[iterations.length - 1];
      return {
        success: false,
        totalIterations: iterations.length,
        iterations,
        finalResults: lastIteration.kaneResults,
        spec: this.spec,
        appDir: this.appManager.directory,
      };

    } catch (error) {
      await this.appManager.stopServer();
      throw error;
    }
  }
}
