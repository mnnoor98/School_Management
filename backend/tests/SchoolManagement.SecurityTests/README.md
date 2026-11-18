# Security regression tests

Run from the repository root:

```powershell
dotnet test backend/tests/SchoolManagement.SecurityTests/SchoolManagement.SecurityTests.csproj -m:1
```

The test runner requires .NET 10 SDK/runtime (TestHost 10); the application still targets .NET 8.
Tests host the actual API controllers and authorization policy with an isolated EF Core in-memory database and a test-only authentication scheme. They do not start the application's database migration/seed pipeline. A test filter prevents protected requests from executing action bodies if authorization regresses, so deployment and database operations cannot run.

Coverage includes anonymous and non-admin access to 24 sensitive routes, password bypass rejection, valid login, disabled-user refresh rejection, current database administrator authority, role revocation, and staff self-service profile/password updates.

Sensitive administration routes now require an active user whose current primary role is active, system-owned, has the exact `SUPER_ADMIN` code, and belongs to the user's school. Menu grants alone cannot grant access to these security controls. `/menus/my` remains available to authenticated users; account profile and password changes remain self-service. Existing `[AllowAnonymous]` overrides were removed from all backup/deployment actions. The SPA fallback remains public.

Campus isolation is now implemented and covered in `CampusTests.cs`, including all 21 operational entity types, scope spoofing, cross-campus CRUD, account creation, campus-specific permissions, aggregates, and private files. See [campus access documentation](../../CAMPUS_ISOLATION.md) for migration behavior and the separate PostgreSQL verifier. Explicit student/guardian ownership and payment verification/concurrency remain separate work. This integration runner uses test identities rather than production JWT signature validation.
