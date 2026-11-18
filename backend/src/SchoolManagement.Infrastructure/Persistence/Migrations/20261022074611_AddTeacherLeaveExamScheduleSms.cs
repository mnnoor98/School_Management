using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherLeaveExamScheduleSms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "exam_schedules",
                schema: "exam",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    BranchId = table.Column<string>(type: "text", nullable: false),
                    SchoolId = table.Column<string>(type: "text", nullable: false),
                    ExamId = table.Column<string>(type: "text", nullable: false),
                    ClassId = table.Column<string>(type: "text", nullable: false),
                    ClassName = table.Column<string>(type: "text", nullable: false),
                    SubjectId = table.Column<string>(type: "text", nullable: false),
                    SubjectName = table.Column<string>(type: "text", nullable: false),
                    ExamDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Day = table.Column<string>(type: "text", nullable: false),
                    StartTime = table.Column<string>(type: "text", nullable: false),
                    EndTime = table.Column<string>(type: "text", nullable: false),
                    RoomNo = table.Column<string>(type: "text", nullable: false),
                    FullMarks = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    PassMarks = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exam_schedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_exam_schedules_branches_SchoolId_BranchId",
                        columns: x => new { x.SchoolId, x.BranchId },
                        principalSchema: "school",
                        principalTable: "branches",
                        principalColumns: new[] { "SchoolId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "sms_logs",
                schema: "system",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    BranchId = table.Column<string>(type: "text", nullable: false),
                    SchoolId = table.Column<string>(type: "text", nullable: false),
                    RecipientGroup = table.Column<string>(type: "text", nullable: false),
                    RecipientCount = table.Column<int>(type: "integer", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    SenderName = table.Column<string>(type: "text", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreditsUsed = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sms_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sms_logs_branches_SchoolId_BranchId",
                        columns: x => new { x.SchoolId, x.BranchId },
                        principalSchema: "school",
                        principalTable: "branches",
                        principalColumns: new[] { "SchoolId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "sms_templates",
                schema: "system",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    BranchId = table.Column<string>(type: "text", nullable: false),
                    SchoolId = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sms_templates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sms_templates_branches_SchoolId_BranchId",
                        columns: x => new { x.SchoolId, x.BranchId },
                        principalSchema: "school",
                        principalTable: "branches",
                        principalColumns: new[] { "SchoolId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "teacher_leaves",
                schema: "employee",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    BranchId = table.Column<string>(type: "text", nullable: false),
                    SchoolId = table.Column<string>(type: "text", nullable: false),
                    TeacherId = table.Column<string>(type: "text", nullable: false),
                    TeacherName = table.Column<string>(type: "text", nullable: false),
                    EmployeeCode = table.Column<string>(type: "text", nullable: false),
                    Department = table.Column<string>(type: "text", nullable: false),
                    LeaveType = table.Column<string>(type: "text", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TotalDays = table.Column<int>(type: "integer", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    AppliedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReviewedBy = table.Column<string>(type: "text", nullable: true),
                    ReviewRemark = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teacher_leaves", x => x.Id);
                    table.ForeignKey(
                        name: "FK_teacher_leaves_branches_SchoolId_BranchId",
                        columns: x => new { x.SchoolId, x.BranchId },
                        principalSchema: "school",
                        principalTable: "branches",
                        principalColumns: new[] { "SchoolId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_exam_schedules_SchoolId_BranchId",
                schema: "exam",
                table: "exam_schedules",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_exam_schedules_SchoolId_BranchId_ExamId_ClassId",
                schema: "exam",
                table: "exam_schedules",
                columns: new[] { "SchoolId", "BranchId", "ExamId", "ClassId" });

            migrationBuilder.CreateIndex(
                name: "IX_sms_logs_SchoolId_BranchId",
                schema: "system",
                table: "sms_logs",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_sms_templates_SchoolId_BranchId",
                schema: "system",
                table: "sms_templates",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_teacher_leaves_SchoolId_BranchId",
                schema: "employee",
                table: "teacher_leaves",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_teacher_leaves_SchoolId_BranchId_TeacherId",
                schema: "employee",
                table: "teacher_leaves",
                columns: new[] { "SchoolId", "BranchId", "TeacherId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "exam_schedules",
                schema: "exam");

            migrationBuilder.DropTable(
                name: "sms_logs",
                schema: "system");

            migrationBuilder.DropTable(
                name: "sms_templates",
                schema: "system");

            migrationBuilder.DropTable(
                name: "teacher_leaves",
                schema: "employee");
        }
    }
}
