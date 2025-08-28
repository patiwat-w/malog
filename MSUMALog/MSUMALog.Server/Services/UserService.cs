using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Data;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _dbContext;

        public UserService(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<UserDto>> GetAllUsersAsync(CancellationToken ct = default)
        {
            return await _dbContext.Users
                .AsNoTracking()
                .Select(user => new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName ?? string.Empty,
                    LastName = user.LastName ?? string.Empty,
                    Role = user.Role,
                    PhoneNumber = user.PhoneNumber ?? string.Empty,
                    OrganizationInfo = user.OrganizationInfo ?? string.Empty,
                    LineID = user.LineID ?? string.Empty,
                    IsBlocked = user.IsBlocked,
                    ReceiveNotifications = user.ReceiveNotifications,
                    ProfilePicture = user.ProfilePicture ?? string.Empty
                })
                .ToListAsync(ct);
        }

        public async Task<UserDto> GetUserByIdAsync(int userId, CancellationToken ct = default)
        {
            var user = await _dbContext.Users
                .AsNoTracking()
                .SingleOrDefaultAsync(u => u.Id == userId, ct);

            if (user == null) 
                throw new KeyNotFoundException($"User with ID {userId} not found.");

            return new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName ?? string.Empty,
                    LastName = user.LastName ?? string.Empty,
                    Role = user.Role,
                    PhoneNumber = user.PhoneNumber ?? string.Empty,
                    OrganizationInfo = user.OrganizationInfo ?? string.Empty,
                    LineID = user.LineID ?? string.Empty,
                    IsBlocked = user.IsBlocked,
                    ReceiveNotifications = user.ReceiveNotifications,
                    ProfilePicture = user.ProfilePicture ?? string.Empty
                };
        }

        public async Task UpdateUserAsync(UserDto userDto, CancellationToken ct = default)
        {
            var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == userDto.Id, ct);
            if (user == null) return;

            user.FirstName = userDto.FirstName;
            user.LastName = userDto.LastName;
            user.Email = userDto.Email;
            user.PhoneNumber = userDto.PhoneNumber;
            user.LineID = userDto.LineID;
            user.OrganizationInfo = userDto.OrganizationInfo;
            user.ProfilePicture = userDto.ProfilePicture;
            user.ReceiveNotifications = userDto.ReceiveNotifications;
            // Do not overwrite sensitive fields like PasswordHash here.

            await _dbContext.SaveChangesAsync(ct);
        }

        public async Task DeleteUserAsync(int userId, CancellationToken ct = default)
        {
            var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null) return;

            _dbContext.Users.Remove(user);
            await _dbContext.SaveChangesAsync(ct);
        }

        public async Task BlockUserAsync(int userId, CancellationToken ct = default)
        {
            var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null) return;

            user.IsBlocked = true;
            await _dbContext.SaveChangesAsync(ct);
        }

        public async Task UnblockUserAsync(int userId, CancellationToken ct = default)
        {
            var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null) return;

            user.IsBlocked = false;
            await _dbContext.SaveChangesAsync(ct);
        }

        public async Task UpdateUserRoleAsync(int userId, string role, CancellationToken ct = default)
        {
            var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null) return;

            user.Role = role;
            await _dbContext.SaveChangesAsync(ct);
        }

        public async Task UpdateUserNotificationPreferenceAsync(int userId, bool receiveNotifications, CancellationToken ct = default)
        {
            var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null) return;

            user.ReceiveNotifications = receiveNotifications;
            await _dbContext.SaveChangesAsync(ct);
        }

        public async Task<PagedResultDto<IDictionary<string, object?>>> SearchAsync(
            int page,
            int limit,
            Dictionary<string, string>? filter,
            string? order,
            string[] selectFields,
            CancellationToken ct = default)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;

            var q = _dbContext.Users.AsNoTracking().AsQueryable();

            // Apply basic filters (supports wildcard * for contains on string fields)
            if (filter != null)
            {
                foreach (var kv in filter)
                {
                    var key = kv.Key;
                    var val = kv.Value ?? string.Empty;
                    if (string.IsNullOrEmpty(val)) continue;

                    // Special-case boolean filter
                    if (string.Equals(key, "IsBlocked", StringComparison.OrdinalIgnoreCase)
                        && bool.TryParse(val, out var b))
                    {
                        q = q.Where(u => EF.Property<bool>(u, "IsBlocked") == b);
                        continue;
                    }

                    // For other fields treat as string contains when '*' present, else equals
                    if (val.Contains("*"))
                    {
                        var term = val.Replace("*", "");
                        q = q.Where(u => EF.Property<string>(u, key) != null && EF.Property<string>(u, key)!.Contains(term));
                    }
                    else
                    {
                        q = q.Where(u => EF.Property<string>(u, key) == val);
                    }
                }
            }

            // Simple ordering: support first order clause only (e.g. "LastName desc, Id")
            if (!string.IsNullOrWhiteSpace(order))
            {
                var first = order.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault();
                if (!string.IsNullOrEmpty(first))
                {
                    var parts = first.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    var field = parts[0];
                    var desc = parts.Length > 1 && parts[1].Equals("desc", StringComparison.OrdinalIgnoreCase);

                    if (desc)
                        q = q.OrderByDescending(u => EF.Property<object>(u, field));
                    else
                        q = q.OrderBy(u => EF.Property<object>(u, field));
                }
                else
                {
                    q = q.OrderBy(u => u.Id);
                }
            }
            else
            {
                q = q.OrderBy(u => u.Id);
            }

            var total = await q.CountAsync(ct);
            var items = await q.Skip((page - 1) * limit).Take(limit).ToListAsync(ct);

            var resultItems = new List<IDictionary<string, object?>>(items.Count);
            var userType = typeof(User);

            foreach (var user in items)
            {
                var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                foreach (var field in selectFields)
                {
                    var f = field.Trim();
                    if (string.IsNullOrEmpty(f)) continue;
                    var prop = userType.GetProperty(f, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                    if (prop == null) 
                    {
                        dict[f] = null;
                        continue;
                    }
                    var val = prop.GetValue(user);
                    // Truncate very long strings for safety
                    if (val is string s && s.Length > 200) val = "Value is too long to display.";
                    dict[f] = val;
                }
                resultItems.Add(dict);
            }

            return new PagedResultDto<IDictionary<string, object?>>
            {
                Page = page,
                PageSize = limit,
                TotalCount = total,
                Items = resultItems
            };
        }
    }
}