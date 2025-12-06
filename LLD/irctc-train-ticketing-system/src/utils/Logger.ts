export class Logger {
  /**
   * Log informational messages
   */
  static info(msg: string): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`);
  }

  /**
   * Log error messages
   */
  static error(msg: string): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`);
  }

  /**
   * Log success messages
   */
  static success(msg: string): void {
    console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`);
  }

  /**
   * Log warning messages
   */
  static warn(msg: string): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`);
  }

  /**
   * Log debug messages (for development)
   */
  static debug(msg: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`);
    }
  }

  /**
   * Print a separator line
   */
  static separator(): void {
    console.log('\n' + '='.repeat(70) + '\n');
  }

  /**
   * Print a header with title
   */
  static header(title: string): void {
    console.log('\n' + '='.repeat(70));
    const padding = Math.floor((70 - title.length) / 2);
    console.log(' '.repeat(padding) + title);
    console.log('='.repeat(70) + '\n');
  }
}
