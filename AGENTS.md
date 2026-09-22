<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Túmin app — instrucciones para agentes

**Producto:** billetera comunitaria Túmin (Ŧ) + bazar + coordinación + mensajería. Ledger en PostgreSQL.

## Leer primero

1. [`../docs/project/agent-context.md`](../docs/project/agent-context.md) — hub (stack, invariantes, dónde nos quedamos)
2. [`../docs/init/generalrules.md`](../docs/init/generalrules.md) — bun, shadcn, tipado, Next 16
3. [`../docs/project/testing-harness-agents.md`](../docs/project/testing-harness-agents.md) — contrato de tests
4. [`../docs/project/devlog-summary.md`](../docs/project/devlog-summary.md) — historial condensado (no el archive)

## Stack

Next.js 16 · React 19 · tRPC 11 · Drizzle · Zod 4 · Auth.js v5 · UploadThing · shadcn/Base UI · Motion · Zustand · **bun**

**No** usamos Payload CMS ni next-intl. Usa Context7 / docs oficiales para APIs recientes.

## Convenciones rápidas

- Package manager: `bun run …` (no npm/pnpm por defecto)
- UX principal: SPA en `/` con pantallas Zustand (`src/lib/store.ts` + `Dashboard`), no una ruta App Router por pantalla
- Tipado estricto: Zod + interfaces; evitar `as any` y eslint-disable
- UI base: shadcn; español de México; mobile-first
- Dinero: saldos derivados del ledger; emisión solo SYSTEM (`src/lib/system-ledger.ts`)
- Tests: nunca Neon; ver harness antes de tocar suites

## Gate antes de dar por terminado

```bash
bun run typecheck && bun run lint && bun run test:unit && bun run test:integration && bun run test:components
```
