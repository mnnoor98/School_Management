using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace SchoolManagement.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred during request execution: {Message}", ex.Message);

            context.Response.ContentType = "application/problem+json";
            var status = ex is UnauthorizedAccessException ? 403 : ex is ArgumentException ? 400 : 500;
            context.Response.StatusCode = status;

            var problem = new ProblemDetails
            {
                Status = status,
                Title = status == 403 ? "Access denied" : status == 400 ? "Invalid request" : "Internal Server Error",
                Detail = status == 500 ? "The request could not be completed." : ex.Message,
                Instance = context.Request.Path,
                Extensions = { ["traceId"] = context.TraceIdentifier, ["timestamp"] = DateTime.UtcNow }
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
        }
    }
}
