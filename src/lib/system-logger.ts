import { db } from "@/db";
import { systemLogs } from "@/db/schema";

export type LogType = "error" | "warn" | "info";

// Guard to avoid log spam if the table is missing
let disableLogging = false;
let warnedOnce = false;

export async function logSystem(
  type: LogType,
  message: string,
  options?: { userId?: number; action?: string; context?: unknown }
) {
  try {
    if (disableLogging) return; // short-circuit when table is missing

    const now = new Date().toISOString();
    await db.insert(systemLogs).values({
      type,
      message,
      userId: options?.userId,
      action: options?.action,
      context: options?.context ? JSON.stringify(options.context).slice(0, 4000) : undefined,
      createdAt: now,
    });
  } catch (e: any) {
    // Build a combined error string to detect table-missing deep in nested causes
    const combined = (
      (e?.message ? String(e.message) : "") +
      " " +
      (e?.cause?.message ? String(e.cause.message) : "") +
      " " +
      (typeof e?.toString === "function" ? String(e.toString()) : "") +
      " " +
      (e?.proto?.message ? String(e.proto.message) : "")
    ).toLowerCase();

    // Silence repeated noise when table is missing
    if (
      combined.includes("no such table: system_logs") ||
      combined.includes("no such table") ||
      combined.includes("sqlite error: no such table")
    ) {
      disableLogging = true; // disable further attempts
      if (!warnedOnce) {
        warnedOnce = true;
        // Log once for visibility, then stay silent
        console.warn("[systemLogs] Table missing. Disabling system logger to prevent spam.");
      }
      return;
    }

    // For other unexpected errors, log once per window without throwing
    if (!warnedOnce) {
      warnedOnce = true;
      console.error("[systemLogs] Failed to write log:", e);
      // reset the once-guard after a short delay to allow occasional visibility without spamming
      setTimeout(() => {
        warnedOnce = false;
      }, 5000);
    }
  }
}

export async function logError(message: string, options?: { userId?: number; action?: string; context?: unknown }) {
  return logSystem("error", message, options);
}

export async function logWarn(message: string, options?: { userId?: number; action?: string; context?: unknown }) {
  return logSystem("warn", message, options);
}

export async function logInfo(message: string, options?: { userId?: number; action?: string; context?: unknown }) {
  return logSystem("info", message, options);
}