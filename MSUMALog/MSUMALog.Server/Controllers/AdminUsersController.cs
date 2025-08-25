using Microsoft.AspNetCore.Mvc;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;
using MSUMALog.Server.Services;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace MSUMALog.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminUsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public AdminUsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpGet("paged")]
        public async Task<ActionResult<PagedResultDto<IDictionary<string, object?>>>> GetPaged(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 10,
            [FromQuery] string? select = null,
            [FromQuery] string? order = null,
            [FromQuery] Dictionary<string, string>? filter = null,
            CancellationToken ct = default)
        {
            var selectFields = (select ?? "Id,Email,FirstName,LastName,Role,IsBlocked").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var result = await _userService.SearchAsync(page, limit, filter ?? new Dictionary<string, string>(), order, selectFields, ct);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }
            return Ok(user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UserDto userDto)
        {
            if (id != userDto.Id)
            {
                return BadRequest();
            }

            await _userService.UpdateUserAsync(userDto);
            return NoContent();
        }

        [HttpPost("{id}/block")]
        public async Task<IActionResult> BlockUser(int id)
        {
            await _userService.BlockUserAsync(id);
            return NoContent();
        }

        [HttpPost("{id}/unblock")]
        public async Task<IActionResult> UnblockUser(int id)
        {
            await _userService.UnblockUserAsync(id);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            await _userService.DeleteUserAsync(id);
            return NoContent();
        }
    }
}