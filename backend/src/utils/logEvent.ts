import { SystemEvent } from "../models/systemEvent.ts";

/**
 * Logs a system event.
 * @param type - Category of the event ('system', 'login', 'audit', 'role_update')
 * @param message - Human-readable message describing what occurred
 */

export async function logEvent(type: string, message: string) {
  try {
    await SystemEvent.create({ type, message });
  } catch (err) {
    console.error("Failed to log system event:", err);
  }
}
