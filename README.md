# Túmin app

Billetera comunitaria **Túmin** (Next.js 16 + Drizzle + tRPC). Código y git de este directorio.

```bash
bun run dev          # desarrollo
bun run build        # producción
bun run typecheck && bun run lint && bun run test:unit && bun run test:integration && bun run test:components
bun run db:migrate   # migraciones Drizzle
```

## Para agentes

- Este repo: [`AGENTS.md`](./AGENTS.md)
- Hub del workspace: [`../docs/project/agent-context.md`](../docs/project/agent-context.md)
- Resumen historial: [`../docs/project/devlog-summary.md`](../docs/project/devlog-summary.md)
- Tests: [`../docs/project/testing-harness-agents.md`](../docs/project/testing-harness-agents.md)
