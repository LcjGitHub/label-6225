import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'
import type { Entry, EntryPayload } from '../types'

interface EntryFormDialogProps {
  open: boolean
  langA: string
  langB: string
  initial?: Entry | null
  onClose: () => void
  onSubmit: (payload: EntryPayload) => void
  isSubmitting?: boolean
}

const emptyForm: EntryPayload = {
  word_a: '',
  word_b: '',
  meaning: '',
  pitfall: '',
}

/**
 * 词条新增/编辑对话框
 */
export function EntryFormDialog({
  open,
  langA,
  langB,
  initial,
  onClose,
  onSubmit,
  isSubmitting = false,
}: EntryFormDialogProps) {
  const [form, setForm] = useState<EntryPayload>(emptyForm)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              word_a: initial.word_a,
              word_b: initial.word_b,
              meaning: initial.meaning,
              pitfall: initial.pitfall,
            }
          : emptyForm,
      )
    }
  }, [open, initial])

  const handleChange =
    (field: keyof EntryPayload) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = () => {
    onSubmit(form)
  }

  const canSubmit =
    form.word_a.trim() && form.word_b.trim() && form.meaning.trim()

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? '编辑词条' : '新增词条'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField
          label={`${langA}词`}
          value={form.word_a}
          onChange={handleChange('word_a')}
          required
          fullWidth
        />
        <TextField
          label={`${langB}词`}
          value={form.word_b}
          onChange={handleChange('word_b')}
          required
          fullWidth
        />
        <TextField
          label="含义"
          value={form.meaning}
          onChange={handleChange('meaning')}
          required
          fullWidth
          multiline
          minRows={2}
        />
        <TextField
          label="易错说明"
          value={form.pitfall}
          onChange={handleChange('pitfall')}
          fullWidth
          multiline
          minRows={2}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  )
}
