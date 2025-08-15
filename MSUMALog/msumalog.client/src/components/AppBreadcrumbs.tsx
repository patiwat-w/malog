import { Breadcrumbs, Link as MUILink, Typography } from '@mui/material'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { Box, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

// กำหนด mapping ของ segment -> label
// สำหรับ path ที่เป็น dynamic (เช่น :id) จะจัดการด้านล่าง
const staticLabels: Record<string, string> = {
  home: 'Home',
  issue: 'Issue'
}

export default function AppBreadcrumbs() {
  const location = useLocation()
  const navigate = useNavigate()

  const pathnames = useMemo(
    () => location.pathname.split('/').filter(Boolean),
    [location.pathname]
  )

  // ฟังก์ชันสร้าง label
  const buildLabel = (segment: string, index: number) => {
    // ตรวจจับกรณี issue/:id
    if (segment && index > 0) {
      // ถ้า segment ก่อนหน้าเป็น issue และปัจจุบันคือ id
      if (pathnames[index - 1] === 'issue') {
        return `#${segment}`
      }
    }
    return staticLabels[segment] || segment
  }

  const goParent = () => {
    if (pathnames.length <= 1) {
      navigate('/home', { replace: true })
      return
    }
    const parent = '/' + pathnames.slice(0, -1).join('/')
    navigate(parent)
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ flexGrow: 1, mb: 0 }}>
        <MUILink
          component={Link}
          underline="hover"
          color="inherit"
          to="/home"
        >
          Home
        </MUILink>

        {pathnames.map((segment, index) => {
          const to = '/' + pathnames.slice(0, index + 1).join('/')
          const isLast = index === pathnames.length - 1
          const label = buildLabel(segment, index)

          // ข้าม segment แรกถ้าเป็น 'home' (เพราะเราใส่ Home ไว้แล้ว)
          if (index === 0 && segment === 'home') return null

          if (isLast) {
            return (
              <Typography color="text.primary" key={to}>
                {label}
              </Typography>
            )
          }
          return (
            <MUILink
              component={Link}
              underline="hover"
              color="inherit"
              to={to}
              key={to}
            >
              {label}
            </MUILink>
          )
        })}
      </Breadcrumbs>
      <IconButton
        size="small"
        aria-label="up one level"
        onClick={goParent}
        sx={{ flexShrink: 0 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  )
}