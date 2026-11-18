using SchoolManagement.Application.Exams.DTOs;
using SchoolManagement.Application.Students.DTOs;

namespace SchoolManagement.Application.Common.Interfaces;

public interface IExcelImportExportService
{
    byte[] GenerateStudentImportTemplate();
    List<BulkStudentImportRow> ParseStudentImportExcel(Stream stream, out List<string> errors);

    byte[] GenerateExamMarksTemplate(
        string examName,
        string className,
        string sectionName,
        string subjectName,
        decimal fullMarks,
        List<(string StudentId, string RollNo, string StudentName)> students);

    List<StudentMarkInput> ParseExamMarksExcel(
        Stream stream,
        decimal fullMarks,
        out List<string> errors);
}
