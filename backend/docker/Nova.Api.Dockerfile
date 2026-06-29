FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Directory.Build.props .
COPY src/Nova.Domain/Nova.Domain.csproj src/Nova.Domain/
COPY src/Nova.Application/Nova.Application.csproj src/Nova.Application/
COPY src/Nova.Infrastructure/Nova.Infrastructure.csproj src/Nova.Infrastructure/
COPY src/Nova.Api/Nova.Api.csproj src/Nova.Api/
RUN dotnet restore src/Nova.Api/Nova.Api.csproj

COPY . .
RUN dotnet build src/Nova.Api/Nova.Api.csproj -c Release -o /app/build
RUN dotnet publish src/Nova.Api/Nova.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5080
ENV ASPNETCORE_URLS=http://+:5080
ENTRYPOINT ["dotnet", "Nova.Api.dll"]
