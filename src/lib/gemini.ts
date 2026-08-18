import "server-only";

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import type { z } from "zod";

const GEMINI_MODEL = "gemini-2.5-flash";

export async function generateStructured<TSchema extends z.ZodType>(input: {
  schema: TSchema;
  system: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  abortSignal?: AbortSignal;
  maxRetries?: number;
}): Promise<z.infer<TSchema>> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("Gemini is not configured.");
  }

  const { object } = await generateObject({
    model: google(GEMINI_MODEL),
    schema: input.schema,
    system: input.system,
    prompt: input.prompt,
    temperature: input.temperature ?? 0.3,
    maxOutputTokens: input.maxOutputTokens ?? 1200,
    abortSignal: input.abortSignal,
    maxRetries: input.maxRetries ?? 2,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
  });

  return object as z.infer<TSchema>;
}

export const geminiModelName = GEMINI_MODEL;
