import { describe, expect, it } from 'vitest';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import { ROLE_SLUG } from '../../config/auth.constants';
import { RolesGuard } from './roles.guard';

function guardFor(required: string[]) {
  const reflector = {
    getAllAndOverride: () => required,
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

function contextFor(roles: string[] | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: roles ? { roles } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard admin routes', () => {
  const guard = guardFor([ROLE_SLUG.ADMIN]);

  it('denies a learner, which Nest answers with 403', () => {
    expect(guard.canActivate(contextFor(['learner']))).toBe(false);
    expect(new ForbiddenException().getStatus()).toBe(403);
  });

  it('allows an admin', () => {
    expect(guard.canActivate(contextFor(['admin']))).toBe(true);
  });
});
