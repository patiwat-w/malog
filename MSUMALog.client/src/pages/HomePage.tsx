const [filterDomain, setFilterDomain] = useState(localStorage.getItem('filterDomain') || '');

// บันทึกค่าลงใน localStorage เมื่อ Filter เปลี่ยนแปลง
useEffect(() => {
    localStorage.setItem('filterDomain', filterDomain);
}, [filterDomain]);

const handleClearFilter = () => {
    setSearch('');
    setFilterStatus('');
    setFilterSeverity('');
    setFilterDomain('');
    localStorage.removeItem('filterSearch');
    localStorage.removeItem('filterStatus');
    localStorage.removeItem('filterSeverity');
    localStorage.removeItem('filterDomain');
};

// Filtered issues
const filteredIssues = issues.filter(issue => {
    const titleMatch = !search || (issue.title ?? '').toLowerCase().includes(search.toLowerCase());
    const statusMatch = !filterStatus || String(issue.status ?? '') === filterStatus;
    const severityMatch = !filterSeverity || String(issue.severity ?? '') === filterSeverity;
    const domainMatch = !filterDomain || String(issue.domain ?? '') === filterDomain;
    return titleMatch && statusMatch && severityMatch && domainMatch;
});

// เพิ่ม Filter Domain ใน Dialog
<Dialog
    open={filterDialogOpen}
    onClose={() => setFilterDialogOpen(false)}
    fullWidth
    maxWidth="xs"
    PaperProps={{
        sx: {
            position: 'absolute',
            top: 0,
            margin: 0
        }
    }}
>
    <DialogTitle>Filters</DialogTitle>
    <DialogContent dividers>
        <TextField
            select
            label="Status"
            size="small"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
        >
            <MenuItem value="">All Status</MenuItem>
            {incidentStatusOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
        </TextField>
        <TextField
            select
            label="Severity"
            size="small"
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
        >
            <MenuItem value="">All Severity</MenuItem>
            {severityOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.labelInEn}</MenuItem>
            ))}
        </TextField>
        <TextField
            select
            label="Domain"
            size="small"
            value={filterDomain}
            onChange={e => setFilterDomain(e.target.value)}
            fullWidth
        >
            <MenuItem value="">All Domains</MenuItem>
            {domainOptions.map(opt => (
                <MenuItem key={opt.code} value={opt.code}>{opt.label}</MenuItem>
            ))}
        </TextField>
    </DialogContent>
    <DialogActions>
        <Button
            color="secondary"
            onClick={() => {
                handleClearFilter();
                setFilterDialogOpen(false);
            }}
        >
            Clear Filter
        </Button>
        <Button onClick={() => setFilterDialogOpen(false)}>Apply</Button>
    </DialogActions>
</Dialog>