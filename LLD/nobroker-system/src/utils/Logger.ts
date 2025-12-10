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
    console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`);
  }

  static divider(): void {
    console.log('\n' + '='.repeat(80) + '\n');
  }

  static separator(): void {
    console.log('-'.repeat(80));
  }

  static header(title: string): void {
    console.log('\n' + '='.repeat(80));
    const padding = Math.floor((80 - title.length) / 2);
    console.log(' '.repeat(padding) + title);
    console.log('='.repeat(80) + '\n');
  }
}
