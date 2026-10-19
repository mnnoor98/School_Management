using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Finance;

public class FeeStructure : BaseEntity, ISchoolScopedEntity
{
    public string SchoolId { get; set; } = "sch-01";
    public string AcademicYearId { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string FeeTypeId { get; set; } = string.Empty;
    public string FeeTypeName { get; set; } = string.Empty;
    public decimal Amount { get; set; } = 0;
    public DateTime DueDate { get; set; }
}
