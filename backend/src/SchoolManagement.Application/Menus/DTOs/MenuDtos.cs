using SchoolManagement.Domain.Common;

namespace SchoolManagement.Application.Menus.DTOs;

public class MenuItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? ParentCode { get; set; }
    public string? Route { get; set; }
    public string Icon { get; set; } = string.Empty;
    public string Type { get; set; } = "Page";
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsVisible { get; set; } = true;
    public string? PermissionCode { get; set; }
    public string? Badge { get; set; }
    public List<MenuItemDto> Children { get; set; } = new();
}

public class RolePermissionDto
{
    public string RoleId { get; set; } = string.Empty;
    public string MenuCode { get; set; } = string.Empty;
    public bool View { get; set; } = true;
    public bool Create { get; set; }
    public bool Edit { get; set; }
    public bool Delete { get; set; }
    public bool Approve { get; set; }
    public bool Export { get; set; }
}

public class UserMenuOverrideDto
{
    public string UserId { get; set; } = string.Empty;
    public string MenuCode { get; set; } = string.Empty;
    public string Action { get; set; } = "view";
    public string Override { get; set; } = "Inherit"; // Inherit, Allow, Deny
}

public class UpdateMenuRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Route { get; set; }
    public string Icon { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public bool IsVisible { get; set; }
}
