import { SetMetadata } from '@nestjs/common';

import type { RoleSlug } from '../../config/auth.constants';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleSlug[]) => SetMetadata(ROLES_KEY, roles);
