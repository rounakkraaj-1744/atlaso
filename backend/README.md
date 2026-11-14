# Atlaso backend

Express and TypeScript API for Atlaso, using PostgreSQL, Drizzle ORM, and Better Auth. The existing frontend stores the canvas as `CanvasNode[]` and `Connection[]`; the API preserves both arrays as JSONB without reshaping their contents.

## Local setup

Requirements: Node.js 20+ and PostgreSQL 15+.

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and a random `BETTER_AUTH_SECRET` of at least 32 characters.
2. Create the PostgreSQL database named in `DATABASE_URL`.
3. Run `npm install`, `npm run db:migrate`, and `npm run dev`.
4. Run the frontend with `VITE_API_URL=http://localhost:3000/api npm run dev` from `../frontend`.

Database schema changes are generated with `npm run db:generate` and applied with `npm run db:migrate`. `db:push` is available for local prototyping only; production uses migrations.

## Scripts

- `npm run dev`: watch mode server
- `npm run build`: strict TypeScript build
- `npm start`: run compiled server
- `npm run db:generate`: generate a Drizzle migration
- `npm run db:migrate`: apply migrations
- `npm run db:seed`: add a demo project for the first Better Auth user

## Authentication

Better Auth email and password endpoints are mounted at `/api/auth/*`. Browser requests use secure session cookies and CORS credentials. The current frontend has no account screens, so users can register through Better Auth's standard endpoints; protected API calls return 401 until a session cookie exists. The API derives ownership from the authenticated session, never from a client-supplied user ID.

## API

The existing frontend contract is kept at `/api/architecture`:

- `GET /api/architecture?page=1&limit=20`
- `POST /api/architecture` with `{ name, description, nodes, edges, canvasMetadata?, projectId? }`
- `GET`, `PATCH`, `DELETE /api/architecture/:id`
- `POST /api/architecture/:id/fork`
- `POST /api/architecture/:id/provider-mapping` with `{ provider, mode }`
- Project CRUD under `/api/v1/projects` (legacy `/api/projects` remains available)
- Project-scoped architecture CRUD under `/api/v1/projects/:projectId/architectures`
- Architecture CRUD under `/api/v1/architectures`
- `GET` and revision-checked `PUT /api/v1/architectures/:id/canvas` persist the complete canvas JSONB document atomically
- `GET /api/health` checks database connectivity

Architecture updates increment `version`; canvas saves use the separate `ArchitectureDocument.revision` and clients must send `expectedRevision`. A stale canvas save returns HTTP 409 with the current revision. Canvas nodes, connections, viewport, settings, and unknown document properties are stored unchanged in JSONB. Provider mapping with `keep-manual` preserves nodes whose `providerMapping.mappingStatus` is `manual`.

## Current scope and limitations

- The frontend supports project creation and selection, creates multiple architectures in the selected project, and restores the last opened architecture after refresh. If no project ID is supplied to the legacy architecture API, the API creates a project named after the architecture for compatibility.
- The frontend’s analysis/simulation panel still runs its existing client-side estimator. It is not a measured production simulation. Backend simulation persistence, comments, AI documentation generation, and validation endpoints are not implemented yet.
- Provider mapping catalogs are starter mappings and should be expanded with product-reviewed mappings. Preview mode currently explains that preview is unavailable.
- Apply the additive `0002_new_lord_tyger.sql` migration with `npm run db:migrate` before starting the updated API against an existing database.
