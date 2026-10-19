using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Auth;

public class Menu : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ParentCode { get; set; }
    public string? Route { get; set; }
    public string Icon { get; set; } = string.Empty;
    public MenuType Type { get; set; } = MenuType.Page;
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public bool IsVisible { get; set; } = true;
    public string? PermissionCode { get; set; }
    public string? Badge { get; set; }

    public virtual Menu? Parent { get; set; }
    public virtual ICollection<Menu> Children { get; set; } = new List<Menu>();
}
