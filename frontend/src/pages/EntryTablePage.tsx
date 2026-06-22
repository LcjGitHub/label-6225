import { useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import ClearIcon from '@mui/icons-material/Clear'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import SearchIcon from '@mui/icons-material/Search'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  createEntry,
  deleteEntry,
  exportEntries,
  fetchEntries,
  fetchPair,
  importEntries,
  updateEntry,
} from '../api/pairs'
import { EntryFormDialog } from '../components/EntryFormDialog'
import type { Entry, EntryPayload, EntryQueryParams } from '../types'

/**
 * 词条对照 CRUD 页
 */
export function EntryTablePage() {
  const { pairId } = useParams<{ pairId: string }>()
  const id = Number(pairId)
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [keywordInput, setKeywordInput] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMsg, setSnackbarMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pairQuery = useQuery({
    queryKey: ['pair', id],
    queryFn: () => fetchPair(id),
    enabled: Number.isFinite(id),
  })

  const entriesQuery = useQuery({
    queryKey: ['entries', id, appliedKeyword],
    queryFn: () => {
      const params: EntryQueryParams = {}
      if (appliedKeyword) params.keyword = appliedKeyword
      return fetchEntries(id, Object.keys(params).length > 0 ? params : undefined)
    },
    enabled: Number.isFinite(id),
    placeholderData: (previousData) => previousData,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['entries', id] })
    queryClient.invalidateQueries({ queryKey: ['pairs'] })
  }

  const handleSearch = () => {
    setAppliedKeyword(keywordInput.trim())
  }

  const handleClear = () => {
    setKeywordInput('')
    setAppliedKeyword('')
  }

  const createMutation = useMutation({
    mutationFn: (payload: EntryPayload) => createEntry(id, payload),
    onSuccess: () => {
      invalidate()
      setDialogOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ entryId, payload }: { entryId: number; payload: EntryPayload }) =>
      updateEntry(entryId, payload),
    onSuccess: () => {
      invalidate()
      setDialogOpen(false)
      setEditingEntry(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEntry,
    onSuccess: invalidate,
  })

  const exportMutation = useMutation({
    mutationFn: () => exportEntries(id),
    onSuccess: () => {
      setSnackbarMsg('导出成功')
      setSnackbarOpen(true)
    },
    onError: () => {
      setSnackbarMsg('导出失败，请稍后重试')
      setSnackbarOpen(true)
    },
  })

  const importMutation = useMutation({
    mutationFn: (file: File) => importEntries(id, file),
    onSuccess: (result) => {
      invalidate()
      setImportResult(result)
    },
    onError: () => {
      setSnackbarMsg('导入失败，请检查文件格式')
      setSnackbarOpen(true)
      setImportDialogOpen(false)
      setImportFile(null)
      setImportResult(null)
    },
  })

  const langLabels = useMemo(
    () => ({
      langA: pairQuery.data?.lang_a ?? '语言A',
      langB: pairQuery.data?.lang_b ?? '语言B',
    }),
    [pairQuery.data],
  )

  const handleOpenCreate = () => {
    setEditingEntry(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (entry: Entry) => {
    setEditingEntry(entry)
    setDialogOpen(true)
  }

  const handleSubmit = (payload: EntryPayload) => {
    if (editingEntry) {
      updateMutation.mutate({ entryId: editingEntry.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (entry: Entry) => {
    if (window.confirm(`确定删除「${entry.word_a} / ${entry.word_b}」？`)) {
      deleteMutation.mutate(entry.id)
    }
  }

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending

  if (!Number.isFinite(id)) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">无效的语言对 ID</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        component={RouterLink}
        to="/"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        返回语言对列表
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
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h5">{pairQuery.data.label}</Typography>
              <Typography color="text.secondary">
                {pairQuery.data.lang_a} ↔ {pairQuery.data.lang_b}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
                size="small"
              >
                导出
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileUploadIcon />}
                onClick={() => {
                  setImportFile(null)
                  setImportResult(null)
                  setImportDialogOpen(true)
                }}
                size="small"
              >
                导入
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
              >
                新增词条
              </Button>
            </Box>
          </Box>

          <Paper
            sx={{
              p: 2,
              mb: 2,
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <TextField
              size="small"
              placeholder="搜索甲词、乙词、含义、易错说明"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              sx={{ flex: '1 1 280px', minWidth: 200 }}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                },
              }}
            />
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              size="small"
            >
              搜索
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ClearIcon />}
              onClick={handleClear}
              size="small"
              disabled={!appliedKeyword && !keywordInput}
            >
              清空
            </Button>
            {appliedKeyword && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                关键词：「{appliedKeyword}」 · 匹配 {entriesQuery.data?.length ?? 0} 条
              </Typography>
            )}
          </Paper>

          {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              操作失败，请稍后重试
            </Alert>
          )}

          {entriesQuery.isLoading && !entriesQuery.data && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {entriesQuery.isError && (
            <Alert severity="error">词条加载失败</Alert>
          )}

          {entriesQuery.data && (
            <TableContainer component={Paper} sx={{ position: 'relative' }}>
              {entriesQuery.isFetching && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    bgcolor: 'primary.main',
                    opacity: 0.6,
                    zIndex: 1,
                  }}
                />
              )}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{langLabels.langA}词</TableCell>
                    <TableCell>{langLabels.langB}词</TableCell>
                    <TableCell>含义</TableCell>
                    <TableCell>易错说明</TableCell>
                    <TableCell align="right" width={120}>
                      操作
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entriesQuery.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {appliedKeyword
                          ? '未找到匹配的词条'
                          : '暂无词条，点击「新增词条」添加'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    entriesQuery.data.map((entry) => (
                      <TableRow
                        key={entry.id}
                        hover
                        sx={
                          entriesQuery.isFetching
                            ? { opacity: 0.6, transition: 'opacity 0.2s' }
                            : undefined
                        }
                      >
                        <TableCell>{entry.word_a}</TableCell>
                        <TableCell>{entry.word_b}</TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-wrap' }}>
                          {entry.meaning}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-wrap' }}>
                          {entry.pitfall || '—'}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="编辑">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(entry)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="删除">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(entry)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      <EntryFormDialog
        open={dialogOpen}
        langA={langLabels.langA}
        langB={langLabels.langB}
        initial={editingEntry}
        onClose={() => {
          setDialogOpen(false)
          setEditingEntry(null)
        }}
        onSubmit={handleSubmit}
        isSubmitting={isBusy}
      />

      <Dialog
        open={importDialogOpen}
        onClose={() => {
          if (!importMutation.isPending) {
            setImportDialogOpen(false)
            setImportFile(null)
            setImportResult(null)
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>批量导入词条</DialogTitle>
        <DialogContent>
          {importResult ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              导入完成：成功 {importResult.imported} 条，跳过 {importResult.skipped} 条
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                请选择 JSON 文件（支持导出格式或纯数组格式）
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  setImportFile(file)
                }}
              />
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                fullWidth
              >
                {importFile ? importFile.name : '选择文件'}
              </Button>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {importResult ? (
            <Button
              onClick={() => {
                setImportDialogOpen(false)
                setImportFile(null)
                setImportResult(null)
              }}
            >
              关闭
            </Button>
          ) : (
            <>
              <Button
                onClick={() => {
                  setImportDialogOpen(false)
                  setImportFile(null)
                  setImportResult(null)
                }}
                disabled={importMutation.isPending}
              >
                取消
              </Button>
              <Button
                variant="contained"
                disabled={!importFile || importMutation.isPending}
                onClick={() => {
                  if (importFile) importMutation.mutate(importFile)
                }}
              >
                {importMutation.isPending ? '导入中…' : '确认导入'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
      />
    </Container>
  )
}
