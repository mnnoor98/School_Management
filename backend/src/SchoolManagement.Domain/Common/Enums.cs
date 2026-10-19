namespace SchoolManagement.Domain.Common;

public enum MenuType
{
    Group,
    Page,
    Action
}

public enum PermissionAction
{
    View,
    Create,
    Edit,
    Delete,
    Approve,
    Export
}

public enum OverrideType
{
    Inherit,
    Allow,
    Deny
}

public enum StudentStatus
{
    Active,
    Transferred,
    Graduated,
    Inactive
}

public enum AttendanceStatus
{
    Present,
    Absent,
    Late
}

public enum InvoiceStatus
{
    Paid,
    Partial,
    Unpaid,
    Overdue
}

public enum PaymentMethod
{
    Cash,
    BankTransfer,
    bKash,
    Nagad
}
