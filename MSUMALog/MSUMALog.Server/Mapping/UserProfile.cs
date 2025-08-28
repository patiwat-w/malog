using AutoMapper;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Mapping
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
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

            CreateMap<UserDto, User>()
                .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
                .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.LineID, opt => opt.MapFrom(src => src.LineID))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.OrganizationInfo, opt => opt.MapFrom(src => src.OrganizationInfo))
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role))
                .ForMember(dest => dest.IsBlocked, opt => opt.MapFrom(src => src.IsBlocked))
                .ForMember(dest => dest.ReceiveNotifications, opt => opt.MapFrom(src => src.ReceiveNotifications));
        }
    }
}