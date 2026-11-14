import type { RoleSlug } from '../../config/auth.constants';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  roles: RoleSlug[];
}

export interface AuthUser extends JwtPayload {
  userId: string;
  emailVerified: boolean;
  firstName?: string | null;
  lastName?: string | null;
}

export interface SessionResponse {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    roles: RoleSlug[];
    emailVerified: boolean;
  };
  csrfToken?: string;
}
