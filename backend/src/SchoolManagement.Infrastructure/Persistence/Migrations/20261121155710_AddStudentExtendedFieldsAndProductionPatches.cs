using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentExtendedFieldsAndProductionPatches : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdmissionCategory",
                schema: "student",
                table: "students",
                type: "text",
                nullable: false,
                defaultValue: "Regular");

            migrationBuilder.AddColumn<string>(
                name: "CoCurricular",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "District",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Division",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactName",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactPhone",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactRelation",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FatherName",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FatherNid",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FatherOccupation",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FatherPhone",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsHostel",
                schema: "student",
                table: "students",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTransport",
                schema: "student",
                table: "students",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LastClassPassed",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastGpaMarks",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastPassingYear",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MedicalNotes",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotherName",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotherNid",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotherOccupation",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotherPhone",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Nationality",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true,
                defaultValue: "Bangladeshi");

            migrationBuilder.AddColumn<string>(
                name: "PreviousSchool",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Shift",
                schema: "student",
                table: "students",
                type: "text",
                nullable: false,
                defaultValue: "Morning");

            migrationBuilder.AddColumn<string>(
                name: "TcNumber",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Upazila",
                schema: "student",
                table: "students",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "AdmissionCategory", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "CoCurricular", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "District", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "Division", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "EmergencyContactName", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "EmergencyContactPhone", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "EmergencyContactRelation", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "FatherName", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "FatherNid", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "FatherOccupation", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "FatherPhone", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "IsHostel", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "IsTransport", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "LastClassPassed", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "LastGpaMarks", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "LastPassingYear", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "MedicalNotes", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "MotherName", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "MotherNid", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "MotherOccupation", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "MotherPhone", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "Nationality", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "PreviousSchool", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "Shift", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "TcNumber", schema: "student", table: "students");
            migrationBuilder.DropColumn(name: "Upazila", schema: "student", table: "students");
        }
    }
}
