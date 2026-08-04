import "server-only";
import type { AuthService, PasswordIdentity, SessionUser } from "./contracts";
import { authenticate, createUserSession, getCurrentUser, revokeCurrentSession } from "./session";

type AuthPorts = {
  authenticate(email: string, password: string): Promise<PasswordIdentity | null>;
  createSession(userId: string, tokenVersion: number): Promise<void>;
  currentUser(): Promise<SessionUser | null>;
  logout(): Promise<void>;
};

const defaultPorts: AuthPorts = {
  authenticate,
  createSession: createUserSession,
  currentUser: getCurrentUser,
  logout: revokeCurrentSession,
};

export class DefaultAuthService implements AuthService {
  constructor(private readonly ports: AuthPorts = defaultPorts) {}
  authenticateWithPassword(email: string, password: string) {
    return this.ports.authenticate(email.trim().toLowerCase(), password);
  }
  createSession(identity: PasswordIdentity) {
    return this.ports.createSession(identity.id, identity.tokenVersion);
  }
  currentUser() {
    return this.ports.currentUser();
  }
  logout() {
    return this.ports.logout();
  }
}

export const authService: AuthService = new DefaultAuthService();
