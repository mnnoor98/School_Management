using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Auth;
using SchoolManagement.Domain.Common;

namespace SchoolManagement.Infrastructure.Persistence;

public static class MenuCatalog
{
    public sealed record Definition(string Code, string Name, string? Parent, string? Route, string Icon, int Order);

    public static readonly Definition[] Definitions =
    {
        new("DASHBOARD", "Dashboard", null, "/app/dashboard", "layout-dashboard", 1),
        new("STUDENTS", "Students", null, null, "graduation-cap", 2),
        new("STU_LIST", "Student Directory", "STUDENTS", "/app/students/list", "users", 1),
        new("STU_ADMIT", "New Admission", "STUDENTS", "/app/students/admission", "user-plus", 2),
        new("STUD_PROMOTION", "Student Promotion", "STUDENTS", "/app/students/promotion", "arrow-up", 3),
        new("TEACHERS", "Teachers", null, null, "briefcase", 3),
        new("TEACH_LIST", "Teacher Directory", "TEACHERS", "/app/teachers/list", "users", 1),
        new("TEACH_LEAVE", "Teacher Leave", "TEACHERS", "/app/teachers/leave", "calendar", 2),
        new("ACADEMICS", "Academics", null, null, "book-open", 4),
        new("ACAD_CLASSES", "Classes & Sections", "ACADEMICS", "/app/academic/classes", "school", 1),
        new("ACAD_SUBJECTS", "Subjects", "ACADEMICS", "/app/academic/subjects", "book-open", 2),
        new("ACAD_ROUTINE", "Class Routine", "ACADEMICS", "/app/academic/routine", "calendar-clock", 3),
        new("ATTENDANCE", "Attendance", null, null, "clipboard-check", 5),
        new("ATT_STUDENT", "Attendance Entry", "ATTENDANCE", "/app/attendance/entry", "clipboard-check", 1),
        new("ATT_CORRECTION", "Attendance Correction", "ATTENDANCE", "/app/attendance/correction", "pencil", 2),
        new("ATT_REPORT", "Attendance Reports", "ATTENDANCE", "/app/attendance/reports", "bar-chart", 3),
        new("EXAMS", "Examinations", null, null, "award", 6),
        new("EXAM_SETUP", "Exam Setup", "EXAMS", "/app/exams/setup", "calendar", 1),
        new("EXAM_MARKS", "Marks Entry", "EXAMS", "/app/exams/marks", "pencil", 2),
        new("EXAM_RESULTS", "Marksheets", "EXAMS", "/app/exams/marksheet", "award", 3),
        new("FINANCE", "Finance", null, null, "circle-dollar-sign", 7),
        new("FIN_FEES", "Fee Structures", "FINANCE", "/app/finance/structure", "settings", 1),
        new("FIN_INVOICES", "Student Invoices", "FINANCE", "/app/finance/invoices", "receipt", 2),
        new("FIN_COLLECTION", "Fee Collection", "FINANCE", "/app/finance/collection", "circle-dollar-sign", 3),
        new("FIN_EXPENSES", "Campus Expenses & Vouchers", "FINANCE", "/app/finance/expenses", "credit-card", 4),
        new("FIN_PAYROLL", "Staff & Teacher Payroll", "FINANCE", "/app/finance/payroll", "wallet", 5),
        new("FIN_BANKING", "Banking & Cash Vault", "FINANCE", "/app/finance/banking", "landmark", 6),
        new("COMMUNICATION", "Communication", null, null, "bell", 8),
        new("COMM_NOTICE", "Notices", "COMMUNICATION", "/app/communication/notices", "bell", 1),
        new("COMM_SMS", "SMS Management", "COMMUNICATION", "/app/communication/sms", "message-square", 2),
        new("REPORTS", "Reports & Analytics", null, null, "bar-chart", 9),
        new("REP_ACADEMIC", "Academic Performance", "REPORTS", "/app/reports/academic", "bar-chart", 1),
        new("REP_FINANCE", "Financial Ledger", "REPORTS", "/app/reports/financial", "receipt", 2),
        new("SECURITY", "Administration", null, null, "shield-check", 10),
        new("ADMIN_SCHOOL", "School & Campus Setup", "SECURITY", "/app/admin/school-setup", "school", 1),
        new("ADMIN_MASTER_DATA", "Master Data Center", "SECURITY", "/app/admin/master-data", "database", 2),
        new("SEC_USERS", "User Accounts", "SECURITY", "/app/admin/users", "users", 3),
        new("SEC_USER_OVERRIDES", "User Permissions", "SECURITY", "/app/admin/user-permissions", "shield-check", 4),
        new("SEC_ROLES", "Role Menu Permissions", "SECURITY", "/app/admin/roles", "lock", 5),
        new("SEC_MENUS", "Menu Management", "SECURITY", "/app/admin/menu-management", "menu", 6),
        new("SEC_AUDIT", "Audit Logs", "SECURITY", "/app/admin/audit-log", "history", 7),
        new("ADMIN_BACKUP", "Database Backups", "SECURITY", "/app/admin/database-backup", "database", 8),
        new("ADMIN_DEPLOYMENT", "Deployment Center", "SECURITY", "/app/admin/deployment", "server", 9)
    };

