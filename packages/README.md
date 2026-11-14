# Packages

| Package                      | Path                         | Description              |
| ---------------------------- | ---------------------------- | ------------------------ |
| `@calace/db`                 | `packages/db`                | Prisma schema, migrations, seed — see [packages/db/README.md](db/README.md) |
| `@calace/content-blocks`     | `packages/content-blocks`    | Lesson block schema v2, progress helpers — see [packages/content-blocks/README.md](content-blocks/README.md) |
| `@calace/ui`                 | `packages/ui`                | shadcn/ui design system  |
| `@calace/typescript-config`  | `packages/typescript-config` | Shared `tsconfig` bases  |
| `@calace/eslint-config`      | `packages/eslint-config`     | Shared ESLint flat configs |

Internal packages are `private` and consumed via `workspace:*` protocol.
