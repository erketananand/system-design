export class Logger {
  private static enableDebug = true;

  /**
   * Log informational messages
   */
  static info(msg: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} - ${msg}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log error messages
   */
  static error(msg: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${msg}`);
    if (error) {
      if (error instanceof Error) {
        console.error(`  Message: ${error.message}`);
        if (error.stack) {
          console.error(`  Stack: ${error.stack}`);
        }
      } else {
        console.error(JSON.stringify(error, null, 2));
      }
    }
  }

  /**
   * Log success messages
   */
  static success(msg: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[SUCCESS] ${timestamp} - ${msg}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log warning messages
   */
  static warn(msg: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] ${timestamp} - ${msg}`);
    if (data) {
      console.warn(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log debug messages (only if debug is enabled)
   */
  static debug(msg: string, data?: any): void {
    if (!this.enableDebug) return;

    const timestamp = new Date().toISOString();
    console.log(`[DEBUG] ${timestamp} - ${msg}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Enable or disable debug logging
   */
  static setDebugMode(enabled: boolean): void {
    this.enableDebug = enabled;
  }

  /**
   * Log section separator
   */
  static separator(char: string = '=', length: number = 80): void {
    console.log(char.repeat(length));
  }

  /**
   * Log a header with title
   */
  static header(title: string, char: string = '=', length: number = 80): void {
    this.separator(char, length);
    console.log(title.toUpperCase().padStart((length + title.length) / 2));
    this.separator(char, length);
  }

  /**
   * Log formatted table (simple)
   */
  static table(data: any[]): void {
    if (data.length === 0) {
      console.log('  (No data)');
      return;
    }
    console.table(data);
  }

  /**
   * Clear console
   */
  static clear(): void {
    console.clear();
  }
}
