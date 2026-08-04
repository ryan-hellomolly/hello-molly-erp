import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import {
  constructionTemplateUpdateSchema,
  deleteConstructionTemplate,
  deleteMeasurementTemplate,
  measurementTemplateUpdateSchema,
  templateStatusSchema,
  transitionTemplate,
  updateConstructionTemplate,
  updateMeasurementTemplate,
} from "@/server/templates/service";

async function authorizedMutation(request: Request) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {
    return null;
  }
  return requireSystemAdmin();
}

export async function PATCH(request: Request, context: RouteContext<"/api/templates/[id]">) {
  const user = await authorizedMutation(request);
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const { id } = await context.params;
  const status = templateStatusSchema.safeParse(body);
  const construction = constructionTemplateUpdateSchema.safeParse(body);
  const measurement = measurementTemplateUpdateSchema.safeParse(body);
  if (!status.success && !construction.success && !measurement.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }
  const result = status.success
    ? await transitionTemplate(id, status.data.status, user.id)
    : measurement.success
      ? await updateMeasurementTemplate(id, measurement.data, user.id)
      : await updateConstructionTemplate(
          id,
          construction.success ? construction.data : body,
          user.id,
        );
  return NextResponse.json(result, {
    status: result.ok ? 200 : result.error === "TEMPLATE_NOT_FOUND" ? 404 : 409,
  });
}

export async function DELETE(request: Request, context: RouteContext<"/api/templates/[id]">) {
  const user = await authorizedMutation(request);
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const construction = await deleteConstructionTemplate(id, user.id);
  const result = construction.ok ? construction : await deleteMeasurementTemplate(id, user.id);
  return NextResponse.json(result, {
    status: result.ok ? 200 : 404,
  });
}
