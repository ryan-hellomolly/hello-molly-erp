import { NextResponse } from "next/server";
import { authService } from "@/server/auth/auth-service";
import { getTemplateAsset } from "@/server/storage/object-storage";

export async function GET(_request: Request, context: RouteContext<"/api/template-assets/[key]">) {
  if (!(await authService.currentUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { key } = await context.params;
  try {
    const object = await getTemplateAsset(key);
    if (!object.Body) {
      return NextResponse.json({ error: "ASSET_NOT_FOUND" }, { status: 404 });
    }
    const body = Uint8Array.from(await object.Body.transformToByteArray()).buffer;
    return new Response(body, {
      headers: {
        "content-type": object.ContentType ?? "application/octet-stream",
        "cache-control": "private, max-age=3600",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "ASSET_NOT_FOUND" }, { status: 404 });
  }
}
