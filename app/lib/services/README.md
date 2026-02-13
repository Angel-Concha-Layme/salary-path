# Service and Query Pattern

Use this flow for every domain:

1. Define API contracts in `app/lib/models/<domain>/*.model.ts`.
2. Add/extend query keys in `query-keys.ts` (single source of truth).
3. Add typed services in `app/lib/services/<domain>/*.service.ts` for API I/O.
4. Build hooks in `app/hooks/<domain>/*` that consume those services.
5. For writes, use `useDomainMutation` or call `invalidateDomain` in `onSuccess`.

Rules:

- Do not place query keys inline in components.
- Keep cache invalidation at domain level through `cache-invalidation.ts`.
- Keep components focused on UI states (`loading`, `error`, `empty`, `success`).
