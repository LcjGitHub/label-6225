import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { PairListPage } from './pages/PairListPage'
import { EntryTablePage } from './pages/EntryTablePage'

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
  },
})

/**
 * 应用根组件：路由 + MUI 主题
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PairListPage />} />
          <Route path="/pairs/:pairId" element={<EntryTablePage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
