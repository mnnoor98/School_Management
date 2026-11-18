using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBankingAndTreasuryEngine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "bank_accounts",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SchoolId = table.Column<string>(type: "text", nullable: false),
                    BranchId = table.Column<string>(type: "text", nullable: false),
                    AccountName = table.Column<string>(type: "text", nullable: false),
                    AccountNumber = table.Column<string>(type: "text", nullable: false),
                    BankName = table.Column<string>(type: "text", nullable: false),
                    BranchName = table.Column<string>(type: "text", nullable: false),
                    AccountType = table.Column<string>(type: "text", nullable: false),
                    OpeningBalance = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    CurrentBalance = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "text", nullable: false),
                    RoutingNumber = table.Column<string>(type: "text", nullable: true),
                    SwiftCode = table.Column<string>(type: "text", nullable: true),
                    IsDefaultForTuition = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bank_accounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "petty_cash_vouchers",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SchoolId = table.Column<string>(type: "text", nullable: false),
                    BranchId = table.Column<string>(type: "text", nullable: false),
                    VoucherNo = table.Column<string>(type: "text", nullable: false),
                    VoucherDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    PayeeName = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    Purpose = table.Column<string>(type: "text", nullable: false),
                    ReceiptAttachment = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ApprovedBy = table.Column<string>(type: "text", nullable: false),
                    ReimbursedFromBankAccountId = table.Column<string>(type: "text", nullable: true),
                    ReimbursedDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_petty_cash_vouchers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "bank_transactions",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SchoolId = table.Column<string>(type: "text", nullable: false),
                    BranchId = table.Column<string>(type: "text", nullable: false),
                    BankAccountId = table.Column<string>(type: "text", nullable: false),
                    TransactionDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    TransactionType = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    ReferenceNo = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: false),
                    CounterpartyOrAccount = table.Column<string>(type: "text", nullable: true),
                    DepositSlipAttachment = table.Column<string>(type: "text", nullable: true),
                    TransactedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bank_transactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_bank_transactions_bank_accounts_BankAccountId",
                        column: x => x.BankAccountId,
                        principalSchema: "finance",
                        principalTable: "bank_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_bank_accounts_SchoolId_BranchId_AccountNumber",
                schema: "finance",
                table: "bank_accounts",
                columns: new[] { "SchoolId", "BranchId", "AccountNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_bank_transactions_BankAccountId",
                schema: "finance",
                table: "bank_transactions",
                column: "BankAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_bank_transactions_SchoolId_BranchId_BankAccountId",
                schema: "finance",
                table: "bank_transactions",
                columns: new[] { "SchoolId", "BranchId", "BankAccountId" });

            migrationBuilder.CreateIndex(
                name: "IX_petty_cash_vouchers_SchoolId_BranchId_VoucherNo",
                schema: "finance",
                table: "petty_cash_vouchers",
                columns: new[] { "SchoolId", "BranchId", "VoucherNo" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "bank_transactions",
                schema: "finance");

            migrationBuilder.DropTable(
                name: "petty_cash_vouchers",
                schema: "finance");

            migrationBuilder.DropTable(
                name: "bank_accounts",
                schema: "finance");
        }
    }
}
