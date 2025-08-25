using MSUMALog.Server.DTOs;

namespace MSUMALog.Server.Services;

public interface IUserService
{
    Task<List<UserDto>> GetAllUsersAsync(CancellationToken ct = default);
    Task<UserDto> GetUserByIdAsync(int userId, CancellationToken ct = default);
    Task UpdateUserAsync(UserDto userDto, CancellationToken ct = default);
    Task DeleteUserAsync(int userId, CancellationToken ct = default);
    Task BlockUserAsync(int userId, CancellationToken ct = default);
    Task UnblockUserAsync(int userId, CancellationToken ct = default);
    Task UpdateUserRoleAsync(int userId, string role, CancellationToken ct = default);
    Task UpdateUserNotificationPreferenceAsync(int userId, bool receiveNotifications, CancellationToken ct = default);

    // เพิ่มสำหรับ paged search (compatible กับ IncidentReportsController /paged)
    Task<PagedResultDto<IDictionary<string, object?>>> SearchAsync(
        int page,
        int limit,
        Dictionary<string, string>? filter,
        string? order,
        string[] selectFields,
        CancellationToken ct = default
    );
}