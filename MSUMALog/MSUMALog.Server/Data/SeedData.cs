using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Models;
using System.Linq;

namespace MSUMALog.Server.Data
{
    public static class SeedData
    {
        public static void Initialize(ApplicationDbContext context)
        {
            // ลบ context.Database.EnsureCreated();

            if (context.Users.Any()) return;

            // var incidentReports = new[]
            // {
            //     new IncidentReport
            //     {
            //         CaseNo = "2025-08-0001",
            //         Asset = "รถ MSU-6",
            //         Center = "รพร.ปัว",
            //         IncidentDate = new DateTime(2025, 8, 10),
            //         Symptoms = "คลัชจม ไม่สามารถเปลี่ยนเกียร์ได้ รถขับไม่ได้",
            //         Severity = "1",
            //         Impact = "หยุดการให้บริการ",
            //         Domain = "001",
            //         SubDomain = "ตัวรถและเครื่องยนต์",
            //         Vendor = "RMA",
            //         Manufacturer = "Mecedenz-Benz",
            //         PartNumber = "OF-917 version Euro3",
            //         AdditionalInfo = "N/A",
            //         InterimAction = "จากการตรวจสอบคาดว่าปั๊มน้ำมันคลัชตัวล่างน่าจะมีปัญหา น้ำมันแห้งจนลูกสูบปั๊มคลัชติด ทำให้แป้นคลัชจม ไม่สามารถเปลี่ยนเกียร์ได้ โดยวันที่ 14/8/2568 ทาง พชร. จาก รพร.ปัว (พี่ดู่) ได้แก้ไขตามคำแนะนำของ EG โดยเดิมน้ำมันคลัช (DOT-4) และไล่ลมใหม่ เบื้องต้นล้มเหลว แต่ได้ดำเนินการใหม่โดยการอัดน้ำมันผ่านหลอดฉีดยาเข้าไปที่จุดไล่ลมปั๊มคลัชตัวล่าง จนลูกสูบหลุด และเริ่มดำเนินการจนคลัชกลับมาทำงานได้และขับได้ และนำรถกลับ รพร.ปัว",
            //         IntermediateAction = "ให้ รพร.ปัว ติดต่ออู่ซ่อมรถใหญ่ เพื่อทำการตรวจสอบระบบคลัช และปั๊มคลัชตัวล่าง ระบุจุดรั่วซึม และกำหนด part ที่มีปัญหา ทาง EG ดำเนินการขอใบเสนอราคาของตัวยปั๊มคลัชตัวล่าง SI พิจารณาเตรียมจัดซื้อ",
            //         LongTermAction = "จากคู่มือ น้ำมันคลัช ต้องมีการตรวจสอบระดับน้ำมัน และรอยรั่วซึมทุกๆ 6 เดือน และมีการเปลี่ยนถ่ายน้ำมันทุก 6 เดือน จึงควรบรรจุลงในแผนการซ่อมบำรุง แผนการ Training พชร. ใน MSU-SOS Standardization",
            //         Status = "In Progress",
            //         CreatedUserId = 1,
            //         UpdatedUserId = 1,
            //         ResponsibleName = "Pornchai Chanyagorn",
            //         ResponsibleLineId = "pornchai_line",
            //         ResponsibleEmail = "pornchai@example.com",
            //         ResponsiblePhone = "081-234-5678"
            //     }
            // };

            // context.IncidentReports.AddRange(incidentReports);
            // context.SaveChanges();

            var users = new[]
            {
                new User
                {
                    Id = 3,
                    Email = "patiwat.pfc@gmail.com",
                    Role = "Admin",
                    LoginCount = 8,
                    LastLoginDate = new DateTime(2025, 8, 16, 11, 27, 55, 4348662),
                    Logs = "Basic login",
                    PasswordHash = "AQAAAAIAAYagAAAAEEBnrb5iiYW+Mvs+ELmWGmkXLfwx4K8ZvSgLWXIVv14L/+pzf1xXfhtT/zqA0LgA4g==",
                    ProfilePicture = "https://lh3.googleusercontent.com/a/ACg8ocIgdJQ3P6bCYoIvJdpPFxxzLaT4lWN7Gc3egzG40OqpoH702Ukm=s96-c",
                    FirstName = "Patiwat",
                    LastName = "W",
                    Position = null,
                    Department = null
                }
            };

            context.Users.AddRange(users);
            context.SaveChanges();
        }
    }
}