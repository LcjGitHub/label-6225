import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import TranslateIcon from '@mui/icons-material/Translate'
import QuizIcon from '@mui/icons-material/Quiz'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  createPair,
  deletePair,
  fetchPairs,
  updatePair,
} from '../api/pairs'
import { PairFormDialog } from '../components/PairFormDialog'
import type { LanguagePair, PairPayload } from '../types'

/**
 * 语言对列表页
 */
export function PairListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['pairs'],
    queryFn: fetchPairs,
  })

  const [formOpen, setFormOpen] = useState(false)
  const [editingPair, setEditingPair] = useState<LanguagePair | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingPair, setDeletingPair] = useState<LanguagePair | null>(null)

  const createMutation = useMutation({
    mutationFn: (payload: PairPayload) => createPair(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pairs'] })
      setFormOpen(false)
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error || '操作失败，请稍后重试')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      pairId,
      payload,
    }: {
      pairId: number
      payload: PairPayload
    }) => updatePair(pairId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pairs'] })
      setFormOpen(false)
      setEditingPair(null)
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error || '操作失败，请稍后重试')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (pairId: number) => deletePair(pairId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pairs'] })
      setDeleteConfirmOpen(false)
      setDeletingPair(null)
    },
  })

  const handleOpenCreate = () => {
    setEditingPair(null)
    setFormError(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (pair: LanguagePair) => {
    setEditingPair(pair)
    setFormError(null)
    setFormOpen(true)
  }

  const handleOpenDelete = (pair: LanguagePair) => {
    setDeletingPair(pair)
    setDeleteConfirmOpen(true)
  }

  const handleSubmit = (payload: PairPayload) => {
    if (editingPair) {
      updateMutation.mutate({ pairId: editingPair.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleConfirmDelete = () => {
    if (deletingPair) {
      deleteMutation.mutate(deletingPair.id)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <TranslateIcon color="primary" fontSize="large" />
        <Typography variant="h4" component="h1">
          假朋友词对照表
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography color="text.secondary">
          选择语言对，查看形似义异的易混词汇。
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          新建语言对
        </Button>
      </Box>

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

      {deleteMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          删除失败：
          {deleteMutation.error instanceof Error
            ? deleteMutation.error.message
            : '未知错误'}
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
          <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
            <Tooltip title={(pair.entry_count ?? 0) === 0 ? '暂无词条，无法测验' : '测验'}>
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  disabled={(pair.entry_count ?? 0) === 0}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/pairs/${pair.id}/quiz`)
                  }}
                >
                  <QuizIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="编辑">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenEdit(pair)
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="删除">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenDelete(pair)
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </CardActions>
        </Card>
      ))}

      <PairFormDialog
        open={formOpen}
        initial={editingPair}
        error={formError}
        onClose={() => {
          setFormOpen(false)
          setFormError(null)
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除语言对「{deletingPair?.label}」吗？此操作将同时删除该语言对下的所有词条，且无法恢复。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>取消</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
