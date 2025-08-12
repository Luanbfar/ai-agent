import fs from "fs";
import path from "path";

const LOG_FILE_PATH = path.resolve("logs", "document_chunks.log");
const MAX_AGE_HOURS = 24;

/**
 * Appends a timestamped log message to the document chunks log file.
 * Creates the log directory if it does not exist.
 *
 * @param message - The log message to record.
 */
export function logDocumentUpdate(message: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  const logDir = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.appendFileSync(LOG_FILE_PATH, logMessage, "utf8");
}

/**
 * Checks if the document chunks have been updated within the max allowed age.
 * Reads the last timestamp from the log file and compares to current time.
 *
 * @returns A promise resolving to true if documents are up-to-date, false otherwise.
 */
export async function isDocumentUpToDate(): Promise<boolean> {
  try {
    if (!fs.existsSync(LOG_FILE_PATH)) return false;

    const logLines = fs.readFileSync(LOG_FILE_PATH, "utf8").trim().split("\n");
    const lastLine = logLines.at(-1);
    const timestamp = extractTimestamp(lastLine);

    if (!timestamp) return false;

    const hoursSince = (Date.now() - timestamp.getTime()) / 1000 / 60 / 60;
    return hoursSince < MAX_AGE_HOURS;
  } catch (err) {
    console.error("Error checking document update time:", err);
    return false;
  }
}

/**
 * Extracts a Date object from a log line string formatted with a timestamp in square brackets.
 *
 * @param logLine - The log line to parse.
 * @returns The extracted Date or null if parsing fails.
 */
function extractTimestamp(logLine?: string): Date | null {
  if (!logLine) return null;
  const match = logLine.match(/^\[(.*?)\]/);
  return match ? new Date(match[1] as string) : null;
}
