import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material'
import TranslateIcon from '@mui/icons-material/Translate'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchPairs } from '../api/pairs'

/**
 * 语言对列表页
 */
export function PairListPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['pairs'],
    queryFn: fetchPairs,
  })

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <TranslateIcon color="primary" fontSize="large" />
        <Typography variant="h4" component="h1">
          假朋友词对照表
        </Typography>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        选择语言对，查看形似义异的易混词汇。
      </Typography>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">
          加载失败：{error instanceof Error ? error.message : '未知错误'}
        </Alert>
      )}

      {data?.map((pair) => (
        <Card key={pair.id} sx={{ mb: 2 }}>
          <CardActionArea onClick={() => navigate(`/pairs/${pair.id}`)}>
            <CardContent>
              <Typography variant="h6">{pair.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {pair.lang_a} · {pair.lang_b} · {pair.entry_count ?? 0} 条词条
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Container>
  )
}
