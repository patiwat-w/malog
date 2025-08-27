using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Linq;
using Microsoft.AspNetCore.Mvc;

namespace  MSUMALog.Server.Swagger
{
    public class MinimalFileUploadOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            if (context.ApiDescription.HttpMethod == "POST")
            {
                var formParams = context.MethodInfo.GetParameters()
                    .Where(p => p.ParameterType == typeof(IFormFile)).ToList();

                if (formParams.Any())
                {
                    operation.RequestBody = new OpenApiRequestBody
                    {
                        Content =
                        {
                            ["multipart/form-data"] = new OpenApiMediaType
                            {
                                Schema = new OpenApiSchema
                                {
                                    Type = "object",
                                    Properties = formParams.ToDictionary(
                                        k => k.Name!,
                                        v => new OpenApiSchema
                                        {
                                            Type = "string",
                                            Format = "binary"
                                        })
                                }
                            }
                        }
                    };
                }
            }
        }
    }
}