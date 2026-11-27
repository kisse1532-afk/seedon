import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUploader } from "@/lib/alerts/uploader";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkDraft, cleanDraft, toProgramRow, MAX_SOURCE_CHARS } from "@/lib/alerts/notice";
import { kstToday } from "@/lib/alerts/options";

const fail = (message: string, status: number, errors: string[] = []) =>
  NextResponse.json({ error: message, errors }, { status });

/** 사람이 「게시」를 눌렀을 때만 불린다. 여기서만 카드가 생긴다. */
export async function POST(request: Request) {
  const uploader = await getUploader(request);
  if (!uploader) return fail("공문을 올릴 수 있는 계정이 아니에요. 다시 로그인해보세요.", 401);
  if (!supabaseAdmin) return fail("서버 설정이 덜 돼서 게시할 수 없어요.", 503);

  const body = (await request.json().catch(() => null)) as {
    noticeId?: unknown;
    draft?: unknown;
    sourceText?: unknown;
    confirmed?: unknown;
  } | null;
  if (!body) return fail("보낸 내용을 못 읽었어요.", 400);
  if (body.confirmed !== true) return fail("원문과 맞춰 봤는지 체크해주세요.", 400);

  const today = kstToday();
  const draft = cleanDraft(body.draft);
  const errors = checkDraft(draft, today);
  if (errors.length) return fail("고칠 곳이 있어요.", 400, errors);

  const notReady = "게시하지 못했어요. DB 설정(마이그레이션)이 아직이면 씨드온에 알려주세요.";
  let noticeId = typeof body.noticeId === "string" ? body.noticeId : null;

  // AI 없이 직접 쓴 경우에는 원문 기록이 아직 없다.
  if (!noticeId) {
    const { data, error } = await supabaseAdmin
      .from("notices")
      .insert({
        created_by: uploader.userId,
        uploader_role: uploader.role,
        source_text: String(body.sourceText ?? "").slice(0, MAX_SOURCE_CHARS) || null,
      })
      .select("id")
      .single();
    if (error) return fail(notReady, 503);
    noticeId = data.id as string;
  }

  // 먼저 "게시"로 바꾼 쪽만 카드를 만든다. 두 번 눌러도 카드는 하나다.
  // 선생님은 자기가 올린 것만 게시할 수 있다.
  let claim = supabaseAdmin
    .from("notices")
    .update({ status: "published", draft, published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", noticeId)
    .eq("status", "draft");
  if (uploader.userId) claim = claim.eq("created_by", uploader.userId);
  const { data: claimed, error: claimError } = await claim.select("id");
  if (claimError) return fail(notReady, 503);
  if (!claimed?.length) return fail("이미 게시했거나 찾을 수 없는 공문이에요.", 409);

  const programId = `alert-${today.replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await supabaseAdmin
    .from("programs")
    .insert(toProgramRow(draft, { id: programId, today, uploader: uploader.role }));
  if (error) {
    await supabaseAdmin.from("notices").update({ status: "draft", published_at: null }).eq("id", noticeId);
    return fail(notReady, 503);
  }
  await supabaseAdmin.from("notices").update({ program_id: programId }).eq("id", noticeId);

  revalidatePath("/", "layout");
  return NextResponse.json({ programId });
}
