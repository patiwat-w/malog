using AutoMapper;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Mappings;

public class UserMapperProfile : Profile
{
    public UserMapperProfile()
    {
        // User -> UserDto
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
            .ForMember(dest => dest.LineID, opt => opt.MapFrom(src => src.LineID))
            .ForMember(dest => dest.OrganizationInfo, opt => opt.MapFrom(src => src.OrganizationInfo))
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role))
            .ForMember(dest => dest.IsBlocked, opt => opt.MapFrom(src => src.IsBlocked))
            .ForMember(dest => dest.ReceiveNotifications, opt => opt.MapFrom(src => src.ReceiveNotifications));

        // UserDto -> User
        CreateMap<UserDto, User>()
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.LineID, opt => opt.MapFrom(src => src.LineID))
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
            .ForMember(dest => dest.OrganizationInfo, opt => opt.MapFrom(src => src.OrganizationInfo))
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role))
            .ForMember(dest => dest.IsBlocked, opt => opt.MapFrom(src => src.IsBlocked))
            .ForMember(dest => dest.ReceiveNotifications, opt => opt.MapFrom(src => src.ReceiveNotifications))
            // ignore fields on User that are not in DTO
            .ForMember(dest => dest.LoginCount, o => o.Ignore())
            .ForMember(dest => dest.LastLoginDate, o => o.Ignore())
            .ForMember(dest => dest.Logs, o => o.Ignore())
            .ForMember(dest => dest.PasswordHash, o => o.Ignore())
            .ForMember(dest => dest.Position, o => o.Ignore())
            .ForMember(dest => dest.Department, o => o.Ignore());
    }
}