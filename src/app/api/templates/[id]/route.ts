import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import {
  constructionTemplateUpdateSchema,
  deleteConstructionTemplate,
  deleteMeasurementTemplate,
  deleteProcessTemplate,
  measurementTemplateUpdateSchema,
  processTemplateUpdateSchema,
  templateStatusSchema,
  transitionTemplate,
  updateConstructionTemplate,
  updateMeasurementTemplate,
  updateProcessTemplate,
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
  const process = processTemplateUpdateSchema.safeParse(body);
  if (!status.success && !construction.success && !measurement.success && !process.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }
  const result = status.success
    ? await transitionTemplate(id, status.data.status, user.id)
    : measurement.success
      ? await updateMeasurementTemplate(id, measurement.data, user.id)
      : process.success
        ? await updateProcessTemplate(id, process.data, user.id)
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
  const afterConstruction =
    construction.ok || construction.error !== "TEMPLATE_NOT_FOUND"
      ? construction
      : await deleteMeasurementTemplate(id, user.id);
  const result =
    afterConstruction.ok || afterConstruction.error !== "TEMPLATE_NOT_FOUND"
      ? afterConstruction
      : await deleteProcessTemplate(id, user.id);
  return NextResponse.json(result, {
    status: result.ok ? 200 : result.error === "TEMPLATE_NOT_FOUND" ? 404 : 409,
  });
}
