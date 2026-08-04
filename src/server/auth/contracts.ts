export type SessionUser = Readonly<{
  id: string;
  email: string;
  displayName: string;
  locale: string;
  roles: readonly string[];
}>;

export type PasswordIdentity = Readonly<{ id: string; tokenVersion: number }>;

export interface AuthService {
  authenticateWithPassword(email: string, password: string): Promise<PasswordIdentity | null>;
  createSession(identity: PasswordIdentity): Promise<void>;
  currentUser(): Promise<SessionUser | null>;
  logout(): Promise<void>;
}

export type OidcIdentity = Readonly<{
  issuer: string;
  subject: string;
  email?: string;
  displayName?: string;
}>;

export interface OidcAdapter {
  createAuthorizationUrl(state: string, nonce: string): Promise<URL>;
  exchangeAuthorizationCode(
    code: string,
    expectedState: string,
    expectedNonce: string,
  ): Promise<OidcIdentity>;
}
