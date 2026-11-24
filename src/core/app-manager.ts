/**
 * app-manager.ts
 * 
 * Manages the generated app: writes files, installs deps, starts/stops the server.
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn, execSync, ChildProcess } from 'child_process';
import { FileWrite } from '../agents';

export class AppManager {
  private appDir: string;
  private serverProcess: ChildProcess | null = null;

  constructor(workDir: string) {
    this.appDir = path.join(workDir, '.kanon', 'app');
  }

  get directory(): string {
    return this.appDir;
  }

  /**
   * Write all generated files to the app directory.
   */
  writeFiles(files: FileWrite[]): void {
    // Ensure app directory exists
    fs.mkdirSync(this.appDir, { recursive: true });

    for (const file of files) {
      const filePath = path.join(this.appDir, file.path);
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, file.content, 'utf-8');
    }
  }

  /**
   * Read all current files in the app directory.
   */
  readCurrentFiles(): Record<string, string> {
    const files: Record<string, string> = {};
    this.walkDir(this.appDir, files);
    return files;
  }

  private walkDir(dir: string, files: Record<string, string>): void {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        this.walkDir(fullPath, files);
      } else {
        if (entry.name === 'package-lock.json' || entry.name.endsWith('.lock')) continue;
        const relativePath = path.relative(this.appDir, fullPath);
        try {
          files[relativePath] = fs.readFileSync(fullPath, 'utf-8');
        } catch {
          // skip binary files
        }
      }
    }
  }

  /**
   * Install npm dependencies.
   */
  async installDeps(): Promise<void> {
    const packageJsonPath = path.join(this.appDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return; // No package.json, skip
    }

    try {
      execSync('npm install --legacy-peer-deps 2>&1', {
        cwd: this.appDir,
        timeout: 60_000,
        stdio: 'pipe',
      });
    } catch (e) {
      const error = e as any;
      throw new Error(`npm install failed: ${error.stderr?.toString() || error.message}`);
    }
  }

  /**
   * Start the app server.
   */
  async startServer(port: number = 3000): Promise<void> {
    // Kill any existing server
    await this.stopServer();

    // Also kill anything on the port
    try {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: 'pipe' });
    } catch {
      // Nothing running on port, that's fine
    }

    return new Promise((resolve, reject) => {
      const packageJson = path.join(this.appDir, 'package.json');
      let startCmd = 'node';
      let startArgs = ['index.js'];

      if (fs.existsSync(packageJson)) {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
        if (pkg.scripts?.start) {
          startCmd = 'npm';
          startArgs = ['start'];
        } else if (pkg.main) {
          startArgs = [pkg.main];
        }
      }

      // Check for common entry points
      if (startCmd === 'node') {
        const entries = ['index.js', 'server.js', 'app.js', 'src/index.js', 'src/server.js'];
        for (const entry of entries) {
          if (fs.existsSync(path.join(this.appDir, entry))) {
            startArgs = [entry];
            break;
          }
        }
      }

      this.serverProcess = spawn(startCmd, startArgs, {
        cwd: this.appDir,
        env: { ...process.env, PORT: String(port) },
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
      });

      let started = false;
      let output = '';

      const startTimeout = setTimeout(() => {
        if (!started) {
          started = true;
          // Give it the benefit of the doubt — resolve anyway
          resolve();
        }
      }, 8000);

      const checkStarted = (data: string) => {
        output += data;
        if (!started && (
          data.includes('listening') ||
          data.includes('started') ||
          data.includes('ready') ||
          data.includes(`${port}`) ||
          data.includes('Server running')
        )) {
          started = true;
          clearTimeout(startTimeout);
          setTimeout(resolve, 1000); // Give it a second to settle
        }
      };

      this.serverProcess.stdout?.on('data', (chunk: Buffer) => checkStarted(chunk.toString()));
      this.serverProcess.stderr?.on('data', (chunk: Buffer) => checkStarted(chunk.toString()));

      this.serverProcess.on('error', (err) => {
        clearTimeout(startTimeout);
        if (!started) {
          reject(new Error(`Failed to start server: ${err.message}`));
        }
      });

      this.serverProcess.on('close', (code) => {
        clearTimeout(startTimeout);
        if (!started) {
          reject(new Error(`Server exited with code ${code} before starting.\nOutput: ${output}`));
        }
      });
    });
  }

  /**
   * Stop the app server.
   */
  async stopServer(): Promise<void> {
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      this.serverProcess = null;
      // Wait a moment for port to free up
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  /**
   * Clean the app directory.
   */
  clean(): void {
    if (fs.existsSync(this.appDir)) {
      fs.rmSync(this.appDir, { recursive: true, force: true });
    }
  }
}
