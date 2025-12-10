export class Logger {
  static info(msg: string): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`);
  }

  static error(msg: string): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`);
  }

  static success(msg: string): void {
    console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`);
  }

  static warn(msg: string): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`);
  }

  static debug(msg: string): void {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`);
  }
}