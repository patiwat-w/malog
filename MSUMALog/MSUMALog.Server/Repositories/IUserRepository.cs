using MSUMALog.Server.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MSUMALog.Server.Repositories
{
    public interface IUserRepository
    {
        Task<List<User>> GetAllUsersAsync();
        Task<User?> GetUserByIdAsync(int userId);
        Task AddUserAsync(User user);
        Task UpdateUserAsync(User user);
        Task DeleteUserAsync(int userId);
        Task BlockUserAsync(int userId);
        Task UnblockUserAsync(int userId);
        Task<bool> UserExistsAsync(int userId);
    }
}