    public static bool IsSuperAdminOnlyMenu(string code) =>
        code.Equals("ADMIN_SCHOOL", StringComparison.OrdinalIgnoreCase)
        || code.Equals("ADMIN_BACKUP", StringComparison.OrdinalIgnoreCase)
        || code.Equals("ADMIN_DEPLOYMENT", StringComparison.OrdinalIgnoreCase)
        || code.Equals("SEC_MENUS", StringComparison.OrdinalIgnoreCase)
        || code.Equals("SEC_AUDIT", StringComparison.OrdinalIgnoreCase);

    public static bool IsCampusAdministratorMenu(string code) =>
        code.Equals("SECURITY", StringComparison.OrdinalIgnoreCase)
        || code.Equals("SEC_USERS", StringComparison.OrdinalIgnoreCase)
        || code.Equals("SEC_USER_OVERRIDES", StringComparison.OrdinalIgnoreCase)
        || code.Equals("SEC_ROLES", StringComparison.OrdinalIgnoreCase);

    public static bool IsAdministratorMenu(string code) =>
        IsSuperAdminOnlyMenu(code) || IsCampusAdministratorMenu(code);

    public static async Task SynchronizeAsync(ApplicationDbContext database)
    {
        // Runs only during startup maintenance, before HTTP campus scopes exist.
        var existing = await database.Menus.ToDictionaryAsync(m => m.Code);
        var added = new List<Definition>();
        foreach (var definition in Definitions)
        {
            if (existing.TryGetValue(definition.Code, out var menu))
            {
                if (definition.Route != null)
                    menu.Route = definition.Route;
                menu.Name = definition.Name;
                menu.Icon = definition.Icon;
                menu.DisplayOrder = definition.Order;
                menu.PermissionCode = definition.Code;
                continue;
            }
            database.Menus.Add(new Menu
            {
                Code = definition.Code, Name = definition.Name, ParentCode = definition.Parent,
                Route = definition.Route, Icon = definition.Icon, DisplayOrder = definition.Order,
                Type = definition.Route == null ? MenuType.Group : MenuType.Page, PermissionCode = definition.Code
            });
            added.Add(definition);
        }

        var roles = await database.Roles.Where(r => r.IsActive).ToListAsync();
        var branches = await database.Branches.ToListAsync();
        var configuredRows = await database.RoleMenuPermissions.AsNoTracking()
            .Select(p => new { p.SchoolId, p.BranchId, p.RoleId, p.MenuCode }).ToListAsync();
        var configured = configuredRows.Select(p => (p.SchoolId, p.BranchId, p.RoleId, p.MenuCode)).ToHashSet();
        foreach (var definition in added)
        foreach (var role in roles)
        foreach (var branch in branches.Where(b => b.SchoolId == role.SchoolId))
        {
            if (configured.Contains((role.SchoolId, branch.Id, role.Id, definition.Code))) continue;
            var grant = DefaultGrant(role.Code, definition);
            if (grant == null) continue;
            grant.SchoolId = role.SchoolId;
            grant.BranchId = branch.Id;
            grant.RoleId = role.Id;
            grant.MenuCode = definition.Code;
            database.RoleMenuPermissions.Add(grant);
        }

        var principalRoleIds = roles.Where(r => r.Code == "PRINCIPAL" || r.Name.Contains("Principal")).Select(r => r.Id).ToList();
        var principalGrants = await database.RoleMenuPermissions
            .Where(p => principalRoleIds.Contains(p.RoleId) && (p.MenuCode == "SECURITY" || p.MenuCode == "SEC_USERS" || p.MenuCode == "SEC_USER_OVERRIDES" || p.MenuCode == "SEC_ROLES"))
            .ToListAsync();
        foreach (var p in principalGrants)
        {
            p.View = true;
            p.Create = true;
            p.Edit = true;
            p.Delete = true;
            p.Approve = true;
            p.Export = true;
        }

        await database.SaveChangesAsync();
    }


