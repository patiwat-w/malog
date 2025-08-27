// csharp
using System.Net;
using System.Threading.Tasks;
using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using MSUMALog;
using MSUMALog.Server.Controllers;
using MSUMALog.Server.Data;
using MSUMALog.Server.Models;
using Microsoft.VisualStudio.TestPlatform.TestHost;

public class ProgramTest : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public ProgramTest(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task SwaggerEndpoint_ShouldReturnServerError_WithIFormFileMessage()
        {
            // Run factory in Development so Swagger middleware is enabled and generation is attempted.
            var client = _factory.WithWebHostBuilder(builder =>
            {
                builder.UseSetting("environment", "Development");
            }).CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });

            var response = await client.GetAsync("/swagger/v1/swagger.json");

            // Expect server error because Swashbuckle fails to generate operation for IFormFile [FromForm]
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);

            var body = await response.Content.ReadAsStringAsync();

            // Check for indicative bits of the reported exception
            Assert.Contains("IFormFile", body);
            Assert.Contains("Please refer to", body);
        }

        [Fact]
        public async Task App_Responds_ToRequests()
        {
            // Basic smoke test to ensure the app can start and accept requests
            var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });

            var response = await client.GetAsync("/nonexistent-path-for-smoke-test");

            // Ensure we got a valid HTTP response code (server responded rather than crashed/hung)
            Assert.InRange((int)response.StatusCode, 100, 599);
        }
    }