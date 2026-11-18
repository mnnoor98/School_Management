using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SchoolManagement.Api.Controllers;
using SchoolManagement.Api.Middleware;
using SchoolManagement.Api.Security;
using SchoolManagement.Application;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Auth;
using SchoolManagement.Domain.Employee;
using SchoolManagement.Domain.Common;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Domain.School;
using SchoolManagement.Domain.Student;
using SchoolManagement.Infrastructure.Identity;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Infrastructure.Services;
using Xunit;

namespace SchoolManagement.SecurityTests;

public sealed class CampusTests : IDisposable
{
    private readonly IHost host;
    private readonly HttpClient client;
    private readonly string fileRoot;

    public CampusTests()
    {
        var databaseName = Guid.NewGuid().ToString();
        fileRoot = Path.GetFullPath(Path.Combine(Path.GetTempPath(), "SchoolManagementCampusTests", databaseName));
        Directory.CreateDirectory(fileRoot);
        host = new HostBuilder().ConfigureWebHost(web => web.UseContentRoot(fileRoot).UseTestServer()
            .ConfigureServices(services =>
            {
                services.AddControllers().AddApplicationPart(typeof(StudentsController).Assembly);
                services.AddHttpContextAccessor();
                services.AddScoped<CampusContext>();
                services.AddScoped<ICampusContext>(provider => provider.GetRequiredService<CampusContext>());
                services.AddDbContext<ApplicationDbContext>(options => options.UseInMemoryDatabase(databaseName));
                services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
                services.AddScoped<ICurrentUserService, CurrentUserService>();
                services.AddScoped<IStudentAccessService, StudentAccessService>();
                services.AddScoped<IPermissionService, PermissionEngine>();
                services.AddScoped<ITokenService, TokenService>();
                services.AddScoped<IExcelImportExportService, ExcelImportExportService>();
                services.AddScoped<ISmsGatewayService, SmsGatewayService>();
                services.AddMemoryCache();
                services.AddScoped<ICampusCacheService, CampusCacheService>();
                services.AddApplicationServices();
                services.AddAuthentication("Test").AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("Test", _ => { });
                services.AddSecurityPolicies();
            })
            .Configure(app =>
            {
                app.UseMiddleware<ExceptionHandlingMiddleware>();
                app.UseRouting();
                app.UseAuthentication();
                app.UseMiddleware<CampusScopeMiddleware>();
                app.UseAuthorization();
                app.UseEndpoints(endpoints => endpoints.MapControllers());
            })).Build();
        host.Start();
        client = host.GetTestClient();
        using var scope = host.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        database.Schools.AddRange(new SchoolEntity { Id = "school1", Code = "S1" }, new SchoolEntity { Id = "school2", Code = "S2" });
        database.Branches.AddRange(
            new Branch { Id = "campus1", SchoolId = "school1", Code = "C1", Name = "Main" },
            new Branch { Id = "campus2", SchoolId = "school1", Code = "C2", Name = "North" },
            new Branch { Id = "other-school", SchoolId = "school2", Code = "C3" },
            new Branch { Id = "inactive", SchoolId = "school1", Code = "C4", IsActive = false });
        database.Roles.AddRange(
            new Role { Id = "super", SchoolId = "school1", Code = "SUPER_ADMIN", IsSystem = true },
            new Role { Id = "teacher", SchoolId = "school1", Code = "TEACHER" });
        database.Users.AddRange(
            new User { Id = "root", Username = "root", SchoolId = "school1", BranchId = "campus1", RoleId = "super", RoleName = "Super Admin" },
            new User { Id = "staff", Username = "admin", SchoolId = "school1", BranchId = "campus1", RoleId = "teacher", RoleName = "Teacher" },
            new User { Id = "north", Username = "north", SchoolId = "school1", BranchId = "campus2", RoleId = "teacher", RoleName = "Teacher" });
        database.RoleMenuPermissions.AddRange(
            new RoleMenuPermission { Id = "grant-main", SchoolId = "school1", BranchId = "campus1", RoleId = "teacher", MenuCode = "DASHBOARD", View = true },
            new RoleMenuPermission { Id = "grant-north", SchoolId = "school1", BranchId = "campus2", RoleId = "teacher", MenuCode = "DASHBOARD", View = true });
        database.Menus.AddRange(
            new Menu { Id = "menu-dashboard", Code = "DASHBOARD", Route = "/app/dashboard" },
            new Menu { Id = "menu-finance", Code = "FINANCE", Type = MenuType.Group },
            new Menu { Id = "menu-fees", Code = "FIN_FEES", ParentCode = "FINANCE", Route = "/app/finance/structure" },
            new Menu { Id = "menu-collection", Code = "FIN_COLLECTION", ParentCode = "FINANCE", Route = "/app/finance/collection" },
            new Menu { Id = "menu-security", Code = "SECURITY", Type = MenuType.Group },
            new Menu { Id = "menu-users", Code = "SEC_USERS", ParentCode = "SECURITY", Route = "/app/admin/users" });
        foreach (var (school, campus, suffix) in new[] { ("school1", "campus1", "1"), ("school1", "campus2", "2"), ("school2", "other-school", "3") })
        {
            database.Classes.Add(new SchoolClass { Id = "class" + suffix, SchoolId = school, BranchId = campus, Code = "C", Name = "Class " + suffix });
            database.Students.Add(new Student { Id = "student" + suffix, SchoolId = school, BranchId = campus, AdmissionNo = "A" + suffix, FullName = "Student " + suffix });
            database.Teachers.Add(new Teacher { Id = "teacher" + suffix, SchoolId = school, BranchId = campus, EmployeeCode = "EMP" + suffix });
            database.StudentInvoices.Add(new StudentInvoice { Id = "invoice" + suffix, SchoolId = school, BranchId = campus, StudentId = "student" + suffix, InvoiceNo = "INV" + suffix, NetAmount = int.Parse(suffix) * 100, DueAmount = int.Parse(suffix) * 100 });
        }
        database.SaveChanges();
    }

