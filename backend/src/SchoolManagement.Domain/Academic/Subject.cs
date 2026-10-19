using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Academic;

public class Subject : BaseEntity, ISchoolScopedEntity
{
    public string SchoolId { get; set; } = "sch-01";
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Compulsory";
    public decimal FullMarks { get; set; } = 100;
    public decimal PassMarks { get; set; } = 33;
}