    public static async Task SeedBranchPermissionsAsync(ApplicationDbContext database, string branchId, string schoolId)
    {
        var roles = await database.Roles.IgnoreQueryFilters().Where(r => r.IsActive && r.SchoolId == schoolId).ToListAsync();
        var existing = await database.RoleMenuPermissions.IgnoreQueryFilters()
            .Where(p => p.SchoolId == schoolId && p.BranchId == branchId)
            .Select(p => new { p.RoleId, p.MenuCode })
            .ToListAsync();
        var existingSet = existing.Select(p => (p.RoleId, p.MenuCode)).ToHashSet();

        foreach (var definition in Definitions)
        {
            foreach (var role in roles)
            {
                if (existingSet.Contains((role.Id, definition.Code))) continue;
                var grant = DefaultGrant(role.Code, definition);
                if (grant == null) continue;
                grant.SchoolId = schoolId;
                grant.BranchId = branchId;
                grant.RoleId = role.Id;
                grant.MenuCode = definition.Code;
                database.RoleMenuPermissions.Add(grant);
            }
        }
        await database.SaveChangesAsync();
    }

    private static RoleMenuPermission? DefaultGrant(string role, Definition menu)
    {
        var administrator = role == "SUPER_ADMIN";
        var isPrincipal = role == "PRINCIPAL";
        if (IsSuperAdminOnlyMenu(menu.Code) && !administrator) return null;
        if (IsCampusAdministratorMenu(menu.Code) && !administrator && !isPrincipal) return null;
        var allowed = role switch
        {
            "SUPER_ADMIN" or "PRINCIPAL" => true,
            "TEACHER" => new[] { "DASHBOARD", "STUDENTS", "STU_LIST", "TEACHERS", "TEACH_LIST", "TEACH_LEAVE", "ACADEMICS", "ACAD_CLASSES", "ACAD_SUBJECTS", "ACAD_ROUTINE", "ATTENDANCE", "ATT_STUDENT", "ATT_CORRECTION", "ATT_REPORT", "EXAMS", "EXAM_SETUP", "EXAM_MARKS", "EXAM_RESULTS", "COMMUNICATION", "COMM_NOTICE", "REPORTS", "REP_ACADEMIC" }.Contains(menu.Code),
            "ACCOUNTANT" => new[] { "DASHBOARD", "STUDENTS", "STU_LIST", "FINANCE", "FIN_FEES", "FIN_INVOICES", "FIN_COLLECTION", "FIN_EXPENSES", "FIN_PAYROLL", "FIN_BANKING", "COMMUNICATION", "COMM_NOTICE", "REPORTS", "REP_FINANCE" }.Contains(menu.Code),
            "STUDENT" or "GUARDIAN" => new[] { "DASHBOARD", "STUDENTS", "STU_LIST", "ACADEMICS", "ACAD_ROUTINE", "ATTENDANCE", "ATT_REPORT", "EXAMS", "EXAM_RESULTS", "FINANCE", "FIN_COLLECTION", "COMMUNICATION", "COMM_NOTICE" }.Contains(menu.Code),
            _ => false
        };
        if (!allowed) return null;
        var full = administrator || role == "PRINCIPAL";
        var editable = full || (role == "TEACHER" && menu.Code is "ATT_STUDENT" or "ATT_CORRECTION" or "EXAM_MARKS" or "TEACH_LEAVE")
            || (role == "ACCOUNTANT" && menu.Code is "FIN_FEES" or "FIN_INVOICES" or "FIN_COLLECTION" or "FIN_EXPENSES" or "FIN_PAYROLL" or "FIN_BANKING");
        return new RoleMenuPermission
        {
            View = true, Create = menu.Route != null && editable, Edit = menu.Route != null && editable,
            Delete = menu.Route != null && full, Approve = menu.Route != null && (full || (role == "TEACHER" && menu.Code is "ATT_STUDENT" or "ATT_CORRECTION" or "EXAM_MARKS")),
            Export = menu.Route != null && role is not ("STUDENT" or "GUARDIAN")
        };
    }
}
