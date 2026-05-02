// Next.js 15 instrumentation hook — server/edge Sentry init lives here.
// No-op when NEXT_PUBLIC_SENTRY_DSN is unset, so dev/CI without a Sentry
// project still boots cleanly.

export async function register(): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
