# SQL migrations

- Add numbered files: `002_add_foo.sql`, `003_bar.sql`, … (lexicographic order).
- Each file is executed in a **transaction**; on success the filename is stored in `schema_migrations`.
- **Do not edit** a migration after it has run in any shared environment — add a new file instead.
- Run from repo root: `npm run migrate -w api` (requires `api/.env` / DB env vars).

The initial `001_noop.sql` verifies the pipeline; safe to apply on a DB imported from `u334425891_sbm.sql`.
