/**
 * Standard error reporting utility.
 * Replaces the proprietary error reporting hooks with clean console logging.
 */

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  const stack = error instanceof Error ? error.stack : undefined;

  console.error("[MailReply AI Error]", message, { context, stack });
}
