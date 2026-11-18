using ClosedXML.Excel;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Exams.DTOs;
using SchoolManagement.Application.Students.DTOs;

namespace SchoolManagement.Infrastructure.Services;

public class ExcelImportExportService : IExcelImportExportService
{
    public byte[] GenerateStudentImportTemplate()
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Student_Admissions");

        // Headers
        var headers = new[]
        {
            "Full Name*", "Bangla Name", "Date of Birth (YYYY-MM-DD)*", "Gender (Male/Female/Other)*",
            "Blood Group (A+/B+/O+/AB+)", "Religion*", "Email", "Student Phone",
            "Present Address*", "Permanent Address*", "Guardian Name*", "Guardian Relation*",
            "Guardian Phone*", "Guardian Occupation", "Guardian Income", "Roll No*"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = worksheet.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromArgb(30, 58, 138); // Navy blue
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        // Example guidance row
        worksheet.Cell(2, 1).Value = "Tariqul Islam";
        worksheet.Cell(2, 2).Value = "তারিকুল ইসলাম";
        worksheet.Cell(2, 3).Value = "2010-04-15";
        worksheet.Cell(2, 4).Value = "Male";
        worksheet.Cell(2, 5).Value = "O+";
        worksheet.Cell(2, 6).Value = "Islam";
        worksheet.Cell(2, 7).Value = "tariqul@school.edu";
        worksheet.Cell(2, 8).Value = "+8801711000000";
        worksheet.Cell(2, 9).Value = "House 12, Road 4, Dhanmondi, Dhaka";
        worksheet.Cell(2, 10).Value = "Vill: Raipur, Dist: Lakshmipur";
        worksheet.Cell(2, 11).Value = "Rafiqul Islam";
        worksheet.Cell(2, 12).Value = "Father";
        worksheet.Cell(2, 13).Value = "+8801711223344";
        worksheet.Cell(2, 14).Value = "Businessman";
        worksheet.Cell(2, 15).Value = "45000";
        worksheet.Cell(2, 16).Value = "01";

        worksheet.Row(2).Style.Font.Italic = true;
        worksheet.Row(2).Style.Font.FontColor = XLColor.Gray;

        worksheet.Columns().AdjustToContents(15.0, 45.0);

        using var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        return memoryStream.ToArray();
    }

