namespace SchoolManagement.Application.Common.Interfaces;

public interface ICampusContext
{
    bool BypassIsolation { get; }
    bool IsResolved { get; }
    bool IsSuperAdmin { get; }
    string UserId { get; }
    string SchoolId { get; }
    string BranchId { get; }
}
