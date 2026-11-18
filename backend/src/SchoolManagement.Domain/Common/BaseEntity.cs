namespace SchoolManagement.Domain.Common;

public abstract class BaseEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public interface ISchoolScopedEntity
{
    string SchoolId { get; set; }
}

public interface ICampusScopedEntity : ISchoolScopedEntity
{
    string BranchId { get; set; }
}
