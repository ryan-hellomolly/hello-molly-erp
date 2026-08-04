export function matchesOrigin(
  origin: string | null,
  applicationUrl: string,
  allowMissing: boolean,
) {
  if (!origin) {
    return allowMissing;
  }
  try {
    return new URL(origin).origin === new URL(applicationUrl).origin;
  } catch {
    return false;
  }
}
