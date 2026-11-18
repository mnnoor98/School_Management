using Microsoft.Extensions.DependencyInjection;
using SchoolManagement.Application.Academic.Services;
using SchoolManagement.Application.Attendance.Services;
using SchoolManagement.Application.Auth.Services;
using SchoolManagement.Application.Employee.Services;
using SchoolManagement.Application.Exams.Services;
using SchoolManagement.Application.Finance.Services;
using SchoolManagement.Application.Menus.Services;
using SchoolManagement.Application.School.Services;
using SchoolManagement.Application.Students.Services;
using SchoolManagement.Application.System.Services;

namespace SchoolManagement.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IStudentService, StudentService>();
        services.AddScoped<ITeacherLeaveService, TeacherLeaveService>();
        services.AddScoped<ITeacherService, TeacherService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IAcademicService, AcademicService>();
        services.AddScoped<IAttendanceService, AttendanceService>();
        services.AddScoped<IExamService, ExamService>();
        services.AddScoped<IFeeService, FeeService>();
        services.AddScoped<IExpenseService, ExpenseService>();
        services.AddScoped<IPayrollService, PayrollService>();
        services.AddScoped<IBankingService, BankingService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<IMenuService, MenuService>();
        services.AddScoped<ISchoolService, SchoolService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<INoticeService, NoticeService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<ISmsService, SmsService>();

        return services;
    }
}
