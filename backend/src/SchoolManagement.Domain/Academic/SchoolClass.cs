using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Academic;

public class SchoolClass : BaseEntity, ISchoolScopedEntity
{
    public string SchoolId { get; set; } = "sch-01";
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int SortOrder { get; set; } = 0;

    public virtual ICollection<Section> Sections { get; set; } = new List<Section>();
}
