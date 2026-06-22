import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'
import type { LanguagePair, PairPayload } from '../types'

interface PairFormDialogProps {
  open: boolean
  initial?: LanguagePair | null
  onClose: () => void
  onSubmit: (payload: PairPayload) => void
  isSubmitting?: boolean
}

const emptyForm: PairPayload = {
  lang_a: '',
  lang_b: '',
  label: '',
}

/**
 * 语言对新增/编辑对话框
 */
export function PairFormDialog({
  open,
  initial,
  onClose,
  onSubmit,
  isSubmitting = false,
}: PairFormDialogProps) {
  const [form, setForm] = useState<PairPayload>(emptyForm)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              lang_a: initial.lang_a,
              lang_b: initial.lang_b,
              label: initial.label,
            }
          : emptyForm,
      )
    }
  }, [open, initial])

  const handleChange =
    (field: keyof PairPayload) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = () => {
    onSubmit(form)
  }

  const canSubmit =
    form.lang_a.trim() && form.lang_b.trim() && form.label.trim()

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? '编辑语言对' : '新增语言对'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField
          label="语言甲名称"
          value={form.lang_a}
          onChange={handleChange('lang_a')}
          required
          fullWidth
        />
        <TextField
          label="语言乙名称"
          value={form.lang_b}
          onChange={handleChange('lang_b')}
          required
          fullWidth
        />
        <TextField
          label="展示标题"
          value={form.label}
          onChange={handleChange('label')}
          required
          fullWidth
          placeholder="例如：德语 ↔ 英语"
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
