using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Swashbuckle.AspNetCore.Annotations;
using Microsoft.Extensions.Configuration;

namespace MSUMALog.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadFileController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public UploadFileController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public class UploadFileRequest
        {
            [SwaggerParameter(Description = "File to upload")]
            public required IFormFile File { get; set; }
            public int? SubjectId { get; set; }
            public int? UserId { get; set; }
            public string? FileType { get; set; }
        }

        [HttpPost]
        [Route("Upload")]
        [Consumes("multipart/form-data")]
        [SwaggerOperation(
            Summary = "Upload a file",
            Description = "Uploads a file and stores its information in the database"
        )]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Upload([FromForm] UploadFileRequest request)
        {
            if (request.File == null || request.File.Length == 0)
                return BadRequest("No file uploaded.");

            var uploadsFolder = "Uploads";
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var filePath = Path.Combine(uploadsFolder, request.File.FileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await request.File.CopyToAsync(stream);
            }

            var fileInfo = new FileInfo(filePath);

            // var connectionString = _configuration.GetConnectionString("DataCollectionDb");
            // using (var connection = new SqlConnection(connectionString))
            // {
            //     var query = @"INSERT INTO Files (Name, Length, CreationTime, LastAccessTime, 
            //                  LastWriteTime, FilePath, SubjectId, UserId, FileType) 
            //                  VALUES (@Name, @Length, @CreationTime, @LastAccessTime, 
            //                  @LastWriteTime, @FilePath, @SubjectId, @UserId, @FileType)";
                             
            //     using (var command = new SqlCommand(query, connection))
            //     {
            //         command.Parameters.AddWithValue("@Name", fileInfo.Name);
            //         command.Parameters.AddWithValue("@Length", fileInfo.Length);
            //         command.Parameters.AddWithValue("@CreationTime", fileInfo.CreationTime);
            //         command.Parameters.AddWithValue("@LastAccessTime", fileInfo.LastAccessTime);
            //         command.Parameters.AddWithValue("@LastWriteTime", fileInfo.LastWriteTime);
            //         command.Parameters.AddWithValue("@FilePath", filePath);
            //         command.Parameters.AddWithValue("@SubjectId", request.SubjectId.HasValue ? (object)request.SubjectId.Value : DBNull.Value);
            //         command.Parameters.AddWithValue("@UserId", request.UserId.HasValue ? (object)request.UserId.Value : DBNull.Value);
            //         command.Parameters.AddWithValue("@FileType", request.FileType != null ? (object)request.FileType : DBNull.Value);

            //         connection.Open();
            //         await command.ExecuteNonQueryAsync();
            //     }
            // }

            return Ok(new 
            { 
                filePath, 
                request.SubjectId,
                request.UserId,
                request.FileType,
                fileInfo = new 
                {
                    fileInfo.Name,
                    fileInfo.Length,
                    fileInfo.CreationTime,
                    fileInfo.LastAccessTime,
                    fileInfo.LastWriteTime
                }
            });
        }
    }
}
