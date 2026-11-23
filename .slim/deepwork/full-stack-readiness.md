# Full-stack readiness work

## Goal
Make the existing Saneamento Santos Java API and frontend usable together locally and leave external production integrations clearly configurable.

## Baseline
- HEAD: `3490dba feat(backend) for complete all rotes` on `main`.
- Pre-existing local change: `backend/.gitignore` ignores `data/santos-service-area.geojson`, created in the previous user-authorized task.
- The ignored `backend/data/santos-service-area.geojson` is configured via the ignored `backend/.env`; the backend service-area validator accepted an inside point and rejected an outside point in the prior turn.
- Docker is not installed/available in PATH.
- The API implements routes for identity, cases, notices, public cases, geocoding, CEP and indicators. Password recovery and address geocoding deliberately return 503. Frontend defaults to in-memory demo mode.
- Mongo URI is locally configured; its value is sensitive and must not be printed or copied.

## Scope and decisions
1. Map frontend calls to actual API DTOs/routes, correct pagination and recovery UI/API contract.
2. Implement safe, optional backend providers and account/type provisioning that are activated only by explicit environment configuration. Never add default passwords, seed invented official categories, or expose recovery tokens.
3. Document local Mongo replica-set and production prerequisites without replacing the user's configured database or selecting a hosting provider.
4. Review implementation against contracts and run non-test checks only; user requested implementation, not test execution.

## Phases
- [x] Phase 1: inspect route/DTO parity; implement frontend contract fixes and recovery reset flow.
- [x] Phase 2: configurable email recovery, geocoder and institution/type provisioning.
- [x] Phase 3: local Mongo replica-set setup guidance, production config guidance and runbook.
- [x] Phase 4: single-agent diff review, applicable build/type checks (no tests unless requested), document remaining externally blocked setup.

## External blockers
- Actual mail relay credentials and recovery link origin are unknown.
- Official active case-type catalog is not supplied.
- Names/emails/passwords for Sabesp and Prefeitura accounts are not supplied.
- Docker unavailable; no local Mongo replica set startup can be confirmed.
- Hosting provider/environment is unspecified.

## Review rationale
Cross-cutting edits can break interfaces, auth flows and multipart formats. The current agent performs a fresh single-agent review because subagents are unavailable under active policy. Git publication/deployment are out of scope.

## Results
- 
pm.cmd run typecheck, 
pm.cmd run build, frontend architecture check, .gradlew.bat compileTestJava, and final .gradlew.bat bootJar succeeded. No test methods were executed.
- Targeted Prettier check and git diff --check succeeded.
- Docker compose could not be exercised because Docker is unavailable. Email recovery needs SMTP variables; service geocoding provider intentionally remains a setup choice; institutional accounts and official case types require organization-supplied data.
- No commit, push, publish, or deployment was performed.


## Follow-up: Nominatim and test users
- User selected OpenStreetMap Nominatim. Backend integration now uses configurable endpoint and application User-Agent, 1.1-second per-instance request spacing, in-memory cache, bounded query timeouts, and excludes house number, postal code, and reference from outgoing query.
- Confirmed MongoDB users collection was initially empty. Created and smoke-checked citizen, Sabesp, and Prefeitura demo accounts from ignored local `.env` seed variables; no prior records were changed.
- Smoke-checked `GET /api/v1/health`, login for all three profiles, and geocoding a public Santos landmark through Nominatim.
- Final `bootJar` passed. No automated test suite was run.
