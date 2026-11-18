using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCampusIsolation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_teachers_SchoolId_EmployeeCode",
                schema: "employee",
                table: "teachers");

            migrationBuilder.DropIndex(
                name: "IX_students_SchoolId_AdmissionNo",
                schema: "student",
                table: "students");

            migrationBuilder.DropIndex(
                name: "IX_classes_SchoolId_Code",
                schema: "academic",
                table: "classes");

            migrationBuilder.DropIndex(
                name: "IX_academic_years_SchoolId_Name",
                schema: "school",
                table: "academic_years");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "employee",
                table: "teachers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "academic",
                table: "subjects",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "student",
                table: "students",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "attendance",
                table: "student_attendance",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "academic",
                table: "sections",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "finance",
                table: "payments",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "system",
                table: "notices",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "exam",
                table: "marks",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "finance",
                table: "invoices",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "finance",
                table: "fee_types",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "finance",
                table: "fee_structures",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "exam",
                table: "exams",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "student",
                table: "enrollments",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "academic",
                table: "classes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "academic",
                table: "class_subjects",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "academic",
                table: "class_routines",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "system",
                table: "audit_logs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "attendance",
                table: "attendance_correction_logs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                schema: "school",
                table: "academic_years",
                type: "text",
                nullable: false,
                defaultValue: "");

            // Early single-school installations used sch-001 on notices while
            // the actual school was sch-01. Repair only that exact alias when
            // there is just one school; never merge records between real schools.
            migrationBuilder.Sql("""
                UPDATE system.notices SET "SchoolId" = 'sch-01'
                WHERE "SchoolId" = 'sch-001'
                    AND (SELECT count(*) FROM school.schools) = 1
                    AND EXISTS (SELECT 1 FROM school.schools WHERE "Id" = 'sch-01')
                    AND NOT EXISTS (SELECT 1 FROM school.schools WHERE "Id" = 'sch-001');
                """);

            // Legacy records only stored SchoolId, so their original campus cannot
            // be inferred. Preserve them under each school's primary campus.
            foreach (var (schema, table) in new[]
            {
                ("employee", "teachers"), ("academic", "subjects"), ("student", "students"),
                ("attendance", "student_attendance"), ("academic", "sections"), ("finance", "payments"),
                ("system", "notices"), ("exam", "marks"), ("finance", "invoices"), ("finance", "fee_types"),
                ("finance", "fee_structures"), ("exam", "exams"), ("student", "enrollments"),
                ("academic", "classes"), ("academic", "class_subjects"), ("academic", "class_routines"),
                ("system", "audit_logs"), ("attendance", "attendance_correction_logs"), ("school", "academic_years")
            })
            {
                migrationBuilder.Sql($"""
                    UPDATE "{schema}"."{table}" AS record
                    SET "BranchId" = (
                        SELECT branch."Id" FROM school.branches AS branch
                        WHERE branch."SchoolId" = record."SchoolId"
                        ORDER BY CASE WHEN branch."Code" = 'BR-01' OR branch."Id" = 'br-01' THEN 0 ELSE 1 END, branch."Id"
                        LIMIT 1
                    );
                    """);
            }

            migrationBuilder.AddUniqueConstraint(
                name: "AK_branches_SchoolId_Id",
                schema: "school",
                table: "branches",
                columns: new[] { "SchoolId", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_teachers_SchoolId_BranchId",
                schema: "employee",
                table: "teachers",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_teachers_SchoolId_BranchId_EmployeeCode",
                schema: "employee",
                table: "teachers",
                columns: new[] { "SchoolId", "BranchId", "EmployeeCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_teachers_SchoolId_EmployeeCode",
                schema: "employee",
                table: "teachers",
                columns: new[] { "SchoolId", "EmployeeCode" });

            migrationBuilder.CreateIndex(
                name: "IX_subjects_SchoolId_BranchId",
                schema: "academic",
                table: "subjects",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_students_SchoolId_AdmissionNo",
                schema: "student",
                table: "students",
                columns: new[] { "SchoolId", "AdmissionNo" });

            migrationBuilder.CreateIndex(
                name: "IX_students_SchoolId_BranchId",
                schema: "student",
                table: "students",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_students_SchoolId_BranchId_AdmissionNo",
                schema: "student",
                table: "students",
                columns: new[] { "SchoolId", "BranchId", "AdmissionNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_attendance_SchoolId_BranchId",
                schema: "attendance",
                table: "student_attendance",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_sections_SchoolId_BranchId",
                schema: "academic",
                table: "sections",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_payments_SchoolId_BranchId",
                schema: "finance",
                table: "payments",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_notices_SchoolId_BranchId",
                schema: "system",
                table: "notices",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_marks_SchoolId_BranchId",
                schema: "exam",
                table: "marks",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_invoices_SchoolId_BranchId",
                schema: "finance",
                table: "invoices",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_fee_types_SchoolId_BranchId",
                schema: "finance",
                table: "fee_types",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_fee_structures_SchoolId_BranchId",
                schema: "finance",
                table: "fee_structures",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_exams_SchoolId_BranchId",
                schema: "exam",
                table: "exams",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_enrollments_SchoolId_BranchId",
                schema: "student",
                table: "enrollments",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_classes_SchoolId_BranchId",
                schema: "academic",
                table: "classes",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_classes_SchoolId_BranchId_Code",
                schema: "academic",
                table: "classes",
                columns: new[] { "SchoolId", "BranchId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_classes_SchoolId_Code",
                schema: "academic",
                table: "classes",
                columns: new[] { "SchoolId", "Code" });

            migrationBuilder.CreateIndex(
                name: "IX_class_subjects_SchoolId_BranchId",
                schema: "academic",
                table: "class_subjects",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_class_routines_SchoolId_BranchId",
                schema: "academic",
                table: "class_routines",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_SchoolId_BranchId",
                schema: "system",
                table: "audit_logs",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_attendance_correction_logs_SchoolId_BranchId",
                schema: "attendance",
                table: "attendance_correction_logs",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_academic_years_SchoolId_BranchId",
                schema: "school",
                table: "academic_years",
                columns: new[] { "SchoolId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_academic_years_SchoolId_BranchId_Name",
                schema: "school",
                table: "academic_years",
                columns: new[] { "SchoolId", "BranchId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_academic_years_SchoolId_Name",
                schema: "school",
                table: "academic_years",
                columns: new[] { "SchoolId", "Name" });

            migrationBuilder.AddForeignKey(
                name: "FK_academic_years_branches_SchoolId_BranchId",
                schema: "school",
                table: "academic_years",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_attendance_correction_logs_branches_SchoolId_BranchId",
                schema: "attendance",
                table: "attendance_correction_logs",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_audit_logs_branches_SchoolId_BranchId",
                schema: "system",
                table: "audit_logs",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_class_routines_branches_SchoolId_BranchId",
                schema: "academic",
                table: "class_routines",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_class_subjects_branches_SchoolId_BranchId",
                schema: "academic",
                table: "class_subjects",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_classes_branches_SchoolId_BranchId",
                schema: "academic",
                table: "classes",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_enrollments_branches_SchoolId_BranchId",
                schema: "student",
                table: "enrollments",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_exams_branches_SchoolId_BranchId",
                schema: "exam",
                table: "exams",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_fee_structures_branches_SchoolId_BranchId",
                schema: "finance",
                table: "fee_structures",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_fee_types_branches_SchoolId_BranchId",
                schema: "finance",
                table: "fee_types",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_invoices_branches_SchoolId_BranchId",
                schema: "finance",
                table: "invoices",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_marks_branches_SchoolId_BranchId",
                schema: "exam",
                table: "marks",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_notices_branches_SchoolId_BranchId",
                schema: "system",
                table: "notices",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_payments_branches_SchoolId_BranchId",
                schema: "finance",
                table: "payments",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_sections_branches_SchoolId_BranchId",
                schema: "academic",
                table: "sections",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_student_attendance_branches_SchoolId_BranchId",
                schema: "attendance",
                table: "student_attendance",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_students_branches_SchoolId_BranchId",
                schema: "student",
                table: "students",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_subjects_branches_SchoolId_BranchId",
                schema: "academic",
                table: "subjects",
                columns: new[] { "SchoolId", "BranchId" },
                principalSchema: "school",
                principalTable: "branches",
                principalColumns: new[] { "SchoolId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_teachers_branches_SchoolId_BranchId",
                schema: "employee",
                table: "teachers",
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
                name: "FK_academic_years_branches_SchoolId_BranchId",
                schema: "school",
                table: "academic_years");

            migrationBuilder.DropForeignKey(
                name: "FK_attendance_correction_logs_branches_SchoolId_BranchId",
                schema: "attendance",
                table: "attendance_correction_logs");

            migrationBuilder.DropForeignKey(
                name: "FK_audit_logs_branches_SchoolId_BranchId",
                schema: "system",
                table: "audit_logs");

            migrationBuilder.DropForeignKey(
                name: "FK_class_routines_branches_SchoolId_BranchId",
                schema: "academic",
                table: "class_routines");

            migrationBuilder.DropForeignKey(
                name: "FK_class_subjects_branches_SchoolId_BranchId",
                schema: "academic",
                table: "class_subjects");

            migrationBuilder.DropForeignKey(
                name: "FK_classes_branches_SchoolId_BranchId",
                schema: "academic",
                table: "classes");

            migrationBuilder.DropForeignKey(
                name: "FK_enrollments_branches_SchoolId_BranchId",
                schema: "student",
                table: "enrollments");

            migrationBuilder.DropForeignKey(
                name: "FK_exams_branches_SchoolId_BranchId",
                schema: "exam",
                table: "exams");

            migrationBuilder.DropForeignKey(
                name: "FK_fee_structures_branches_SchoolId_BranchId",
                schema: "finance",
                table: "fee_structures");

            migrationBuilder.DropForeignKey(
                name: "FK_fee_types_branches_SchoolId_BranchId",
                schema: "finance",
                table: "fee_types");

            migrationBuilder.DropForeignKey(
                name: "FK_invoices_branches_SchoolId_BranchId",
                schema: "finance",
                table: "invoices");

            migrationBuilder.DropForeignKey(
                name: "FK_marks_branches_SchoolId_BranchId",
                schema: "exam",
                table: "marks");

            migrationBuilder.DropForeignKey(
                name: "FK_notices_branches_SchoolId_BranchId",
                schema: "system",
                table: "notices");

            migrationBuilder.DropForeignKey(
                name: "FK_payments_branches_SchoolId_BranchId",
                schema: "finance",
                table: "payments");

            migrationBuilder.DropForeignKey(
                name: "FK_sections_branches_SchoolId_BranchId",
                schema: "academic",
                table: "sections");

            migrationBuilder.DropForeignKey(
                name: "FK_student_attendance_branches_SchoolId_BranchId",
                schema: "attendance",
                table: "student_attendance");

            migrationBuilder.DropForeignKey(
                name: "FK_students_branches_SchoolId_BranchId",
                schema: "student",
                table: "students");

            migrationBuilder.DropForeignKey(
                name: "FK_subjects_branches_SchoolId_BranchId",
                schema: "academic",
                table: "subjects");

            migrationBuilder.DropForeignKey(
                name: "FK_teachers_branches_SchoolId_BranchId",
                schema: "employee",
                table: "teachers");

            migrationBuilder.DropIndex(
                name: "IX_teachers_SchoolId_BranchId",
                schema: "employee",
                table: "teachers");

            migrationBuilder.DropIndex(
                name: "IX_teachers_SchoolId_BranchId_EmployeeCode",
                schema: "employee",
                table: "teachers");

            migrationBuilder.DropIndex(
                name: "IX_teachers_SchoolId_EmployeeCode",
                schema: "employee",
                table: "teachers");

            migrationBuilder.DropIndex(
                name: "IX_subjects_SchoolId_BranchId",
                schema: "academic",
                table: "subjects");

            migrationBuilder.DropIndex(
                name: "IX_students_SchoolId_AdmissionNo",
                schema: "student",
                table: "students");

            migrationBuilder.DropIndex(
                name: "IX_students_SchoolId_BranchId",
                schema: "student",
                table: "students");

            migrationBuilder.DropIndex(
                name: "IX_students_SchoolId_BranchId_AdmissionNo",
                schema: "student",
                table: "students");

            migrationBuilder.DropIndex(
                name: "IX_student_attendance_SchoolId_BranchId",
                schema: "attendance",
                table: "student_attendance");

            migrationBuilder.DropIndex(
                name: "IX_sections_SchoolId_BranchId",
                schema: "academic",
                table: "sections");

            migrationBuilder.DropIndex(
                name: "IX_payments_SchoolId_BranchId",
                schema: "finance",
                table: "payments");

            migrationBuilder.DropIndex(
                name: "IX_notices_SchoolId_BranchId",
                schema: "system",
                table: "notices");

            migrationBuilder.DropIndex(
                name: "IX_marks_SchoolId_BranchId",
                schema: "exam",
                table: "marks");

            migrationBuilder.DropIndex(
                name: "IX_invoices_SchoolId_BranchId",
                schema: "finance",
                table: "invoices");

            migrationBuilder.DropIndex(
                name: "IX_fee_types_SchoolId_BranchId",
                schema: "finance",
                table: "fee_types");

            migrationBuilder.DropIndex(
                name: "IX_fee_structures_SchoolId_BranchId",
                schema: "finance",
                table: "fee_structures");

            migrationBuilder.DropIndex(
                name: "IX_exams_SchoolId_BranchId",
                schema: "exam",
                table: "exams");

            migrationBuilder.DropIndex(
                name: "IX_enrollments_SchoolId_BranchId",
                schema: "student",
                table: "enrollments");

            migrationBuilder.DropIndex(
                name: "IX_classes_SchoolId_BranchId",
                schema: "academic",
                table: "classes");

            migrationBuilder.DropIndex(
                name: "IX_classes_SchoolId_BranchId_Code",
                schema: "academic",
                table: "classes");

            migrationBuilder.DropIndex(
                name: "IX_classes_SchoolId_Code",
                schema: "academic",
                table: "classes");

            migrationBuilder.DropIndex(
                name: "IX_class_subjects_SchoolId_BranchId",
                schema: "academic",
                table: "class_subjects");

            migrationBuilder.DropIndex(
                name: "IX_class_routines_SchoolId_BranchId",
                schema: "academic",
                table: "class_routines");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_branches_SchoolId_Id",
                schema: "school",
                table: "branches");

            migrationBuilder.DropIndex(
                name: "IX_audit_logs_SchoolId_BranchId",
                schema: "system",
                table: "audit_logs");

            migrationBuilder.DropIndex(
                name: "IX_attendance_correction_logs_SchoolId_BranchId",
                schema: "attendance",
                table: "attendance_correction_logs");

            migrationBuilder.DropIndex(
                name: "IX_academic_years_SchoolId_BranchId",
                schema: "school",
                table: "academic_years");

            migrationBuilder.DropIndex(
                name: "IX_academic_years_SchoolId_BranchId_Name",
                schema: "school",
                table: "academic_years");

            migrationBuilder.DropIndex(
                name: "IX_academic_years_SchoolId_Name",
                schema: "school",
                table: "academic_years");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "employee",
                table: "teachers");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "academic",
                table: "subjects");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "student",
                table: "students");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "attendance",
                table: "student_attendance");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "academic",
                table: "sections");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "finance",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "system",
                table: "notices");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "exam",
                table: "marks");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "finance",
                table: "invoices");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "finance",
                table: "fee_types");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "finance",
                table: "fee_structures");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "exam",
                table: "exams");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "student",
                table: "enrollments");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "academic",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "academic",
                table: "class_subjects");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "academic",
                table: "class_routines");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "system",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "attendance",
                table: "attendance_correction_logs");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "school",
                table: "academic_years");

            migrationBuilder.CreateIndex(
                name: "IX_teachers_SchoolId_EmployeeCode",
                schema: "employee",
                table: "teachers",
                columns: new[] { "SchoolId", "EmployeeCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_students_SchoolId_AdmissionNo",
                schema: "student",
                table: "students",
                columns: new[] { "SchoolId", "AdmissionNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_classes_SchoolId_Code",
                schema: "academic",
                table: "classes",
                columns: new[] { "SchoolId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_academic_years_SchoolId_Name",
                schema: "school",
                table: "academic_years",
                columns: new[] { "SchoolId", "Name" },
                unique: true);
        }
    }
}
