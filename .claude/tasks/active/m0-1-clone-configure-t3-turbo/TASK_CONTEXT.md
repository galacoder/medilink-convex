# Task Context: m0-1-clone-configure-t3-turbo

## Status: AWAITING_APPROVAL

## Task
M0-1: Clone and Configure T3 Turbo Template - Rename @acme/* to @medilink/*, remove apps/tanstack-start/, rename apps/nextjs/ to apps/web/, remove Drizzle/Prisma boilerplate (Convex replaces DB), update turbo.json pipeline, verify build succeeds.

## Branch
- **Branch**: feat/m0-1/clone-configure-t3-turbo
- **Worktree**: /home/sangle/dev/worktrees/m0-1-clone-configure-t3-turbo
- **Base**: main

## GitHub Issue
- **Issue**: #46 - M0-1: Clone and Configure T3 Turbo Template
- **Labels**: type:scaffold, priority:critical, milestone:M0
- **Blocks**: M0-2 (#47), M0-3 (#48), M0-4 (#49), M0-5 (#50), M0-6 (#51)

## Progress
- Waves: 0/4 completed
- Features: 0/19 completed
- Current Wave: None (awaiting approval)

## Verification Commands
```bash
pnpm install
pnpm typecheck
pnpm build
pnpm lint
grep -r '@acme/' --exclude-dir=node_modules .
```

## Source of Truth
- feature_list.json (machine-readable)
- PLAN.md (human-readable)
- DISCOVERY.md (exploration findings)
- tests.json (test tracking)
