import "server-only";
import { getCurrentUser } from "./session";
export async function requireSystemAdmin() {
  const user = await getCurrentUser();
  if (!user?.roles.includes("SYSTEM_ADMIN")) {
    return null;
  }
  return user;
}
