namespace SchoolManagement.Application.School.DTOs;

public class SchoolUpdateRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string? Status { get; set; }
}

public class BranchCreateRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;

    // Optional: Head Teacher / Principal for this new campus
    public string? PrincipalUsername { get; set; }
    public string? PrincipalFullName { get; set; }
    public string? PrincipalEmail { get; set; }
    public string? PrincipalPassword { get; set; }
    public string? PrincipalPhone { get; set; }
}

public class BranchUpdateRequest
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class AcademicYearCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCurrent { get; set; }
}
