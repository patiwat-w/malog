using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
	// Ensure test host gets the expected command-line arg used by the test host invoker
	protected override IHost CreateHost(IHostBuilder builder)
	{
		// Provide the --parentprocessid argument so DefaultEngineInvoker doesn't throw.
		builder.ConfigureHostConfiguration(cfg =>
		{
			// Add command line args equivalent
			cfg.AddCommandLine(new[] { "--parentprocessid", "0" });
		});

		// Force Development environment for tests that expect Swagger/UI in dev
		builder.UseEnvironment("Development");

		return base.CreateHost(builder);
	}
}