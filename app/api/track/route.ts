import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VALID_EVENTS = ["category_card_click", "apply_page_view", "apply_link_click"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_type, program_id, category } = body as {
      event_type?: string;
      program_id?: string;
      category?: string;
    };

    if (!event_type || !VALID_EVENTS.includes(event_type)) {
      return NextResponse.json({ error: "invalid event_type" }, { status: 400 });
    }

    // fire-and-forget insert; errors are swallowed so tracking never breaks UX
    await supabase.from("program_events").insert({
      event_type,
      program_id: program_id || null,
      category: category || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // tracking must never surface an error to the user
    return NextResponse.json({ ok: true });
  }
}
