export class Logger {
  static info(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
  }

  static error(message: string): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
  }

  static warn(message: string): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
  }

  static success(message: string): void {
    console.log(`[SUCCESS] ${new Date().toISOString()} - ${message}`);
  }

  static debug(message: string): void {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);
  }
}