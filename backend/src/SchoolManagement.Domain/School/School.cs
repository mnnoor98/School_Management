using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.School;

public class SchoolEntity : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Logo { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public string Timezone { get; set; } = "Asia/Dhaka";
}
