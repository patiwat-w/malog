using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Data;
using MSUMALog.Server.Models;
using MSUMALog.Server.Services;
using Xunit;

namespace MSUMALog.Server.Services.Tests
{
    public class UserServiceTests
    {
        [Fact]
        public async Task GetAllUsersAsync_ReturnsProjectedDtos()
        {
            var opts = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase("users-test-db")
                .Options;

            await using var db = new ApplicationDbContext(opts);

            var user = new User
            {
                Id = 1,
                FirstName = "F",
                LastName = "L",
                Email = "e@e",
                PhoneNumber = "123",
                LineID = "Line",
                OrganizationInfo = "Org",
                Role = "R",
                IsBlocked = false,
                ReceiveNotifications = true,
                ProfilePicture = "pic"
                
            };

            // Ensure required navigation/collection properties (like Logs) are set to an empty collection
            var logsProp = typeof(User).GetProperty("Logs", BindingFlags.Public | BindingFlags.Instance);
            if (logsProp != null && logsProp.GetValue(user) == null)
            {
                var propType = logsProp.PropertyType;

                // skip simple types (e.g. string) and nullable/value types
                if (propType == typeof(string) || propType.IsValueType)
                {
                    // nothing to initialize
                }
                else if (propType.IsGenericType)
                {
                    // create List<T> for generic collection interfaces or concrete generic collection types
                    var itemType = propType.GetGenericArguments()[0];
                    var listType = typeof(List<>).MakeGenericType(itemType);
                    if (propType.IsAssignableFrom(listType))
                    {
                        logsProp.SetValue(user, Activator.CreateInstance(listType));
                    }
                    else
                    {
                        // try to instantiate the concrete type if it has a parameterless ctor
                        if (!propType.IsAbstract)
                        {
                            try { logsProp.SetValue(user, Activator.CreateInstance(propType)); } catch { /* ignore */ }
                        }
                    }
                }
                else if (!propType.IsAbstract && propType.IsClass)
                {
                    // safe attempt to create instance for concrete reference types (not string)
                    try { logsProp.SetValue(user, Activator.CreateInstance(propType)); } catch { /* ignore */ }
                }
            }

            db.Users.Add(user);
            await db.SaveChangesAsync();

            var svc = new UserService(db);
            var list = await svc.GetAllUsersAsync();

            Assert.Single(list);
            Assert.Equal("F", list[0].FirstName);
            Assert.Equal("e@e", list[0].Email);
        }
    }
}