    public List<BulkStudentImportRow> ParseStudentImportExcel(Stream stream, out List<string> errors)
    {
        errors = new List<string>();
        var result = new List<BulkStudentImportRow>();

        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheets.FirstOrDefault();
        if (worksheet == null)
        {
            errors.Add("The uploaded Excel workbook contains no worksheets.");
            return result;
        }

        var rows = worksheet.RangeUsed()?.RowsUsed()?.Skip(1); // skip header
        if (rows == null)
        {
            errors.Add("No data rows found in the uploaded worksheet.");
            return result;
        }

        int rowNum = 1;
        foreach (var row in rows)
        {
            rowNum++;
            var fullName = row.Cell(1).GetString().Trim();
            if (string.IsNullOrWhiteSpace(fullName)) continue; // ignore empty rows

            // Skip example row if unchanged
            if (fullName.Equals("Tariqul Islam", StringComparison.OrdinalIgnoreCase) &&
                row.Cell(11).GetString().Trim().Equals("Rafiqul Islam", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var guardianName = row.Cell(11).GetString().Trim();
            var guardianPhone = row.Cell(13).GetString().Trim();

            if (string.IsNullOrWhiteSpace(guardianName))
            {
                errors.Add($"Row {rowNum}: Guardian Name is required.");
                continue;
            }

            DateTime? dob = null;
            if (row.Cell(3).DataType == XLDataType.DateTime)
            {
                dob = row.Cell(3).GetDateTime();
            }
            else
            {
                var dobStr = row.Cell(3).GetString().Trim();
                if (DateTime.TryParse(dobStr, out var parsedDob))
                {
                    dob = parsedDob;
                }
            }

            var item = new BulkStudentImportRow
            {
                RowNumber = rowNum,
                FullName = fullName,
                BanglaName = string.IsNullOrWhiteSpace(row.Cell(2).GetString()) ? null : row.Cell(2).GetString().Trim(),
                DateOfBirth = dob ?? new DateTime(2010, 1, 1),
                Gender = string.IsNullOrWhiteSpace(row.Cell(4).GetString()) ? "Male" : row.Cell(4).GetString().Trim(),
                BloodGroup = string.IsNullOrWhiteSpace(row.Cell(5).GetString()) ? "O+" : row.Cell(5).GetString().Trim(),
                Religion = string.IsNullOrWhiteSpace(row.Cell(6).GetString()) ? "Islam" : row.Cell(6).GetString().Trim(),
                Email = row.Cell(7).GetString().Trim(),
                Phone = row.Cell(8).GetString().Trim(),
                PresentAddress = string.IsNullOrWhiteSpace(row.Cell(9).GetString()) ? "Dhaka, Bangladesh" : row.Cell(9).GetString().Trim(),
                PermanentAddress = string.IsNullOrWhiteSpace(row.Cell(10).GetString()) ? "Bangladesh" : row.Cell(10).GetString().Trim(),
                GuardianName = guardianName,
                GuardianRelation = string.IsNullOrWhiteSpace(row.Cell(12).GetString()) ? "Father" : row.Cell(12).GetString().Trim(),
                GuardianPhone = string.IsNullOrWhiteSpace(guardianPhone) ? "+8801700000000" : guardianPhone,
                GuardianOccupation = row.Cell(14).GetString().Trim(),
                GuardianIncome = row.Cell(15).GetString().Trim(),
                RollNo = row.Cell(16).GetString().Trim()
            };

            result.Add(item);
        }

        return result;
    }

    public byte[] GenerateExamMarksTemplate(
        string examName,
        string className,
        string sectionName,
        string subjectName,
        decimal fullMarks,
        List<(string StudentId, string RollNo, string StudentName)> students)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Marks_Entry");

        // Title Block
        worksheet.Cell(1, 1).Value = $"Exam: {examName} | Class: {className} | Section: {sectionName} | Subject: {subjectName} (Full Marks: {fullMarks})";
        worksheet.Range(1, 1, 1, 8).Merge();
        worksheet.Cell(1, 1).Style.Font.Bold = true;
        worksheet.Cell(1, 1).Style.Font.FontSize = 12;
        worksheet.Cell(1, 1).Style.Fill.BackgroundColor = XLColor.FromArgb(13, 148, 136); // Teal
        worksheet.Cell(1, 1).Style.Font.FontColor = XLColor.White;

        // Column Headers
        var headers = new[]
        {
            "Student ID (Do not edit)", "Roll No", "Student Name",
            "Theory Marks", "MCQ Marks", "Practical Marks", "Is Absent (TRUE/FALSE)", "Remarks"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = worksheet.Cell(2, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromArgb(240, 253, 250);
            cell.Style.Border.BottomBorder = XLBorderStyleValues.Medium;
            cell.Style.Border.BottomBorderColor = XLColor.FromArgb(13, 148, 136);
        }

        int rowIdx = 3;
        foreach (var student in students)
        {
            worksheet.Cell(rowIdx, 1).Value = student.StudentId;
            worksheet.Cell(rowIdx, 2).Value = student.RollNo;
            worksheet.Cell(rowIdx, 3).Value = student.StudentName;
            worksheet.Cell(rowIdx, 4).Value = 0;
            worksheet.Cell(rowIdx, 5).Value = 0;
            worksheet.Cell(rowIdx, 6).Value = 0;
            worksheet.Cell(rowIdx, 7).Value = "FALSE";
            worksheet.Cell(rowIdx, 8).Value = "";

            worksheet.Cell(rowIdx, 1).Style.Font.FontColor = XLColor.DarkGray; // subtle for ID
            rowIdx++;
        }

        worksheet.Columns().AdjustToContents(12.0, 35.0);

        using var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        return memoryStream.ToArray();
    }

    public List<StudentMarkInput> ParseExamMarksExcel(
        Stream stream,
        decimal fullMarks,
        out List<string> errors)
    {
        errors = new List<string>();
        var result = new List<StudentMarkInput>();

        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheets.FirstOrDefault();
        if (worksheet == null)
        {
            errors.Add("No worksheets found in marks upload file.");
            return result;
        }

        var rows = worksheet.RangeUsed()?.RowsUsed()?.Skip(2); // Skip title row & column headers
        if (rows == null)
        {
            errors.Add("No student rows found in marks worksheet.");
            return result;
        }

        int rowNum = 2;
        foreach (var row in rows)
        {
            rowNum++;
            var studentId = row.Cell(1).GetString().Trim();
            if (string.IsNullOrWhiteSpace(studentId)) continue;

            var rollNo = row.Cell(2).GetString().Trim();
            var studentName = row.Cell(3).GetString().Trim();

            decimal theory = 0;
            decimal mcq = 0;
            decimal practical = 0;

            if (row.Cell(4).DataType == XLDataType.Number) theory = (decimal)row.Cell(4).GetDouble();
            else decimal.TryParse(row.Cell(4).GetString(), out theory);

            if (row.Cell(5).DataType == XLDataType.Number) mcq = (decimal)row.Cell(5).GetDouble();
            else decimal.TryParse(row.Cell(5).GetString(), out mcq);

            if (row.Cell(6).DataType == XLDataType.Number) practical = (decimal)row.Cell(6).GetDouble();
            else decimal.TryParse(row.Cell(6).GetString(), out practical);

            var absentStr = row.Cell(7).GetString().Trim().ToUpperInvariant();
            bool isAbsent = absentStr == "TRUE" || absentStr == "1" || absentStr == "YES";

            decimal total = theory + mcq + practical;
            if (fullMarks > 0 && total > fullMarks)
            {
                errors.Add($"Row {rowNum} ({studentName}): Total marks ({total}) exceeds full marks ({fullMarks}).");
            }

            result.Add(new StudentMarkInput
            {
                StudentId = studentId,
                StudentName = studentName,
                RollNo = rollNo,
                TheoryMarks = theory,
                McqMarks = mcq,
                PracticalMarks = practical,
                ObtainedMarks = isAbsent ? 0 : total,
                IsAbsent = isAbsent,
                Remark = row.Cell(8).GetString().Trim()
            });
        }

        return result;
    }
}
