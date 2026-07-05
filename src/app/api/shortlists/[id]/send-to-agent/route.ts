import { NextResponse } from "next/server";
import { z } from "zod";
import { sendToAgent } from "@/lib/shortlistRepo";

const bodySchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, phone, email } = parsed.data;
  await sendToAgent(id, { name, phone, email: email || undefined });
  return NextResponse.json({ ok: true });
}
