using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.OpenApi.Models;
using SchoolManagement.Api.Middleware;
using SchoolManagement.Api.Security;
using SchoolManagement.Infrastructure;
using SchoolManagement.Infrastructure.Persistence;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Add Infrastructure & Application Services
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddSecurityPolicies();
builder.Services.AddHealthChecks();

// Rate limiting for auth endpoints (brute-force defense)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("AuthLimiter", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

// Controllers & JSON configuration
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// CORS configuration for Angular frontend
var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? builder.Configuration["CORS_ALLOWED_ORIGINS"]?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? new[] { "http://localhost:4200", "http://localhost:5000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Swagger / OpenAPI documentation with Bearer authentication
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "School Management System API",
        Version = "v1",
        Description = "Enterprise REST API for School Management System with PostgreSQL, Dynamic RBAC, Academic & Finance Modules"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Format: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Database initialization and seed data execution
var defaultConn = builder.Configuration.GetConnectionString("DefaultConnection");
await DbInitializer.EnsureDatabaseCreatedAsync(defaultConn);

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await DbInitializer.InitializeAsync(context);
    await MenuCatalog.SynchronizeAsync(context);
}

// Global Exception Handler
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "School Management API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowFrontend");
app.UseDefaultFiles();
app.Use(async (context, next) =>
{
    // Legacy public uploads have no reliable campus ownership. Do not expose them.
    if (context.Request.Path.StartsWithSegments("/uploads"))
    {
        context.Response.StatusCode = 404;
        return;
    }
    await next();
});
app.UseStaticFiles();

app.UseRateLimiter();
app.UseAuthentication();
app.UseMiddleware<CampusScopeMiddleware>();
app.UseAuthorization();

app.MapHealthChecks("/health").AllowAnonymous();
app.MapControllers();
app.MapFallbackToFile("index.html").AllowAnonymous();

app.Run();
