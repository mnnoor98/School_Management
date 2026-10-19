using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Finance;

public class FeeType : BaseEntity, ISchoolScopedEntity
{
    public string SchoolId { get; set; } = "sch-01";
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Frequency { get; set; } = "Monthly";
    public string Description { get; set; } = string.Empty;
}
