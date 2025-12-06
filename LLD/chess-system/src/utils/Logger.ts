/**
 * Logger.ts
 * Utility class for logging messages to console with timestamps and levels
 */

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export class Logger {
  private static enabled: boolean = true;
  private static logLevel: LogLevel = LogLevel.INFO;

  /**
   * Log an info message
   * @param message - Message to log
   */
  public static info(message: string): void {
    this.log(LogLevel.INFO, message);
  }

  /**
   * Log a warning message
   * @param message - Message to log
   */
  public static warn(message: string): void {
    this.log(LogLevel.WARN, message);
  }

  /**
   * Log an error message
   * @param message - Message to log
   */
  public static error(message: string): void {
    this.log(LogLevel.ERROR, message);
  }

  /**
   * Log a debug message
   * @param message - Message to log
   */
  public static debug(message: string): void {
    this.log(LogLevel.DEBUG, message);
  }

  /**
   * Internal logging method
   * @param level - Log level
   * @param message - Message to log
   */
  private static log(level: LogLevel, message: string): void {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;

    switch (level) {
      case LogLevel.INFO:
        console.log(`${prefix} ${message}`);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${message}`);
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${message}`);
        break;
      case LogLevel.DEBUG:
        if (this.logLevel === LogLevel.DEBUG) {
          console.log(`${prefix} ${message}`);
        }
        break;
    }
  }

  /**
   * Enable or disable logging
   * @param enabled - Whether to enable logging
   */
  public static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Set the log level
   * @param level - Log level to set
   */
  public static setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}
