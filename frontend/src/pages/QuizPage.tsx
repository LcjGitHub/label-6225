import { useState } from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RefreshIcon from '@mui/icons-material/Refresh'
import QuizIcon from '@mui/icons-material/Quiz'
import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { fetchPair, fetchRandomEntry } from '../api/pairs'
import axios from 'axios'

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data?.error) {
    return err.response.data.error
  }
  if (err instanceof Error) return err.message
  return '未知错误'
}

function isNoEntryError(err: unknown): boolean {
  if (axios.isAxiosError(err) && err.response?.data?.error) {
    return err.response.data.error.includes('暂无词条')
  }
  return false
}

/**
 * 学习卡片测验页
 */
export function QuizPage() {
  const { pairId } = useParams<{ pairId: string }>()
  const id = Number(pairId)

  const [isFlipped, setIsFlipped] = useState(false)
  const [queryKey, setQueryKey] = useState(0)

  const pairQuery = useQuery({
    queryKey: ['pair', id],
    queryFn: () => fetchPair(id),
    enabled: Number.isFinite(id),
  })

  const entryQuery = useQuery({
    queryKey: ['random-entry', id, queryKey],
    queryFn: () => fetchRandomEntry(id),
    enabled: Number.isFinite(id),
    retry: false,
  })

  const noEntries = entryQuery.isError && isNoEntryError(entryQuery.error)

  const handleNext = () => {
    setIsFlipped(false)
    setQueryKey((k) => k + 1)
  }

  const handleFlip = () => {
    if (!isFlipped && !entryQuery.isLoading && entryQuery.data) {
      setIsFlipped(true)
    }
  }

  if (!Number.isFinite(id)) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">无效的语言对 ID</Alert>
      </Container>
    )
  }

  const langA = pairQuery.data?.lang_a ?? '语言甲'
  const langB = pairQuery.data?.lang_b ?? '语言乙'

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        component={RouterLink}
        to={`/pairs/${id}`}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        返回词条列表
      </Button>

      {pairQuery.isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {pairQuery.isError && (
        <Alert severity="error">语言对不存在或加载失败</Alert>
      )}

      {pairQuery.data && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <QuizIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="h5" component="h1">
                {pairQuery.data.label} · 测验
              </Typography>
              <Typography color="text.secondary" variant="body2">
                看{langA}词，回忆{langB}词
              </Typography>
            </Box>
          </Box>

          {noEntries ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>暂无词条</AlertTitle>
              {getErrorMessage(entryQuery.error)}，请先添加词条后再来测验。
            </Alert>
          ) : (
            <Box
              onClick={handleFlip}
              sx={{
                mb: 3,
                cursor: entryQuery.isLoading || !entryQuery.data ? 'default' : 'pointer',
                perspective: 1000,
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  minHeight: 280,
                  transition: 'transform 0.6s',
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'none',
                }}
              >
                <CardContent
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    minHeight: 280,
                    backfaceVisibility: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: 2,
                    boxShadow: 3,
                    p: 4,
                  }}
                >
                  {entryQuery.isLoading ? (
                    <CircularProgress color="inherit" />
                  ) : entryQuery.isError ? (
                    <Typography align="center">
                      加载失败，请点击「下一题」重试
                    </Typography>
                  ) : entryQuery.data ? (
                    <>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.8, mb: 2 }}
                      >
                        {langA}
                      </Typography>
                      <Typography variant="h3" component="div" align="center">
                        {entryQuery.data.word_a}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ mt: 4, opacity: 0.7 }}
                      >
                        点击卡片查看答案
                      </Typography>
                    </>
                  ) : null}
                </CardContent>

                <CardContent
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    minHeight: 280,
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 3,
                    p: 4,
                  }}
                >
                  {entryQuery.data && (
                    <>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {langB}
                      </Typography>
                      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
                        {entryQuery.data.word_b}
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        含义
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mb: 2, whiteSpace: 'pre-wrap' }}
                      >
                        {entryQuery.data.meaning}
                      </Typography>

                      {entryQuery.data.pitfall && (
                        <>
                          <Typography
                            variant="body2"
                            color="error"
                            sx={{ mb: 0.5, fontWeight: 'medium' }}
                          >
                            易错说明
                          </Typography>
                          <Typography
                            variant="body1"
                            color="error"
                            sx={{ whiteSpace: 'pre-wrap' }}
                          >
                            {entryQuery.data.pitfall}
                          </Typography>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              component={RouterLink}
              to={`/pairs/${id}`}
              startIcon={<ArrowBackIcon />}
            >
              返回词条列表
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleNext}
              disabled={noEntries || entryQuery.isFetching}
            >
              {entryQuery.isFetching ? '加载中…' : '下一题'}
            </Button>
          </Box>
        </>
      )}
    </Container>
  )
}
