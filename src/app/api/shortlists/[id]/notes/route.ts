import { NextResponse } from "next/server";
import { z } from "zod";
import { updateAgentNotes } from "@/lib/shortlistRepo";

const bodySchema = z.object({ notes: z.string() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  await updateAgentNotes(id, parsed.data.notes);
  return NextResponse.json({ ok: true });
}