    private async Task<HttpResponseMessage> Send(string method, string path, string user = "staff", string? campus = null, object? body = null)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), "/api/v1/" + path);
        request.Headers.Add("X-Test-Identity", user);
        if (campus != null) request.Headers.Add("X-Campus-Id", campus);
        if (body != null) request.Content = JsonContent.Create(body);
        return await client.SendAsync(request);
    }

    [Theory]
    [InlineData("students", "student1")]
    [InlineData("teachers", "teacher1")]
    [InlineData("classes", "class1")]
    [InlineData("fees/invoices", "invoice1")]
    public async Task Staff_lists_only_their_assigned_campus(string path, string expected)
    {
        var response = await Send("GET", path);
        var respBody = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.OK, $"Failed with status {response.StatusCode}, body: {respBody}");
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var rows = json.GetProperty("data").EnumerateArray().ToArray();
        Assert.Single(rows);
        Assert.Equal(expected, rows[0].GetProperty("id").GetString());
        Assert.Equal("campus1", rows[0].GetProperty("branchId").GetString());
    }

    [Theory]
    [InlineData("GET", "students")]
    [InlineData("POST", "teachers")]
    [InlineData("PUT", "teachers/teacher2")]
    [InlineData("DELETE", "teachers/teacher2")]
    public async Task Staff_cannot_spoof_campus_headers(string method, string path)
    {
        var response = await Send(method, path, campus: "campus2", body: new { });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Theory]
    [InlineData("GET", "teachers/teacher2")]
    [InlineData("PUT", "teachers/teacher2")]
    [InlineData("DELETE", "teachers/teacher2")]
    public async Task Other_campus_records_cannot_be_read_changed_or_deleted(string method, string path)
    {
        var response = await Send(method, path, body: new { FullName = "Forged", EmployeeCode = "FORGED" });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Inserts_use_server_campus_even_when_body_spoofs_ownership()
    {
        var response = await Send("POST", "teachers", body: new { FullName = "New Teacher", EmployeeCode = "NEW", BranchId = "campus2", SchoolId = "school2" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var id = json.GetProperty("data").GetProperty("id").GetString();
        using var scope = host.Services.CreateScope();
        var teacher = await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Teachers.IgnoreQueryFilters().SingleAsync(t => t.Id == id);
        Assert.Equal("campus1", teacher.BranchId);
        Assert.Equal("school1", teacher.SchoolId);
    }

    [Fact]
    public async Task Super_admin_selects_a_campus_before_business_activity()
    {
        Assert.Equal(HttpStatusCode.BadRequest, (await Send("GET", "students", "root")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await Send("POST", "teachers", "root", body: new { })).StatusCode);
        var response = await Send("GET", "school", "root");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(3, json.GetProperty("data").GetProperty("branches").GetArrayLength());
    }

    [Theory]
    [InlineData("ALL")]
    [InlineData("inactive")]
    [InlineData("other-school")]
    [InlineData("missing")]
    public async Task Super_admin_cannot_select_invalid_or_other_school_campus(string campus)
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await Send("GET", "students", "root", campus)).StatusCode);
    }

    [Fact]
    public async Task Super_admin_reads_and_inserts_only_in_the_selected_campus()
    {
        var response = await Send("GET", "students", "root", "campus2");
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("student2", Assert.Single(json.GetProperty("data").EnumerateArray()).GetProperty("id").GetString());
        var created = await Send("POST", "teachers", "root", "campus2", new { FullName = "North Teacher", EmployeeCode = "NORTH" });
        Assert.Equal(HttpStatusCode.OK, created.StatusCode);
        var createdJson = await created.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("campus2", createdJson.GetProperty("data").GetProperty("branchId").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await Send("GET", "teachers/teacher1", "root", "campus2")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Send("GET", "teachers/teacher1", "root", "campus1")).StatusCode);
    }

    [Fact]
    public async Task Dashboard_aggregates_use_selected_campus()
    {
        var response = await Send("GET", "dashboard/stats", "root", "campus2");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, json.GetProperty("data").GetProperty("totalStudents").GetInt32());
        Assert.Equal(200, json.GetProperty("data").GetProperty("totalDueRevenue").GetDecimal());
        Assert.Equal(0, json.GetProperty("data").GetProperty("attendanceRate").GetDecimal());
        Assert.Equal(0, json.GetProperty("data").GetProperty("todayPresent").GetInt32());
        Assert.Equal(0, json.GetProperty("data").GetProperty("todayTotal").GetInt32());
    }

    [Fact]
    public async Task Cross_campus_foreign_keys_are_rejected_on_insert()
    {
        var response = await Send("POST", "routines", body: new { ClassId = "class2", Day = "Sunday", StartTime = "09:00", EndTime = "10:00" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Campus_user_cannot_change_global_school_or_create_campuses()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await Send("PUT", "school", body: new { Name = "Forged" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Send("POST", "school/branches", body: new { })).StatusCode);
    }

    [Fact]
    public async Task Super_admin_account_lists_and_changes_follow_selected_campus()
    {
        var response = await Send("GET", "users", "root", "campus2");
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("north", Assert.Single(json.GetProperty("data").EnumerateArray()).GetProperty("id").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await Send("PUT", "users/staff/reset-password", "root", "campus2", new { NewPassword = "Forged!123" })).StatusCode);
        var created = await Send("POST", "users", "root", "campus2", new
        {
            Username = "new-north", FullName = "North User", RoleId = "teacher", Password = "Test-Password!42", BranchId = "campus1", SchoolId = "school2"
        });
        Assert.Equal(HttpStatusCode.OK, created.StatusCode);
        var account = await created.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("campus2", account.GetProperty("data").GetProperty("branchId").GetString());
        Assert.Equal("school1", account.GetProperty("data").GetProperty("schoolId").GetString());
    }

    [Fact]
    public async Task Updating_permissions_in_one_campus_does_not_change_another_campus()
    {
        var response = await Send("PUT", "roles/teacher/menu-permissions", "root", "campus2",
            new[] { new { RoleId = "teacher", MenuCode = "DASHBOARD", View = false } });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        foreach (var (branch, expected) in new[] { ("campus1", true), ("campus2", false) })
        {
            var result = await Send("GET", "roles/teacher/menu-permissions", "root", branch);
            var json = await result.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal(expected, Assert.Single(json.GetProperty("data").EnumerateArray()).GetProperty("view").GetBoolean());
        }
        var selfAccess = await Send("GET", "menus/my/permissions", "staff");
        Assert.Equal(HttpStatusCode.OK, selfAccess.StatusCode);
        var self = await selfAccess.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(Assert.Single(self.GetProperty("data").GetProperty("rolePermissions").EnumerateArray()).GetProperty("view").GetBoolean());
    }

    [Fact]
    public async Task Uploaded_files_are_private_to_the_campus()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/files/upload");
        request.Headers.Add("X-Test-Identity", "staff");
        using var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent(new byte[] { 1, 2, 3 }), "file", "test.png");
        form.Add(new StringContent("photos"), "folder");
        request.Content = form;
        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var path = json.GetProperty("data").GetProperty("url").GetString()!;
        Assert.Equal(HttpStatusCode.OK, (await Send("GET", path.Replace("/api/v1/", ""))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Send("GET", path.Replace("/api/v1/", ""), "root", "campus2")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(path)).StatusCode);
    }

    [Fact]
    public async Task Every_operational_collection_is_isolated_by_school_and_campus()
    {
        using var serviceScope = host.Services.CreateScope();
        var options = serviceScope.ServiceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>();
        await using var seed = new ApplicationDbContext(options);
        var types = seed.Model.GetEntityTypes().Select(e => e.ClrType)
            .Where(t => typeof(ICampusScopedEntity).IsAssignableFrom(t)).ToList();
        Assert.True(types.Count >= 19);
        foreach (var type in types)
        foreach (var (school, branch) in new[] { ("school1", "campus1"), ("school1", "campus2"), ("school2", "other-school") })
        {
            var row = (BaseEntity)Activator.CreateInstance(type)!;
            row.Id = "scope-probe-" + type.Name + "-" + branch;
            ((ICampusScopedEntity)row).SchoolId = school;
            ((ICampusScopedEntity)row).BranchId = branch;
            seed.Add(row);
        }
        await seed.SaveChangesAsync();
        foreach (var branch in new[] { "campus1", "campus2" })
        {
            await using var database = new ApplicationDbContext(options, new FixedCampus(branch));
            foreach (var type in types)
            {
                var method = typeof(CampusTests).GetMethod(nameof(VerifyCollection), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)!;
                await (Task)method.MakeGenericMethod(type).Invoke(null, new object[] { database, branch })!;
            }
        }
    }

    private static async Task VerifyCollection<TEntity>(ApplicationDbContext database, string branch) where TEntity : BaseEntity, ICampusScopedEntity
    {
        var row = Assert.Single(await database.Set<TEntity>().Where(e => e.Id.StartsWith("scope-probe-")).ToListAsync());
        Assert.Equal("school1", row.SchoolId);
        Assert.Equal(branch, row.BranchId);
    }

    [Fact]
    public async Task Write_guard_rejects_attached_foreign_records_and_campus_moves()
    {
        using var serviceScope = host.Services.CreateScope();
        var options = serviceScope.ServiceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>();
        await using var database = new ApplicationDbContext(options, new FixedCampus("campus1"));
        var foreign = new Teacher { Id = "teacher2", SchoolId = "school1", BranchId = "campus2" };
        database.Teachers.Update(foreign);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => database.SaveChangesAsync());
        database.ChangeTracker.Clear();
        var local = await database.Teachers.SingleAsync(t => t.Id == "teacher1");
        local.BranchId = "campus2";
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => database.SaveChangesAsync());
    }

    private sealed class FixedCampus(string branch) : ICampusContext
    {
        public bool BypassIsolation => false;
        public bool IsResolved => true;
        public bool IsSuperAdmin => true;
        public string SchoolId => "school1";
        public string BranchId => branch;
        public string UserId => "root";
    }

    [Fact]
    public async Task Parent_menu_permission_does_not_grant_sibling_screens()
    {
        using (var scope = host.Services.CreateScope())
        {
            var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            database.RoleMenuPermissions.AddRange(
                new RoleMenuPermission { SchoolId = "school1", BranchId = "campus1", RoleId = "teacher", MenuCode = "FINANCE", View = true },
                new RoleMenuPermission { SchoolId = "school1", BranchId = "campus1", RoleId = "teacher", MenuCode = "FIN_COLLECTION", View = true });
            await database.SaveChangesAsync();
        }
        var response = await Send("GET", "menus/my");
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var finance = json.GetProperty("data").EnumerateArray().Single(menu => menu.GetProperty("code").GetString() == "FINANCE");
        Assert.Equal("FIN_COLLECTION", Assert.Single(finance.GetProperty("children").EnumerateArray()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task User_deny_hides_a_granted_screen_and_parent_denial_hides_the_group()
    {
        using var scope = host.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        database.RoleMenuPermissions.Add(new RoleMenuPermission { SchoolId = "school1", BranchId = "campus1", RoleId = "teacher", MenuCode = "FIN_COLLECTION", View = true });
        database.UserMenuPermissions.Add(new UserMenuPermission { SchoolId = "school1", BranchId = "campus1", UserId = "staff", MenuCode = "FIN_COLLECTION", Action = "view", Override = OverrideType.Deny });
        await database.SaveChangesAsync();
        var first = await (await Send("GET", "menus/my")).Content.ReadFromJsonAsync<JsonElement>();
        Assert.DoesNotContain(first.GetProperty("data").EnumerateArray(), menu => menu.GetProperty("code").GetString() == "FINANCE");
        database.UserMenuPermissions.RemoveRange(await database.UserMenuPermissions.ToListAsync());
        database.UserMenuPermissions.Add(new UserMenuPermission { SchoolId = "school1", BranchId = "campus1", UserId = "staff", MenuCode = "FINANCE", Action = "view", Override = OverrideType.Deny });
        await database.SaveChangesAsync();
        var second = await (await Send("GET", "menus/my")).Content.ReadFromJsonAsync<JsonElement>();
        Assert.DoesNotContain(second.GetProperty("data").EnumerateArray(), menu => menu.GetProperty("code").GetString() == "FINANCE");
    }

    [Fact]
    public async Task Hidden_menus_and_super_admin_controls_do_not_appear_for_staff()
    {
        using var scope = host.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        database.RoleMenuPermissions.AddRange(
            new RoleMenuPermission { SchoolId = "school1", BranchId = "campus1", RoleId = "teacher", MenuCode = "SEC_USERS", View = true },
            new RoleMenuPermission { SchoolId = "school1", BranchId = "campus1", RoleId = "teacher", MenuCode = "FIN_COLLECTION", View = true });
        (await database.Menus.SingleAsync(menu => menu.Code == "FIN_COLLECTION")).IsVisible = false;
        await database.SaveChangesAsync();
        var json = await (await Send("GET", "menus/my")).Content.ReadFromJsonAsync<JsonElement>();
        Assert.DoesNotContain(json.GetProperty("data").EnumerateArray(), menu => menu.GetProperty("code").GetString() is "SECURITY" or "FINANCE");
    }

    [Theory]
    [InlineData("unknown")]
    [InlineData("duplicate")]
    [InlineData("wrong-role")]
    [InlineData("action-without-view")]
    [InlineData("administrator-menu")]
    public async Task Invalid_matrix_is_rejected_without_destroying_existing_grants(string invalidCase)
    {
        object[] rows = invalidCase switch
        {
            "unknown" => new object[] { new { MenuCode = "MISSING", View = true } },
            "duplicate" => new object[] { new { MenuCode = "DASHBOARD", View = true }, new { MenuCode = "dashboard", View = true } },
            "wrong-role" => new object[] { new { RoleId = "super", MenuCode = "DASHBOARD", View = true } },
            "action-without-view" => new object[] { new { MenuCode = "DASHBOARD", View = false, Create = true } },
            _ => new object[] { new { MenuCode = "SEC_USERS", View = true } }
        };
        var response = await Send("PUT", "roles/teacher/menu-permissions", "root", "campus1", rows);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var current = await (await Send("GET", "roles/teacher/menu-permissions", "root", "campus1")).Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(Assert.Single(current.GetProperty("data").EnumerateArray()).GetProperty("view").GetBoolean());
    }

    [Fact]
    public async Task Super_admin_has_all_visible_menus_without_campus_grants_and_cannot_be_locked_out()
    {
        var response = await Send("GET", "menus/my", "root");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains(json.GetProperty("data").EnumerateArray(), menu => menu.GetProperty("code").GetString() == "SECURITY");
        Assert.Equal(HttpStatusCode.BadRequest, (await Send("PUT", "roles/super/menu-permissions", "root", "campus1", Array.Empty<object>())).StatusCode);
    }

    [Fact]
    public async Task Catalog_sync_is_idempotent_and_preserves_configured_denials()
    {
        using var scope = host.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        database.Roles.AddRange(
            new Role { Id = "accountant-role", SchoolId = "school1", Code = "ACCOUNTANT" },
            new Role { Id = "student-role", SchoolId = "school1", Code = "STUDENT" },
            new Role { Id = "guardian-role", SchoolId = "school1", Code = "GUARDIAN" });
        // A matrix saved before the screen existed must remain authoritative.
        database.RoleMenuPermissions.Add(new RoleMenuPermission
        {
            SchoolId = "school1", BranchId = "campus1", RoleId = "teacher", MenuCode = "TEACH_LEAVE", View = false
        });
        await database.SaveChangesAsync();
        await MenuCatalog.SynchronizeAsync(database);
        var count = await database.RoleMenuPermissions.CountAsync();
        Assert.False((await database.RoleMenuPermissions.SingleAsync(p => p.RoleId == "teacher" && p.BranchId == "campus1" && p.MenuCode == "TEACH_LEAVE")).View);
        Assert.True((await database.RoleMenuPermissions.SingleAsync(p => p.RoleId == "teacher" && p.BranchId == "campus2" && p.MenuCode == "TEACH_LEAVE")).View);
        Assert.Contains(await database.Menus.Select(menu => menu.Code).ToListAsync(), code => code == "FIN_INVOICES");
        Assert.True(await database.RoleMenuPermissions.AnyAsync(p => p.RoleId == "accountant-role" && p.MenuCode == "FIN_INVOICES" && p.View && p.Create));
        Assert.False(await database.RoleMenuPermissions.AnyAsync(p => p.RoleId == "teacher" && p.MenuCode == "FIN_INVOICES" && p.View));
        Assert.True(await database.RoleMenuPermissions.AnyAsync(p => p.RoleId == "student-role" && p.MenuCode == "COMM_NOTICE" && p.View && !p.Create));
        Assert.False(await database.RoleMenuPermissions.AnyAsync(p => p.RoleId == "guardian-role" && p.MenuCode == "TEACH_LEAVE" && p.View));
        await MenuCatalog.SynchronizeAsync(database);
        Assert.Equal(count, await database.RoleMenuPermissions.CountAsync());
    }


    [Fact]
    public async Task Super_admin_creates_new_campus_and_principal_user_assigned_to_that_campus()
    {
        var payload = new
        {
            Code = "C-NEW",
            Name = "Sylhet Campus",
            Address = "Sylhet Sadar",
            Phone = "+880 1711-223344",
            PrincipalUsername = "principal_sylhet",
            PrincipalFullName = "Dr. Sylhet Principal",
            PrincipalEmail = "principal@sylhet.edu.bd",
            PrincipalPassword = "Password@123",
            PrincipalPhone = "+880 1711-223344"
        };
        var response = await Send("POST", "School/branches", "root", body: payload);
        var respBody = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.OK, $"POST School/branches failed with status {response.StatusCode}, body: {respBody}");

        using var scope = host.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var createdBranch = await database.Branches.FirstOrDefaultAsync(b => b.Code == "C-NEW");
        Assert.NotNull(createdBranch);
        Assert.Equal("Sylhet Campus", createdBranch.Name);

        var createdPrincipal = await database.Users.FirstOrDefaultAsync(u => u.Username == "principal_sylhet");
        Assert.NotNull(createdPrincipal);
        Assert.Equal(createdBranch.Id, createdPrincipal.BranchId);
        Assert.Equal("Principal / Head Teacher", createdPrincipal.RoleName);

        // Verify that the created principal is strictly restricted to this branch
        var principalResponse = await Send("GET", "students", createdPrincipal.Id);
        Assert.Equal(HttpStatusCode.OK, principalResponse.StatusCode);
        var json = await principalResponse.Content.ReadFromJsonAsync<JsonElement>();
        var rows = json.GetProperty("data").EnumerateArray().ToArray();
        // The new campus has 0 students yet, so principal sees 0 students (not campus1 or campus2 students!)
        Assert.Empty(rows);

        // Verify spoof attempt by this principal to access campus1 is blocked with 403 Forbidden
        var spoofResponse = await Send("GET", "students", createdPrincipal.Id, campus: "campus1");
        Assert.Equal(HttpStatusCode.Forbidden, spoofResponse.StatusCode);
    }

    public void Dispose()
    {
        client.Dispose(); host.Dispose();
        var testRoot = Path.GetFullPath(Path.Combine(Path.GetTempPath(), "SchoolManagementCampusTests")) + Path.DirectorySeparatorChar;
        if (fileRoot.StartsWith(testRoot, StringComparison.OrdinalIgnoreCase) && Directory.Exists(fileRoot)) Directory.Delete(fileRoot, true);
    }
}
