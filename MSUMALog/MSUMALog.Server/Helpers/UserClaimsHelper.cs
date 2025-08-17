using System.Security.Claims;
using System.Linq;
using MSUMALog.Server.Models;
using MSUMALog.Server.Data; // สมมติว่า DbContext อยู่ namespace นี้

namespace MSUMALog.Server.Helpers;

public static class UserClaimsHelper
{
    public static int? GetUserId(ClaimsPrincipal user)
    {
        if (user == null)
            return null;

        int? minId = null;
        foreach (var claim in user.Claims.Where(c => c.Type == ClaimTypes.NameIdentifier))
        {
            if (int.TryParse(claim.Value, out var id))
            {
                if (minId == null || id < minId.Value)
                    minId = id;
            }
        }

        return minId;
    }

    public static string? GetEmail(ClaimsPrincipal user)
    {
        return user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value
            ?? user.Identity?.Name;
    }

    public static bool IsAuthenticated(ClaimsPrincipal user)
    {
        return user.Identity?.IsAuthenticated ?? false;
    }

    public static IEnumerable<(string Type, string Value)> GetAllClaims(ClaimsPrincipal user)
    {
        return user.Claims.Select(c => (c.Type, c.Value));
    }

    public static User? GetUser(ClaimsPrincipal user, ApplicationDbContext db)
    {
        var userId = GetUserId(user);
        if (userId == null)
            return null;

        var userEntity = db.Users.FirstOrDefault(u => u.Id == userId.Value);
        if (userEntity != null)
            db.Entry(userEntity).State = Microsoft.EntityFrameworkCore.EntityState.Detached;
        return userEntity;
    }
}