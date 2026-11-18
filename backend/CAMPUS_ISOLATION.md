# Campus access

Ordinary users operate only within the active campus assigned to their current database account, subject to their role permissions. Their JWT's old branch/role labels and client-supplied ownership fields cannot override database assignment. An `X-Campus-Id` header pointing elsewhere returns 403.

Super Admin is determined from the active, system-owned `SUPER_ADMIN` database role. After login or session restoration, the dashboard requires an active campus selection. Campus business requests without a selection return 400. Only active campuses within the account's school are selectable. `ALL`, inactive campuses and another school's campuses are rejected.

EF query filters isolate all 21 campus-owned entity types by SchoolId and BranchId, including academic records, students, teachers, attendance/corrections, exams/marks, finance, notices/audit logs, role grants and user overrides. SaveChanges stamps new records and rejects ownership changes, attached foreign records and references to another campus. Account creation uses the active campus; account administration lists and updates follow that campus. Own profile/password operations remain available separately. Permission changes in one campus do not affect another.

The school profile, campus directory, role catalog and menu definitions are shared school/system configuration. Only Super Admin can change school/campus configuration or security controls. Backup, restore and deployment remain system administration operations; they are not campus-limited backups.

The UI clears operational arrays on campus/account changes and cancels old requests. Responses from an old scope are ignored. Existing browser-only leave/SMS/schedule data is now stored under school/campus/user keys; these features remain browser-local, not shared server records. Seeded sample lists and old unscoped browser caches are not loaded as live campus data. Campus selection is mandatory after a fresh Super Admin login/reload.

New files are stored outside wwwroot under private school/campus directories and read through authenticated campus endpoints. Images use authenticated blob requests. Legacy public `/uploads` URLs are blocked because they lack trustworthy ownership; upload those files again under the intended campus if needed. Existing files are not deleted.

## Migration and startup

The API applies migrations at startup. The local development API has now been rebuilt and restarted with the matching frontend bundle in wwwroot, and both campus migrations have been applied. Database, API binary and frontend backups are recorded in `src/SchoolManagement.Api/deployments/campus-activation-backups.json`.

`AddCampusIsolation` adds campus ownership and backfills legacy business records to each school's primary campus (BR-01/br-01 first, otherwise its first branch). The old schema has no campus history, so no attempt is made to infer ownership from names or browser demo data. A school with legacy records must have a branch; the migration aborts transactionally if it cannot assign one.

An exact legacy notice alias (`sch-001` instead of `sch-01`) is repaired only when `sch-01` is the sole school and no real `sch-001` school exists. This case is covered by the PostgreSQL migration verifier; records are never merged between actual schools.

`ScopeCampusPermissions` preserves the old school-wide role matrix as the initial matrix for each existing campus, and assigns explicit user overrides to their account's campus. New campuses start without role grants; configure their permission matrix before using ordinary accounts there. Fresh demo seeding creates grants for both seeded campuses.

Take a database backup before applying migrations to an existing installation. Downgrading after campuses diverge requires reconciling campus-specific codes and role grants with the old global unique constraints; a downgrade must not silently choose or discard one campus's data.

Manual migration commands use the API's appsettings/environment connection through a design-time factory, without running startup seeding:

```powershell
dotnet ef database update --project backend/src/SchoolManagement.Infrastructure --startup-project backend/src/SchoolManagement.Api
```

## Verification

```powershell
dotnet test backend/tests/SchoolManagement.SecurityTests/SchoolManagement.SecurityTests.csproj -m:1
cd Fontend
npm run build
```

The security integration runner uses .NET 10; the API remains .NET 8. Tests use an isolated in-memory database and test authentication, not real user sessions.

For the PostgreSQL migration verifier, set `SCHOOLMANAGEMENT_TEST_POSTGRES` to a PostgreSQL connection with CREATE DATABASE permission, then run:

```powershell
dotnet run --project backend/tests/CampusMigrationCheck/CampusMigrationCheck.csproj
```

It creates a uniquely named disposable database, applies the original schema, inserts representative legacy records/grants, applies both campus migrations, and verifies legacy preservation, campus uniqueness, filtered reads and ownership stamping. Its generated test database is dropped afterward; the configured application's database is not migrated or modified.
