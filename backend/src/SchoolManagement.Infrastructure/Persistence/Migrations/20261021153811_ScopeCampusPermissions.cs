using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ScopeCampusPermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_role_menu_permissions_RoleId_MenuCode",
                schema: "auth",
                table: "role_menu_permissions");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "auth",
                table: "user_menu_permissions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SchoolId",
                schema: "auth",
                table: "user_menu_permissions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "auth",
                table: "role_menu_permissions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SchoolId",
                schema: "auth",
                table: "role_menu_permissions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("""
                UPDATE auth.user_menu_permissions AS permission
                SET "SchoolId" = account."SchoolId", "BranchId" = account."BranchId"
                FROM auth.users AS account WHERE account."Id" = permission."UserId";

                UPDATE auth.role_menu_permissions AS permission
                SET "SchoolId" = role."SchoolId", "BranchId" = (
                    SELECT branch."Id" FROM school.branches AS branch WHERE branch."SchoolId" = role."SchoolId"
                    ORDER BY CASE WHEN branch."Code" = 'BR-01' OR branch."Id" = 'br-01' THEN 0 ELSE 1 END, branch."Id" LIMIT 1
                )
                FROM auth.roles AS role WHERE role."Id" = permission."RoleId";

                -- Preserve the previously school-wide grants as each campus's
                -- initial matrix. Later changes are isolated to that campus.
                INSERT INTO auth.role_menu_permissions
                    ("Id", "SchoolId", "BranchId", "RoleId", "MenuCode", "View", "Create", "Edit", "Delete", "Approve", "Export", "CreatedAt", "UpdatedAt")
                SELECT permission."Id" || '@' || branch."Id", permission."SchoolId", branch."Id", permission."RoleId", permission."MenuCode",
                    permission."View", permission."Create", permission."Edit", permission."Delete", permission."Approve", permission."Export", permission."CreatedAt", permission."UpdatedAt"
                FROM auth.role_menu_permissions AS permission
                JOIN school.branches AS branch ON branch."SchoolId" = permission."SchoolId"
                WHERE branch."Id" <> permission."BranchId";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_user_menu_permissions_SchoolId_BranchId",
                schema: "auth",
                table: "user_menu_permissions",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_role_menu_permissions_RoleId_MenuCode",
                schema: "auth",
                table: "role_menu_permissions",
                columns: new[] { "RoleId", "MenuCode" });

            migrationBuilder.CreateIndex(
                name: "IX_role_menu_permissions_SchoolId_BranchId",
                schema: "auth",
                table: "role_menu_permissions",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_role_menu_permissions_SchoolId_BranchId_RoleId_MenuCode",
                schema: "auth",
                table: "role_menu_permissions",
                columns: new[] { "SchoolId", "BranchId", "RoleId", "MenuCode" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_role_menu_permissions_branches_SchoolId_BranchId",
                schema: "auth",
                table: "role_menu_permissions",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_user_menu_permissions_branches_SchoolId_BranchId",
                schema: "auth",
                table: "user_menu_permissions",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_role_menu_permissions_branches_SchoolId_BranchId",
                schema: "auth",
                table: "role_menu_permissions");

            migrationBuilder.DropForeignKey(
                name: "FK_user_menu_permissions_branches_SchoolId_BranchId",
                schema: "auth",
                table: "user_menu_permissions");

            migrationBuilder.DropIndex(
                name: "IX_user_menu_permissions_SchoolId_BranchId",
                schema: "auth",
                table: "user_menu_permissions");

            migrationBuilder.DropIndex(
                name: "IX_role_menu_permissions_RoleId_MenuCode",
                schema: "auth",
                table: "role_menu_permissions");

            migrationBuilder.DropIndex(
                name: "IX_role_menu_permissions_SchoolId_BranchId",
                schema: "auth",
                table: "role_menu_permissions");

            migrationBuilder.DropIndex(
                name: "IX_role_menu_permissions_SchoolId_BranchId_RoleId_MenuCode",
                schema: "auth",
                table: "role_menu_permissions");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "auth",
                table: "user_menu_permissions");

            migrationBuilder.DropColumn(
                name: "SchoolId",
                schema: "auth",
                table: "user_menu_permissions");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "auth",
                table: "role_menu_permissions");

            migrationBuilder.DropColumn(
                name: "SchoolId",
                schema: "auth",
                table: "role_menu_permissions");

            migrationBuilder.CreateIndex(
                name: "IX_role_menu_permissions_RoleId_MenuCode",
                schema: "auth",
                table: "role_menu_permissions",
                columns: new[] { "RoleId", "MenuCode" },
                unique: true);
        }
    }
}
