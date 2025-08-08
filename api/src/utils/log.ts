import fs from "fs";
import path from "path";

const LOG_FILE_PATH = path.resolve("logs", "document_chunks.log");
const MAX_AGE_HOURS = 24;

export function logDocumentUpdate(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  const logDir = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.appendFileSync(LOG_FILE_PATH, logMessage, "utf8");
}

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

function extractTimestamp(logLine?: string): Date | null {
  if (!logLine) return null;
  const match = logLine.match(/^\[(.*?)\]/);
  return match ? new Date(match[1] as string) : null;
}
