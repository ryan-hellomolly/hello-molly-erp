import "server-only";
import { authService } from "./auth-service";
export async function requireSystemAdmin() {
  const user = await authService.currentUser();
  if (!user?.roles.includes("SYSTEM_ADMIN")) {
    return null;
  }
  return user;
}
