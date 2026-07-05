import { NextResponse } from "next/server";
import { z } from "zod";
import { updateItemRating } from "@/lib/shortlistRepo";

const bodySchema = z.object({
  listingId: z.string().min(1),
  rating: z.enum(["excellent", "good", "fair", "avoid"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { listingId, rating } = parsed.data;
  await updateItemRating(id, listingId, rating);
  return NextResponse.json({ ok: true });
}
