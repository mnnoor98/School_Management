using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCampusExpenseVouchers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "expense_categories",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    BranchId = table.Column<string>(type: "text", nullable: false),
                    SchoolId = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    MonthlyBudgetLimit = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_expense_categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_expense_categories_branches_SchoolId_BranchId",
                        columns: x => new { x.SchoolId, x.BranchId },
                        principalSchema: "school",
                        principalTable: "branches",
                        principalColumns: new[] { "SchoolId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "expense_vouchers",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    BranchId = table.Column<string>(type: "text", nullable: false),
                    SchoolId = table.Column<string>(type: "text", nullable: false),
                    VoucherNo = table.Column<string>(type: "text", nullable: false),
                    ExpenseDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ExpenseCategoryId = table.Column<string>(type: "text", nullable: false),
                    CategoryName = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    PaymentMethod = table.Column<string>(type: "text", nullable: false),
                    BankAccountOrChequeNo = table.Column<string>(type: "text", nullable: true),
                    PaidTo = table.Column<string>(type: "text", nullable: false),
                    ContactPhone = table.Column<string>(type: "text", nullable: true),
                    AttachmentUrl = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    ApprovedBy = table.Column<string>(type: "text", nullable: true),
                    ApprovalDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_expense_vouchers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_expense_vouchers_branches_SchoolId_BranchId",
                        columns: x => new { x.SchoolId, x.BranchId },
                        principalSchema: "school",
                        principalTable: "branches",
                        principalColumns: new[] { "SchoolId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_expense_vouchers_expense_categories_ExpenseCategoryId",
                        column: x => x.ExpenseCategoryId,
                        principalSchema: "finance",
                        principalTable: "expense_categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "expense_voucher_items",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    BranchId = table.Column<string>(type: "text", nullable: false),
                    SchoolId = table.Column<string>(type: "text", nullable: false),
                    ExpenseVoucherId = table.Column<string>(type: "text", nullable: false),
                    Particulars = table.Column<string>(type: "text", nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_expense_voucher_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_expense_voucher_items_branches_SchoolId_BranchId",
                        columns: x => new { x.SchoolId, x.BranchId },
                        principalSchema: "school",
                        principalTable: "branches",
                        principalColumns: new[] { "SchoolId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_expense_voucher_items_expense_vouchers_ExpenseVoucherId",
                        column: x => x.ExpenseVoucherId,
                        principalSchema: "finance",
                        principalTable: "expense_vouchers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_expense_categories_SchoolId_BranchId",
                schema: "finance",
                table: "expense_categories",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_expense_voucher_items_ExpenseVoucherId",
                schema: "finance",
                table: "expense_voucher_items",
                column: "ExpenseVoucherId");

            migrationBuilder.CreateIndex(
                name: "IX_expense_voucher_items_SchoolId_BranchId",
                schema: "finance",
                table: "expense_voucher_items",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_expense_vouchers_ExpenseCategoryId",
                schema: "finance",
                table: "expense_vouchers",
                column: "ExpenseCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_expense_vouchers_SchoolId_BranchId",
                schema: "finance",
                table: "expense_vouchers",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_expense_vouchers_SchoolId_BranchId_VoucherNo",
                schema: "finance",
                table: "expense_vouchers",
                columns: new[] { "SchoolId", "BranchId", "VoucherNo" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "expense_voucher_items",
                schema: "finance");

            migrationBuilder.DropTable(
                name: "expense_vouchers",
                schema: "finance");

            migrationBuilder.DropTable(
                name: "expense_categories",
                schema: "finance");
        }
    }
}
