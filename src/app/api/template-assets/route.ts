import { randomUUID } from "node:crypto";
import mammoth from "mammoth";
import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import { putTemplateAsset } from "@/server/storage/object-storage";

const imageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/gif", "gif"],
  ["image/webp", "webp"],
]);

async function storeImage(bytes: Uint8Array, contentType: string) {
  const extension = imageTypes.get(contentType);
  if (!extension) {
    throw new Error("UNSUPPORTED_IMAGE_TYPE");
  }
  const key = `${randomUUID()}.${extension}`;
  await putTemplateAsset(key, bytes, contentType);
  return `/api/template-assets/${key}`;
}

export async function POST(request: Request) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await requireSystemAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
  }
  if (imageTypes.has(file.type)) {
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "IMAGE_TOO_LARGE" }, { status: 413 });
    }
    const url = await storeImage(new Uint8Array(await file.arrayBuffer()), file.type);
    return NextResponse.json({ type: "image", url });
  }
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  ) {
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "WORD_FILE_TOO_LARGE" }, { status: 413 });
    }
    const result = await mammoth.convertToHtml(
      { buffer: Buffer.from(await file.arrayBuffer()) },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const bytes = Buffer.from(await image.read("base64"), "base64");
          return { src: await storeImage(bytes, image.contentType) };
        }),
      },
    );
    return NextResponse.json({
      type: "document",
      html: result.value,
      warnings: result.messages.map(({ message }) => message),
    });
  }
  return NextResponse.json({ error: "UNSUPPORTED_FILE_TYPE" }, { status: 415 });
}
