using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using System.Threading;
using System.Threading.Tasks;
using MSUMALog.Server.Controllers;
using MSUMALog.Server.Services;
using MSUMALog.Server.Models;
using MSUMALog.Server.DTOs;
using System.Collections.Generic;
using System;

public class AuditControllerTests
{
	// คำอธิบาย: ทดสอบ GetTimeline ว่าเรียก service เพื่อดึง timeline แบบ paging
	// ผลลัพธ์ที่คาดหวัง: คืนค่า OkObjectResult และมีค่าใน Body เท่ากับค่าที่ service ส่งกลับ
	[Fact]
	public async Task GetTimeline_CallsServiceAndReturnsOk()
	{
		var svcMock = new Mock<IAuditService>();
		var expected = new PagedResultDto<AuditTimelineDto>
		{
			Items = new List<AuditTimelineDto> { new AuditTimelineDto
			{
				EntityType = AuditEntityType.IncidentReport,
			} }
		};
		svcMock.Setup(s => s.GetIncidentTimelinePagedAsync(1, 2, 5, It.IsAny<CancellationToken>()))
			   .ReturnsAsync(expected)
			   .Verifiable();

		var controller = new AuditController(svcMock.Object);

		var result = await controller.GetTimeline(1, page: 2, limit: 5, ct: CancellationToken.None);

		var ok = Assert.IsType<OkObjectResult>(result.Result);
		Assert.Equal(expected, ok.Value);
		svcMock.Verify();
	}

	// คำอธิบาย: ทดสอบ GetAuditBatchDetail ว่าเรียก service เพื่อดึงรายละเอียดของ batch audit
	// ผลลัพธ์ที่คาดหวัง: คืนค่า OkObjectResult และ Body เป็นรายการ AuditFieldChangeDto ที่ service ส่งกลับ
	[Fact]
	public async Task GetAuditBatchDetail_ReturnsListOk()
	{
		var svcMock = new Mock<IAuditService>();
		var batchId = Guid.NewGuid();
		var expected = new List<AuditFieldChangeDto> { new AuditFieldChangeDto() };
		svcMock.Setup(s => s.GetAuditBatchDetailAsync(batchId, It.IsAny<CancellationToken>()))
			   .ReturnsAsync(expected)
			   .Verifiable();

		var controller = new AuditController(svcMock.Object);

		var result = await controller.GetAuditBatchDetail(batchId, CancellationToken.None);

		var ok = Assert.IsType<OkObjectResult>(result.Result);
		Assert.Equal(expected, ok.Value);
		svcMock.Verify();
	}

	// คำอธิบาย: ทดสอบ GetTimelineByReference ว่าเรียก service เพื่อดึง timeline ตาม reference (entity/name/id) แบบ paging
	// ผลลัพธ์ที่คาดหวัง: คืนค่า OkObjectResult และ Body ตรงกับค่าที่ service คืน
	[Fact]
	public async Task GetTimelineByReference_CallsServiceAndReturnsOk()
	{
		var svcMock = new Mock<IAuditService>();
		var expected = new PagedResultDto<AuditTimelineDto>
		{
			Items = new List<AuditTimelineDto> { new AuditTimelineDto { EntityType = AuditEntityType.IncidentReport } }
		};
		svcMock.Setup(s => s.GetTimelinePagedByReferenceAsync("EntityName", 42, 3, 20, It.IsAny<CancellationToken>()))
			   .ReturnsAsync(expected)
			   .Verifiable();

		var controller = new AuditController(svcMock.Object);

		var result = await controller.GetTimelineByReference("EntityName", 42, page: 3, limit: 20, ct: CancellationToken.None);

		var ok = Assert.IsType<OkObjectResult>(result.Result);
		Assert.Equal(expected, ok.Value);
		svcMock.Verify();
	}
}
