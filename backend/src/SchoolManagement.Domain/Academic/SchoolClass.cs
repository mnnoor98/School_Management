using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Academic;

public class SchoolClass : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public virtual ICollection<Section> Sections { get; set; } = new List<Section>();
}
