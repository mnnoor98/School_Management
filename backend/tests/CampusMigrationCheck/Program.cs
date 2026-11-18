using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Domain.Employee;
using SchoolManagement.Domain.School;
using SchoolManagement.Domain.Auth;
using SchoolManagement.Infrastructure.Persistence;

var connection = Environment.GetEnvironmentVariable("SCHOOLMANAGEMENT_TEST_POSTGRES")
    ?? throw new InvalidOperationException("Set SCHOOLMANAGEMENT_TEST_POSTGRES to a PostgreSQL connection with CREATE DATABASE permission.");
var databaseName = "school_campus_test_" + Guid.NewGuid().ToString("N");
var adminBuilder = new NpgsqlConnectionStringBuilder(connection) { Database = "postgres", Pooling = false };
await using var admin = new NpgsqlConnection(adminBuilder.ConnectionString);
await admin.OpenAsync();
await using (var create = new NpgsqlCommand($"CREATE DATABASE \"{databaseName}\"", admin)) await create.ExecuteNonQueryAsync();
try
{
    var testBuilder = new NpgsqlConnectionStringBuilder(connection) { Database = databaseName, Pooling = false };
    var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(testBuilder.ConnectionString).Options;
    await using (var database = new ApplicationDbContext(options))
    {
        await database.GetService<IMigrator>().MigrateAsync("20261019181224_InitialCreate");
        database.Schools.Add(new SchoolEntity { Id = "sch-01", Code = "TEST" });
        database.Branches.AddRange(
            new Branch { Id = "campus-main", SchoolId = "sch-01", Code = "BR-01" },
            new Branch { Id = "campus-north", SchoolId = "sch-01", Code = "BR-02" });
        database.Roles.Add(new Role { Id = "teacher-role", SchoolId = "sch-01", Code = "TEACHER" });
        database.Users.Add(new User { Id = "teacher-account", SchoolId = "sch-01", BranchId = "campus-north", RoleId = "teacher-role", Username = "north-user" });
        await database.SaveChangesAsync();
        await database.Database.ExecuteSqlRawAsync("""
            INSERT INTO employee.teachers
                ("Id", "SchoolId", "EmployeeCode", "FullName", "Designation", "Department", "Qualification", "Email", "Phone", "JoiningDate", "Status", "Avatar", "AssignedSubjectsJson", "CreatedAt")
            VALUES ('legacy-teacher', 'sch-01', 'EMP-001', 'Legacy Teacher', '', '', '', '', '', now(), 'Active', '', '[]', now());
            INSERT INTO auth.role_menu_permissions
                ("Id", "RoleId", "MenuCode", "View", "Create", "Edit", "Delete", "Approve", "Export", "CreatedAt")
            VALUES ('legacy-grant', 'teacher-role', 'DASHBOARD', true, false, false, false, false, false, now());
            INSERT INTO auth.user_menu_permissions
                ("Id", "UserId", "MenuCode", "Action", "Override", "CreatedAt")
            VALUES ('legacy-override', 'teacher-account', 'DASHBOARD', 'view', 1, now());
            INSERT INTO system.notices
                ("Id", "SchoolId", "Title", "Category", "TargetAudience", "PublishedDate", "Content", "IsImportant", "Author", "CreatedAt")
            VALUES ('legacy-notice', 'sch-001', 'Legacy notice', 'General', 'All', now(), 'Preserved notice', false, 'Office', now());
            """);
        await database.Database.MigrateAsync();
        var legacy = await database.Teachers.SingleAsync(t => t.Id == "legacy-teacher");
        if (legacy.BranchId != "campus-main") throw new InvalidOperationException("Legacy campus backfill failed.");
        var notice = await database.Notices.SingleAsync(n => n.Id == "legacy-notice");
        if (notice.SchoolId != "sch-01" || notice.BranchId != "campus-main") throw new InvalidOperationException("Legacy notice school alias repair failed.");
        if (await database.RoleMenuPermissions.CountAsync() != 2) throw new InvalidOperationException("Existing role grants were not preserved for both campuses.");
        if ((await database.UserMenuPermissions.SingleAsync()).BranchId != "campus-north") throw new InvalidOperationException("User override campus migration failed.");
        await MenuCatalog.SynchronizeAsync(database);
        var menuCount = await database.Menus.CountAsync();
        var grantCount = await database.RoleMenuPermissions.CountAsync();
        await MenuCatalog.SynchronizeAsync(database);
        if (menuCount != await database.Menus.CountAsync() || grantCount != await database.RoleMenuPermissions.CountAsync())
            throw new InvalidOperationException("PostgreSQL role menu synchronization is not idempotent.");
        if (await database.Menus.CountAsync(menu => menu.Code == "TEACH_LEAVE") != 1)
            throw new InvalidOperationException("PostgreSQL role menu catalog update failed.");
        database.Teachers.Add(new Teacher { Id = "north-teacher", SchoolId = "sch-01", BranchId = "campus-north", EmployeeCode = "EMP-001" });
        await database.SaveChangesAsync();
        if ((await database.Database.GetPendingMigrationsAsync()).Any()) throw new InvalidOperationException("Migrations remain pending.");
    }
    foreach (var branch in new[] { "campus-main", "campus-north" })
    {
        await using var scoped = new ApplicationDbContext(options, new TestCampus(branch));
        if (await scoped.Teachers.CountAsync() != 1) throw new InvalidOperationException("PostgreSQL campus query isolation failed.");
        var inserted = new Teacher { Id = "new-" + branch, SchoolId = "forged-school", BranchId = "forged-campus", EmployeeCode = "NEW" };
        scoped.Teachers.Add(inserted);
        await scoped.SaveChangesAsync();
        if (inserted.SchoolId != "sch-01" || inserted.BranchId != branch) throw new InvalidOperationException("PostgreSQL campus stamping failed.");
    }
    Console.WriteLine("PASS: initial schema, legacy backfill, campus uniqueness, PostgreSQL isolation, write stamping and role menu synchronization.");
}
finally
{
    // The only database dropped is the disposable name generated above.
    if (!databaseName.StartsWith("school_campus_test_", StringComparison.Ordinal)
        || databaseName.Length != "school_campus_test_".Length + 32) throw new InvalidOperationException("Invalid disposable database name.");
    await using var drop = new NpgsqlCommand($"DROP DATABASE \"{databaseName}\" WITH (FORCE)", admin);
    await drop.ExecuteNonQueryAsync();
}

sealed class TestCampus(string branch) : ICampusContext
{
    public bool BypassIsolation => false;
    public bool IsResolved => true;
    public bool IsSuperAdmin => true;
    public string UserId => "root";
    public string SchoolId => "sch-01";
    public string BranchId => branch;
}
