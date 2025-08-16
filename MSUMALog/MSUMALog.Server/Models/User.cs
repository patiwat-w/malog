using System;
using System.Text.Json.Serialization;

namespace MSUMALog.Server.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public int LoginCount { get; set; }
        public DateTime LastLoginDate { get; set; }
        public string Logs { get; set; }
        // hide password hash from API responses
        [JsonIgnore]
        public string? PasswordHash { get; set; }
        public string? ProfilePicture { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Position { get; set; }
        public string? Department { get; set; }
    }
}