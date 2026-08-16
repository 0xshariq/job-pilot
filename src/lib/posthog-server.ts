import { PostHog } from "posthog-node";

type PostHogEventInput =
  | {
      event: "job_search_started";
      properties: {
        userId: string;
      };
    }
  | {
      event: "job_found";
      properties: {
        userId: string;
        source: string;
        matchScore: number;
      };
    }
  | {
      event: "job_search_completed";
      properties: {
        userId: string;
        jobsFound: number;
        highMatchCount: number;
      };
    }
  | {
      event: "job_url_submitted";
      properties: {
        userId: string;
      };
    }
  | {
      event: "cover_letter_generated";
      properties: {
        userId: string;
        jobId: string;
      };
    }
  | {
      event: "resume_tailored";
      properties: {
        userId: string;
        jobId: string;
        scoreBefore: number;
        scoreAfter: number;
      };
    }
  | {
      event: "profile_completed";
      properties: {
        userId: string;
      };
    }
  | {
      event: "resume_uploaded";
      properties: {
        userId: string;
      };
    }
  | {
      event: "resume_generated";
      properties: {
        userId: string;
      };
    }
  | {
      event: "company_researched";
      properties: {
        userId: string;
        jobId: string;
        company: string;
      };
    }
  | {
      event: "linkedin_connected";
      properties: {
        userId: string;
      };
    };

export function createPostHogServer(): PostHog | null {
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

  return new PostHog(key, {
    host,
    enableExceptionAutocapture: true,
    flushAt: 1,
    flushInterval: 0,
  });
}

export async function trackPostHogEvent(
  input: PostHogEventInput,
): Promise<void> {
  const posthog = createPostHogServer();

  if (!posthog) {
    return;
  }

  try {
    posthog.capture({
      distinctId: input.properties.userId,
      event: input.event,
      properties: input.properties,
    });
  } catch (error) {
    console.error("[posthog-server]", error);
  } finally {
    await posthog.shutdown();
  }
}
