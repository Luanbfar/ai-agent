// src/utils/logger.ts
import fs from "fs";
import path from "path";

export enum LogLevel {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

class Logger {
  private logDir = path.resolve("logs");
  private logFile = path.join(this.logDir, "application.log");

  constructor() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private log(level: LogLevel, message: string, metadata?: any): void {
    const timestamp = new Date().toISOString();
    const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : "";
    const logMessage = `[${timestamp}] [${level}] ${message}${metaStr}\n`;

    // Write to file
    fs.appendFileSync(this.logFile, logMessage, "utf8");

    // Write to console
    console.log(logMessage.trim());
  }

  info(message: string, metadata?: any): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warning(message: string, metadata?: any): void {
    this.log(LogLevel.WARNING, message, metadata);
  }

  error(message: string, metadata?: any): void {
    this.log(LogLevel.ERROR, message, metadata);
  }
}

export const logger = new Logger();
