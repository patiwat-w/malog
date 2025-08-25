using System;

namespace MSUMALog.Server.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public string LineID { get; set; }
        public string OrganizationInfo { get; set; }
        public string ProfilePicture { get; set; }
        public bool IsBlocked { get; set; }
        public bool ReceiveNotifications { get; set; }
    }
}