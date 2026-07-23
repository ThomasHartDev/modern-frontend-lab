# modern-frontend-lab

A living reference of modern front-end technique in a Next.js 15 + React 19 app. Each route is a self-contained demonstration of one concept with notes on the tradeoffs.

## What this demonstrates

Front-end work has changed a lot since the SPA-everything era: rendering moved back to the server, data fetching moved into the component tree, and performance is measured against real user metrics instead of synthetic scores. This repo is a set of small, correct demonstrations of that shift. Every concept lives on its own route, has tests, and comes with a short write-up of why the pattern exists and when it stops paying off.

## Concepts demonstrated

- React Server Components: server-first rendering, less client JavaScript
- Streaming SSR with Suspense boundaries and progressive hydration
- Suspense-based data fetching instead of scattered loading flags
- Server Actions: mutations that run on the server with no client fetch handler
- Optimistic UI with `useOptimistic`: predicted state that reverts on failure
- `useActionState` and `useFormStatus` for form result, error, and pending states
- Request-scoped memoization for fetch deduplication (the `React.cache()` pattern)
- Out-of-order streaming: boundaries flush by resolution time, not tree order
- Pure reducers and discriminated-union actions for client state transitions
- React Context with split state/dispatch providers
- External stores via `useSyncExternalStore` and selector subscriptions
- Re-render isolation: when context wins vs when a store wins
- App Router file conventions (`layout`, `page`, `loading`, `error`)
- Type-safe design tokens as a single origin for color, spacing, and type scale
- Core Web Vitals: LCP, CLS, and INP tracked against a budget
- List virtualization for large collections
- Accessibility: semantic roles, focus management, accessible names
- Strict TypeScript with `noUncheckedIndexedAccess` and discriminated unions

## What's implemented

- Scaffold: Next.js 15 App Router, React 19, strict TypeScript, Vitest + Testing Library, GitHub Actions CI, and a design-token stylesheet. The home route lists the planned concepts using an accessible `ConceptCard` component.
- Design tokens: a typed token tree in `src/tokens` that generates the app's CSS custom properties. The root layout injects the generated `:root` rule at render time, so the token module is the runtime source and there is no second copy to drift. See the `/tokens` route.
- Server Components + streaming: the `/streaming` route is a Server Component whose three cards are each their own async Server Component behind a Suspense boundary. The shell flushes first, then each card streams in as its own fetch settles, fastest first. Data comes from a small simulated layer built on a request-scoped memoizing loader (the `React.cache()` pattern), so components that read the same key during one render share a single fetch and a rejection is cached the same way. Tests cover the loader dedup, out-of-order settle order, and the async components rendered to static markup. See the `/streaming` route.
- Server actions & optimistic UI: the `/data-patterns` route mutates a note list through a Server Action, so the browser never runs a fetch handler or a client API layer. `useActionState` holds the confirmed list plus the last error, `useOptimistic` overlays the in-flight note on top of it, and `useFormStatus` drives the pending button. The overlay is only a prediction, so React discards it when the action settles and a rejected write reverts on its own with no manual rollback. The mutation core (`applyAdd`) takes an injected store, which keeps validation, the fail path, and the store-throws path testable without the Next runtime. Tests cover trimming and length validation, the optimistic reducer folding pending dispatches newest-first, and confirmed state staying put on every failure mode. See the `/data-patterns` route.
- Client state patterns: the `/state-management` route runs one pure cart reducer in two hosts. Context + `useReducer` (split state/dispatch) re-renders every state consumer on any field change. An external store on `useSyncExternalStore` lets each leaf select a slice and skip the render when that slice is unchanged. Typing the note field is the repro: context bumps badge and total counters; the store leaves them alone.

## Stack

- Next.js 15 (App Router) and React 19
- TypeScript in `strict` mode with `noUncheckedIndexedAccess`
- Vitest + @testing-library/react running in jsdom
- GitHub Actions for typecheck and tests on every push and PR

## Running it

```bash
pnpm install
pnpm dev        # start the app at http://localhost:3000
pnpm typecheck  # tsc --noEmit
pnpm test       # vitest run
```

The `ConceptCard` component is the first tested surface. It renders as a link when a route exists and as static content when the concept is only planned, so the list never shows dead links:

```tsx
import { ConceptCard } from '@/components/concept-card'

<ConceptCard
  title="Design tokens"
  description="A typed token system for color, spacing, and type scale."
  status="planned"
/>
```

Each streaming card is an async Server Component reading from a request-scoped store, wrapped in its own boundary so it streams independently:

```tsx
const store = createDataStore() // one per request, so the loaders memoize per render

<Suspense fallback={<Skeleton label="profile" lines={2} />}>
  <ProfileCard store={store} id="u1" />   // async () => <section>…</section>
</Suspense>
```

Optimistic UI overlays the in-flight write on the confirmed list, and the mutation core stays a plain function so it is tested without the framework:

```tsx
const [state, dispatch] = useActionState(addNote, { notes: [], error: null })
const [optimistic, addOptimistic] = useOptimistic(toDisplayList(state.notes), reduceOptimistic)

async function onSubmit(formData: FormData) {
  addOptimistic({ tempId: crypto.randomUUID(), text: String(formData.get('text')) })
  await dispatch(formData) // Server Action; React drops the overlay when it settles
}

// applyAdd({ notes: [], error: null }, { text: '  hi ', fail: false }, store)
//   -> { notes: [{ id, text: 'hi', createdAt }], error: null }
// fail or a thrown store -> confirmed list unchanged, error set
```

The same cart reducer can sit in Context or in an external store. Selectors decide who re-renders:

```tsx
const store = createReducerStore(cartReducer, EMPTY_CART)
const count = useStoreSelector(store, selectItemCount)
store.dispatch({ type: 'setNote', note: 'gift' }) // count subscriber stays quiet
```

Styles reference tokens through a typed helper, so a bad name fails to compile:

```tsx
import { token } from '@/tokens'

<div style={{ color: token('color', 'accent'), padding: token('space', '4') }} />
// token('color', 'nope') -> type error
```

## Layout

```
app/                 App Router routes, layout, and global tokens
src/components/      shared, tested UI primitives
src/state/           pure cart reducer, context provider, external store
src/tokens/          typed design tokens and CSS variable generation
test/                Vitest specs and setup
```
