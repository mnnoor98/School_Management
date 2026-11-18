# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy solution and project files for layer caching
COPY SchoolManagement.sln ./
COPY src/SchoolManagement.Domain/SchoolManagement.Domain.csproj src/SchoolManagement.Domain/
COPY src/SchoolManagement.Application/SchoolManagement.Application.csproj src/SchoolManagement.Application/
COPY src/SchoolManagement.Infrastructure/SchoolManagement.Infrastructure.csproj src/SchoolManagement.Infrastructure/
COPY src/SchoolManagement.Api/SchoolManagement.Api.csproj src/SchoolManagement.Api/
COPY tests/SchoolManagement.SecurityTests/SchoolManagement.SecurityTests.csproj tests/SchoolManagement.SecurityTests/

RUN dotnet restore src/SchoolManagement.Api/SchoolManagement.Api.csproj

# Copy all sources and build
COPY src/ src/
RUN dotnet publish src/SchoolManagement.Api/SchoolManagement.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 5000

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "SchoolManagement.Api.dll"]
