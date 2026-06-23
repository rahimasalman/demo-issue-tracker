# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server at http://localhost:3000
npm run build     # production build
npm run typecheck # type-check without emitting (tsc --noEmit)
```

There are no tests in this project.

## Architecture

This is a minimal kanban-style issue tracker built with Next.js 15 (App Router). All state is in-memory on the server and resets on restart. There is no database, no auth, and no external services.

### Data layer

`lib/types.ts` defines the core types:
- `Status` — union of `"backlog" | "todo" | "in_progress" | "done"`
- `Issue` — `{ id, title, description, status, order, createdAt }`
- `STATUSES` — ordered array of `{ key, label }` used to drive both the UI column order and the status dropdown

`lib/store.ts` exports a singleton `IssueStore` that manages a `Map<string, Issue>`. To survive Next.js dev hot-reloads without losing data, the instance is pinned to `globalThis.__issueStore` (skipped in production). The store seeds three example issues on first construction.

**Ordering** — every issue has a numeric `order` field. New issues get `max(order in column) + 1`. The `reorder()` method bulk-reassigns `order = index` from a caller-supplied `orderedIds` array and also updates `status`, making it the single write path for both drag-drop reorders and cross-column moves.

### API routes

All routes live under `app/api/` and import directly from `lib/store.ts`. Route params are typed as `Promise<{ id }>` (Next.js 15 async params).

| Method | Path | Body | Notes |
|--------|------|------|-------|
| GET | `/api/issues` | — | returns all issues sorted by `order` |
| POST | `/api/issues` | `{ title, description?, status? }` | `title` required; defaults status to `"backlog"` |
| GET | `/api/issues/:id` | — | 404 if missing |
| PATCH | `/api/issues/:id` | `{ title?, description?, status?, order? }` | moving to new status without supplying `order` auto-appends |
| DELETE | `/api/issues/:id` | — | 204 on success |
| PUT | `/api/columns/:status/reorder` | `{ orderedIds: string[] }` | reassigns both `order` and `status` for every id in the array |

### Frontend

`app/page.tsx` is a plain server component that renders `<Board />` inside a centered `.app` container.

`components/Board.tsx` is the only stateful component. It:
- Fetches all issues on mount and holds them in a single `issues: Issue[]` state
- Derives `byStatus: Record<Status, Issue[]>` via `useMemo` (sorted by `order`)
- Owns the `api<T>()` helper (typed fetch wrapper that throws on non-OK responses)
- Handles all mutations: add (`POST`), status change via dropdown (`PATCH`), and drag-drop reorder (`PUT /reorder`)

`components/Column.tsx` is a droppable container (`useDroppable` from dnd-kit). It wraps its cards in `SortableContext` and highlights with `.column.over` when a card is dragged over it.

`components/IssueCard.tsx` is a sortable drag handle (`useSortable`). The status `<select>` calls `stopPropagation` on `pointerDown` to prevent the drag sensor from firing when the user clicks the dropdown.

### Drag-and-drop flow

Uses `@dnd-kit/core` + `@dnd-kit/sortable` with a `PointerSensor` (4px activation distance).

1. **`onDragOver`** — optimistically updates local state when the card crosses into a new column (sets new `status` and appends to end of target column). No API call.
2. **`onDragEnd`** — computes the final ordered list for the destination column (using `arrayMove` for same-column reorders), updates local state, then calls `PUT /api/columns/:status/reorder` with the final `orderedIds`.

`findContainer()` resolves either a column id (a `Status` string) or a card id to the owning `Status`, which is how dnd-kit's over-target is translated into column identity.

### Styling

All styles are plain CSS in `app/globals.css` — no CSS modules, no Tailwind. Class names used by components: `.app`, `.new-issue`, `.board`, `.column`, `.column.over`, `.card`, `.card.dragging`, `.empty`, `.count`.

### Path alias

`@/` maps to the repo root (configured in `tsconfig.json`), so `@/lib/store`, `@/lib/types`, and `@/components/*` are the standard import paths.
