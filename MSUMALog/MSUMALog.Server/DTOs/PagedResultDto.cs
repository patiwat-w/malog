namespace MSUMALog.Server.DTOs
{
    public class PagedResultDto<T>
    {
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public IEnumerable<T> Items { get; set; } = [];
    }
}