using System;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

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
        
        [JsonIgnore]
        [MaxLength(256)]
        public string? PasswordHash { get; set; }
        
        public string? ProfilePicture { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Position { get; set; }
        public string? Department { get; set; }
        
        // New properties for user management
        public string? PhoneNumber { get; set; }

        public string? LineID { get; set; }
        public string? OrganizationInfo { get; set; }
        public bool IsBlocked { get; set; }
        public bool ReceiveNotifications { get; set; }
    }
}