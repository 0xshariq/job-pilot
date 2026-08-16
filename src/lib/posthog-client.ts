"use client";

import posthog from "posthog-js";

function getPostHogConfig(): { key: string; host: string } | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key || !host) {
    if (process.env.NODE_ENV === "development") {
      const variable = key
        ? "NEXT_PUBLIC_POSTHOG_HOST"
        : "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN";
      throw new Error(
        `${variable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${variable} is configured`,
      );
    }

    return null;
  }

  return { key, host };
}

export function initPostHog(): void {
  const config = getPostHogConfig();

  if (!config || typeof window === "undefined") {
    return;
  }

  posthog.init(config.key, {
    api_host: config.host,
    defaults: "2026-01-30",
    capture_pageview: true,
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
}

export function identifyPostHogUser(userId: string): void {
  if (!userId || !getPostHogConfig()) {
    return;
  }

  posthog.identify(userId);
}

export function resetPostHogUser(): void {
  if (!getPostHogConfig()) {
    return;
  }

  posthog.reset();
}
