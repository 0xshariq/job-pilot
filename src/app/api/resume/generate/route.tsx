import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";

import { getCurrentUser } from "@/lib/auth";
import { generateStructured } from "@/lib/gemini";
import { createInsforgeServer } from "@/lib/insforge-server";
import { trackPostHogEvent } from "@/lib/posthog-server";
import type { Profile } from "@/types";
import { ResumePDF, type GeneratedContent } from "./ResumePDF";

const generatedContentSchema = z.object({
  summary: z.string().min(1),
  work_experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      start_date: z.string(),
      end_date: z.string().nullable(),
      is_current: z.boolean(),
      bullets: z.array(z.string()).min(1),
    }),
  ),
});

function createResumeDocument(
  profile: Profile,
  generated: GeneratedContent,
): React.ReactElement<DocumentProps> {
  // ResumePDF renders a @react-pdf <Document>; the cast bridges React's component
  // prop inference to the renderer's document element type.
  return (
    <ResumePDF profile={profile} generated={generated} />
  ) as unknown as React.ReactElement<DocumentProps>;
}

export async function POST(_req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const insforge = await createInsforgeServer();

    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<Profile>();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 },
      );
    }

    const profileContext = JSON.stringify({
      full_name: profile.full_name,
      current_title: profile.current_title,
      experience_level: profile.experience_level,
      years_experience: profile.years_experience,
      skills: profile.skills,
      industries: profile.industries,
      work_experience: profile.work_experience,
      education: profile.education,
      job_titles_seeking: profile.job_titles_seeking,
    });

    const generated = (await generateStructured({
      schema: generatedContentSchema,
      system:
        "You are a professional resume writer. Produce a 2-3 sentence professional summary and rewrite each work experience entry into 3-5 concise, achievement-focused bullets beginning with strong action verbs.",
      prompt: `Generate polished resume content for this candidate. Preserve the company, title, dates, and current status from the source profile.\n\nCandidate profile:\n${profileContext}`,
      temperature: 0.7,
      maxOutputTokens: 1000,
    })) as GeneratedContent;

    // Render PDF buffer server-side
    const buffer = await renderToBuffer(createResumeDocument(profile, generated));

    // Remove existing file then upload fresh (SDK has no upsert — matches actions/profile.ts pattern)
    const path = `${user.id}/resume.pdf`;
    await insforge.storage.from("resumes").remove(path);

    // InsForge storage upload expects a Blob — wrap the Node Buffer.
    // Cast to ArrayBuffer to satisfy strict TS — Buffer is a safe subtype at runtime.
    const blob = new Blob([buffer as unknown as ArrayBuffer], {
      type: "application/pdf",
    });

    const { error: uploadError } = await insforge.storage
      .from("resumes")
      .upload(path, blob);

    if (uploadError) {
      console.error("[api/resume/generate] storage upload", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload resume" },
        { status: 500 },
      );
    }

    const { error: dbError } = await insforge.database
      .from("profiles")
      .update({ resume_pdf_url: path })
      .eq("id", user.id);

    if (dbError) {
      console.error("[api/resume/generate] db update", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to save resume URL" },
        { status: 500 },
      );
    }

    await trackPostHogEvent({
      event: "resume_generated",
      properties: { userId: user.id },
    });

    revalidatePath("/profile");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/resume/generate]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
