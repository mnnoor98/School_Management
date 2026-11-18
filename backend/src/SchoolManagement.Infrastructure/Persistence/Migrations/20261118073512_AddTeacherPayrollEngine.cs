using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherPayrollEngine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "employee_payrolls",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    BranchId = table.Column<string>(type: "text", nullable: false),
                    SchoolId = table.Column<string>(type: "text", nullable: false),
                    SalaryMonthYear = table.Column<string>(type: "text", nullable: false),
                    PayPeriodStart = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    PayPeriodEnd = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    TeacherId = table.Column<string>(type: "text", nullable: false),
                    EmployeeCode = table.Column<string>(type: "text", nullable: false),
                    EmployeeName = table.Column<string>(type: "text", nullable: false),
                    Designation = table.Column<string>(type: "text", nullable: false),
                    Department = table.Column<string>(type: "text", nullable: false),
                    BasicPay = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    HouseRent = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    MedicalAllowance = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Conveyance = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    SpecialAllowance = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    GrossSalary = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    TotalWorkingDays = table.Column<int>(type: "integer", nullable: false),
                    DaysPresent = table.Column<int>(type: "integer", nullable: false),
                    PaidLeaveDays = table.Column<int>(type: "integer", nullable: false),
                    UnpaidLeaveDays = table.Column<int>(type: "integer", nullable: false),
                    LeaveDeduction = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    ProvidentFundDeduction = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    TaxDeduction = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    AdvanceSalaryDeduction = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    OtherDeductions = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    TotalDeductions = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    BonusAmount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    BonusParticulars = table.Column<string>(type: "text", nullable: true),
                    NetPayable = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    PaymentStatus = table.Column<string>(type: "text", nullable: false),
                    PaymentMethod = table.Column<string>(type: "text", nullable: false),
                    BankName = table.Column<string>(type: "text", nullable: false),
                    BankAccountNo = table.Column<string>(type: "text", nullable: false),
                    TransactionRef = table.Column<string>(type: "text", nullable: true),
                    DisbursementDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    PreparedBy = table.Column<string>(type: "text", nullable: false),
                    ApprovedBy = table.Column<string>(type: "text", nullable: true),
                    ApprovalDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Remarks = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_employee_payrolls", x => x.Id);
                    table.ForeignKey(
                        name: "FK_employee_payrolls_branches_SchoolId_BranchId",
                        columns: x => new { x.SchoolId, x.BranchId },
                        principalSchema: "school",
                        principalTable: "branches",
                        principalColumns: new[] { "SchoolId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_employee_payrolls_teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalSchema: "employee",
                        principalTable: "teachers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "salary_structures",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    BranchId = table.Column<string>(type: "text", nullable: false),
                    SchoolId = table.Column<string>(type: "text", nullable: false),
                    TeacherId = table.Column<string>(type: "text", nullable: false),
                    EmployeeCode = table.Column<string>(type: "text", nullable: false),
                    EmployeeName = table.Column<string>(type: "text", nullable: false),
                    Designation = table.Column<string>(type: "text", nullable: false),
                    Department = table.Column<string>(type: "text", nullable: false),
                    BasicPay = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    HouseRent = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    MedicalAllowance = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Conveyance = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    SpecialAllowance = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    ProvidentFundPercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    BankName = table.Column<string>(type: "text", nullable: false),
                    BranchName = table.Column<string>(type: "text", nullable: false),
                    BankAccountNo = table.Column<string>(type: "text", nullable: false),
                    MobileWalletNo = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_salary_structures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_salary_structures_branches_SchoolId_BranchId",
                        columns: x => new { x.SchoolId, x.BranchId },
                        principalSchema: "school",
                        principalTable: "branches",
                        principalColumns: new[] { "SchoolId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_salary_structures_teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalSchema: "employee",
                        principalTable: "teachers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_employee_payrolls_SchoolId_BranchId",
                schema: "finance",
                table: "employee_payrolls",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_employee_payrolls_SchoolId_BranchId_SalaryMonthYear_Teacher~",
                schema: "finance",
                table: "employee_payrolls",
                columns: new[] { "SchoolId", "BranchId", "SalaryMonthYear", "TeacherId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_employee_payrolls_TeacherId",
                schema: "finance",
                table: "employee_payrolls",
                column: "TeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_salary_structures_SchoolId_BranchId",
                schema: "finance",
                table: "salary_structures",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_salary_structures_SchoolId_BranchId_TeacherId",
                schema: "finance",
                table: "salary_structures",
                columns: new[] { "SchoolId", "BranchId", "TeacherId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_salary_structures_TeacherId",
                schema: "finance",
                table: "salary_structures",
                column: "TeacherId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "employee_payrolls",
                schema: "finance");

            migrationBuilder.DropTable(
                name: "salary_structures",
                schema: "finance");
        }
    }
}
