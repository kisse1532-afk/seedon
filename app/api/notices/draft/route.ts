import { NextResponse } from "next/server";
import { getUploader } from "@/lib/alerts/uploader";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { draftFromNotice } from "@/lib/alerts/notice-ai";
import { MAX_PDF_BYTES, MAX_SOURCE_CHARS } from "@/lib/alerts/notice";
import { kstToday } from "@/lib/alerts/options";

// AI가 PDF를 읽는 데 시간이 걸린다.
export const maxDuration = 60;

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

/**
 * 붙여넣은 글이나 PDF를 받아 원문을 보관하고, AI 초안을 돌려준다.
 * 여기서는 아무것도 게시하지 않는다.
 */
export async function POST(request: Request) {
  const uploader = await getUploader(request);
  if (!uploader) return fail("공문을 올릴 수 있는 계정이 아니에요. 다시 로그인해보세요.", 401);

  const form = await request.formData().catch(() => null);
  if (!form) return fail("파일이 너무 크거나 보내는 중에 끊겼어요.", 400);

  const text = String(form.get("text") ?? "").trim();
  const file = form.get("file");
  if (text.length > MAX_SOURCE_CHARS) return fail("글이 너무 길어요. 3만 자까지 넣을 수 있어요.", 400);

  let pdf: Buffer | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_PDF_BYTES) return fail("PDF는 4MB까지 올릴 수 있어요.", 400);
    pdf = Buffer.from(await file.arrayBuffer());
    if (pdf.subarray(0, 5).toString("latin1") !== "%PDF-") return fail("PDF 파일만 올릴 수 있어요.", 400);
  }
  if (!text && !pdf) return fail("글을 붙여넣거나 PDF를 골라주세요.", 400);

  // 원문부터 남긴다. 보관에 실패해도(마이그레이션 전 등) 초안은 만들어준다.
  let noticeId: string | null = null;
  const warnings: string[] = [];
  if (supabaseAdmin) {
    let filePath: string | null = null;
    if (pdf) {
      const path = `${kstToday()}/${crypto.randomUUID()}.pdf`;
      const { error } = await supabaseAdmin.storage
        .from("notice-files")
        .upload(path, pdf, { contentType: "application/pdf" });
      if (error) warnings.push("PDF 원본은 보관하지 못했어요.");
      else filePath = path;
    }
    const { data, error } = await supabaseAdmin
      .from("notices")
      .insert({
        created_by: uploader.userId,
        uploader_role: uploader.role,
        source_text: text || null,
        file_path: filePath,
      })
      .select("id")
      .single();
    if (error) {
      warnings.push("원문을 보관하지 못했어요. 게시가 안 되면 씨드온에 알려주세요.");
      // 기록이 없는 파일은 30일 삭제 작업이 못 찾는다. 바로 치운다.
      if (filePath) await supabaseAdmin.storage.from("notice-files").remove([filePath]);
    } else noticeId = data.id;
  } else {
    warnings.push("서버 설정이 덜 돼서 지금은 게시할 수 없어요.");
  }

  const ai = await draftFromNotice({
    text,
    pdfBase64: pdf ? pdf.toString("base64") : null,
    today: kstToday(),
  });

  if (ai && noticeId && supabaseAdmin) {
    await supabaseAdmin.from("notices").update({ draft: ai.draft }).eq("id", noticeId);
  }

  return NextResponse.json({
    noticeId,
    draft: ai?.draft ?? null,
    notes: [...(ai?.notes ?? []), ...warnings],
  });
}
