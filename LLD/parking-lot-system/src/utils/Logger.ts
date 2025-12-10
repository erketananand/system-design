export class Logger {
  static info(msg: string): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`);
  }

  static error(msg: string): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`);
  }

  static success(msg: string): void {
    console.log(`\x1b[32m[SUCCESS] ${new Date().toISOString()} - ${msg}\x1b[0m`);
  }

  static warn(msg: string): void {
    console.warn(`\x1b[33m[WARN] ${new Date().toISOString()} - ${msg}\x1b[0m`);
  }

  static debug(msg: string): void {
    if (process.env.DEBUG === 'true') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`);
    }
  }

  static header(msg: string): void {
    console.log('\n' + '='.repeat(70));
    console.log(`  ${msg}`);
    console.log('='.repeat(70) + '\n');
  }

  static separator(): void {
    console.log('-'.repeat(70));
  }
}
