import { nestJsConfig } from '@calace/eslint-config/nestjs';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nestJsConfig,
  {
    ignores: ['prisma/**'],
  },
];
