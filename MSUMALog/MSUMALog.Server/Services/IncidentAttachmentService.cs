using System.IO;
using System.Linq;
using System;
using System.Threading;
using System.Threading.Tasks;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;
using AutoMapper;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;
using MSUMALog.Server.Repositories;

namespace MSUMALog.Server.Services;

public class IncidentAttachmentService : IIncidentAttachmentService
{
    private readonly IIncidentAttachmentRepository _repo;
    private readonly IMapper _mapper;
    private readonly IWebHostEnvironment _env;
    private readonly UploadsOptions _opts;
    private readonly FileExtensionContentTypeProvider _contentTypeProvider = new();

    public IncidentAttachmentService(
        IIncidentAttachmentRepository repo,
        IMapper mapper,
        IOptions<UploadsOptions> opts,
        IWebHostEnvironment env)
    {
        _repo = repo;
        _mapper = mapper;
        _env = env;
        _opts = opts.Value;
    }

    public async Task<IncidentAttachmentDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var e = await _repo.GetByIdAsync(id, ct);
        if (e == null) return null;
        var dto = _mapper.Map<IncidentAttachmentDto>(e);
        // never expose physical path
        return dto;
    }

    public async Task<List<IncidentAttachmentDto>> GetByIncidentIdAsync(int incidentId, CancellationToken ct = default)
    {
        var list = await _repo.GetByIncidentIdAsync(incidentId, ct);
        return list.Select(a => _mapper.Map<IncidentAttachmentDto>(a)).ToList();
    }

    public async Task<IncidentAttachmentDto> CreateAsync(IncidentAttachmentDto dto, CancellationToken ct = default)
    {
        var entity = _mapper.Map<IncidentAttachment>(dto);
        entity.CreatedUtc = DateTime.UtcNow;
        await _repo.AddAsync(entity, ct);
        var reloaded = await _repo.GetByIdAsync(entity.Id, ct);
        return _mapper.Map<IncidentAttachmentDto>(reloaded!);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var e = await _repo.GetByIdAsync(id, ct);
        if (e == null) return false;
        await _repo.DeleteAsync(e, ct);
        return true;
    }

    // Upload implementation used by controller
    public async Task<IncidentAttachmentDto> UploadAsync(
        IFormFile file,
        int incidentId,
        int? createdUserId,
        string? description,
        string? kind,
        CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("file required", nameof(file));

        if (_opts.MaxFileSizeBytes > 0 && file.Length > _opts.MaxFileSizeBytes)
            throw new InvalidOperationException($"file too large (>{_opts.MaxFileSizeBytes} bytes)");

        // Root path
        var uploadRoot = string.IsNullOrWhiteSpace(_opts.RootPath)
            ? Path.Combine(_env.WebRootPath ?? ".", "uploads")
            : _opts.RootPath;

        // ตรวจ mime แบบเชื่อถือได้มากขึ้น (จาก extension) + fallback
        var originalFileName = Path.GetFileName(file.FileName);
        var ext = Path.GetExtension(originalFileName) ?? string.Empty;

        if (!_contentTypeProvider.TryGetContentType(originalFileName, out var trustedContentType) ||
            string.IsNullOrWhiteSpace(trustedContentType))
        {
            trustedContentType = file.ContentType; // จาก client
        }
        if (string.IsNullOrWhiteSpace(trustedContentType))
            trustedContentType = "application/octet-stream";

        // white-list
        if (_opts.AllowedMimePrefixes?.Length > 0)
        {
            var allowed = _opts.AllowedMimePrefixes.Any(p =>
                trustedContentType.StartsWith(p, StringComparison.OrdinalIgnoreCase));

            if (!allowed)
                throw new InvalidOperationException($"mime not allowed: {trustedContentType}");
        }

        // โครงสร้าง path
        var y = DateTime.UtcNow.ToString("yyyy");
        var m = DateTime.UtcNow.ToString("MM");
        var relDir = Path.Combine("incident", y, m, incidentId.ToString());
        var relDirSlash = relDir.Replace('\\', '/');

        // ตั้งชื่อไฟล์ใหม่ให้ unique
        var newName = $"{Guid.NewGuid():N}{ext}";
        var relPath = Path.Combine(relDir, newName).Replace('\\', '/');

        // physical paths
        var physicalDir = Path.GetFullPath(Path.Combine(uploadRoot, relDir));
        var physicalPath = Path.GetFullPath(Path.Combine(uploadRoot, relPath));

        // ป้องกัน path traversal
        var uploadRootFull = Path.GetFullPath(uploadRoot);
        if (!physicalPath.StartsWith(uploadRootFull, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Invalid upload path");

        Directory.CreateDirectory(physicalDir);

        // เขียนผ่านไฟล์ชั่วคราวก่อน แล้วย้าย
        var tempPath = Path.Combine(physicalDir, $"{Guid.NewGuid():N}.tmp");

        try
        {
            await using (var fs = new FileStream(tempPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 64 * 1024, useAsync: true))
            {
                await file.CopyToAsync(fs, ct);
            }

            // คำนวณ hash (optional แต่มีประโยชน์)
            string sha256Hex;
            await using (var read = new FileStream(tempPath, FileMode.Open, FileAccess.Read, FileShare.Read, 64 * 1024, useAsync: true))
            using (var sha = SHA256.Create())
            {
                var hash = await sha.ComputeHashAsync(read, ct);
                sha256Hex = Convert.ToHexString(hash);
            }

            // ย้าย temp → ปลายทาง (atomic-ish)
            File.Move(tempPath, physicalPath);

            var entity = new IncidentAttachment
            {
                IncidentId = incidentId,
                StorageKey = relPath,       // คีย์เก็บใน DB
                RelativePath = relPath,     // ใช้ประกอบ URL สาธารณะ
                PhysicalPath = physicalPath, // ไม่ expose ออก API
                FileName = originalFileName,
                ContentType = trustedContentType,
                SizeBytes = new FileInfo(physicalPath).Length,
                IsExternal = false,
                Kind = ParseKind(kind) ?? DetectKindFromContentType(trustedContentType, ext),
                Description = description,
                CreatedUserId = createdUserId,
                CreatedUtc = DateTime.UtcNow,
                // เพิ่มฟิลด์ Hash ในตารางได้ถ้าต้องการ (เช่น ContentHash = sha256Hex)
            };

            await _repo.AddAsync(entity, ct);
            var reloaded = await _repo.GetByIdAsync(entity.Id, ct);
            return _mapper.Map<IncidentAttachmentDto>(reloaded!);
        }
        catch
        {
            // ทำความสะอาดไฟล์ temp เมื่อเกิด error
            if (File.Exists(tempPath))
            {
                try { File.Delete(tempPath); } catch { /* ignore */ }
            }
            throw;
        }
    }

    public async Task<StoredFileResult?> GetFileAsync(int id, CancellationToken ct = default)
    {
        var e = await _repo.GetByIdAsync(id, ct);
        if (e == null) return null;

        // ถ้าเป็นไฟล์ external ยังไม่รองรับในนี้
        if (e.IsExternal)
        {
            return null;
        }

        var physicalPath = e.PhysicalPath;
        if (string.IsNullOrWhiteSpace(physicalPath) || !File.Exists(physicalPath))
            return null;

        // เปิดสตรีมเพื่อส่งกลับ (Framework จะเป็นผู้ปิดเมื่อ response เสร็จ)
        var fs = new FileStream(physicalPath, FileMode.Open, FileAccess.Read, FileShare.Read, 64 * 1024, useAsync: true);

        var contentType = e.ContentType;
        if (string.IsNullOrWhiteSpace(contentType))
        {
            if (!_contentTypeProvider.TryGetContentType(e.FileName ?? physicalPath, out var ctFromExt) || string.IsNullOrWhiteSpace(ctFromExt))
                contentType = "application/octet-stream";
            else
                contentType = ctFromExt;
        }

        return new StoredFileResult(fs, e.FileName ?? Path.GetFileName(physicalPath), contentType, fs.Length);
    }

    public async Task<StoredFileInfoDto?> GetFileInfoAsync(int id, CancellationToken ct = default)
    {
        var e = await _repo.GetByIdAsync(id, ct);
        if (e == null) return null;

        var fileName = e.FileName ?? Path.GetFileName(e.PhysicalPath ?? e.StorageKey ?? string.Empty);
        var dto = new StoredFileInfoDto
        {
            FileName = fileName,
            ContentType = e.ContentType,
            SizeBytes = e.SizeBytes ?? 0,
            IsExternal = e.IsExternal,
            ExternalUrl = null
        };

        if (e.IsExternal)
        {
            var url = e.StorageKey ?? e.PhysicalPath;
            if (!string.IsNullOrWhiteSpace(url) && Uri.IsWellFormedUriString(url, UriKind.Absolute))
                dto.ExternalUrl = url;
        }

        return dto;
    }

    private static AttachmentType DetectKindFromContentType(string contentType, string ext)
    {
        if (!string.IsNullOrEmpty(contentType))
        {
            if (contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)) return AttachmentType.Image;
            if (contentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase)) return AttachmentType.Video;
            if (contentType.StartsWith("audio/", StringComparison.OrdinalIgnoreCase)) return AttachmentType.Audio;
        }

        // เผื่อบางกรณีเช็คจากสกุลไฟล์
        var e = ext.ToLowerInvariant();
        if (e is ".jpg" or ".jpeg" or ".png" or ".gif" or ".webp" or ".bmp") return AttachmentType.Image;
        if (e is ".mp4" or ".mov" or ".mkv" or ".avi" or ".webm") return AttachmentType.Video;
        if (e is ".mp3" or ".wav" or ".m4a" or ".flac" or ".aac") return AttachmentType.Audio;

        return AttachmentType.File;
    }

    private static AttachmentType? ParseKind(string? kind)
    {
        if (string.IsNullOrWhiteSpace(kind)) return null;
        return Enum.TryParse<AttachmentType>(kind, true, out var v) ? v : (AttachmentType?)null;
    }
}