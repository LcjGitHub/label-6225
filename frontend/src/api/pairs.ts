import { apiClient } from './client'
import type { Entry, EntryPayload, EntryQueryParams, ImportResult, LanguagePair, PairPayload, StatsSummary } from '../types'

/** 获取全部语言对 */
export async function fetchPairs(): Promise<LanguagePair[]> {
  const { data } = await apiClient.get<LanguagePair[]>('/pairs')
  return data
}

/** 获取单个语言对 */
export async function fetchPair(id: number): Promise<LanguagePair> {
  const { data } = await apiClient.get<LanguagePair>(`/pairs/${id}`)
  return data
}

/** 创建语言对 */
export async function createPair(
  payload: PairPayload,
): Promise<LanguagePair> {
  const { data } = await apiClient.post<LanguagePair>('/pairs', payload)
  return data
}

/** 更新语言对 */
export async function updatePair(
  pairId: number,
  payload: PairPayload,
): Promise<LanguagePair> {
  const { data } = await apiClient.put<LanguagePair>(
    `/pairs/${pairId}`,
    payload,
  )
  return data
}

/** 删除语言对 */
export async function deletePair(pairId: number): Promise<void> {
  await apiClient.delete(`/pairs/${pairId}`)
}

/** 从指定语言对中随机抽取一条词条 */
export async function fetchRandomEntry(pairId: number): Promise<Entry> {
  const { data } = await apiClient.get<Entry>(
    `/pairs/${pairId}/entries/random`,
  )
  return data
}

/** 获取语言对下的词条列表，支持关键词搜索 */
export async function fetchEntries(
  pairId: number,
  params?: EntryQueryParams,
): Promise<Entry[]> {
  const { data } = await apiClient.get<Entry[]>(`/pairs/${pairId}/entries`, {
    params,
  })
  return data
}

/** 新增词条 */
export async function createEntry(
  pairId: number,
  payload: EntryPayload,
): Promise<Entry> {
  const { data } = await apiClient.post<Entry>(
    `/pairs/${pairId}/entries`,
    payload,
  )
  return data
}

/** 更新词条 */
export async function updateEntry(
  entryId: number,
  payload: EntryPayload,
): Promise<Entry> {
  const { data } = await apiClient.put<Entry>(`/entries/${entryId}`, payload)
  return data
}

/** 删除词条 */
export async function deleteEntry(entryId: number): Promise<void> {
  await apiClient.delete(`/entries/${entryId}`)
}

/** 导出指定语言对下全部词条为 JSON 文件 */
export async function exportEntries(pairId: number): Promise<void> {
  const response = await apiClient.get(`/pairs/${pairId}/entries/export`, {
    responseType: 'blob',
  })
  const disposition = response.headers?.['content-disposition'] ?? ''
  const match = disposition.match(/filename="?([^";\n]+)"?/)
  const filename = match ? match[1] : 'entries.json'
  const url = URL.createObjectURL(response.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** 从文件批量导入词条 */
export async function importEntries(
  pairId: number,
  file: File,
): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post<ImportResult>(
    `/pairs/${pairId}/entries/import`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

/** 获取数据统计概览 */
export async function fetchStatsSummary(): Promise<StatsSummary> {
  const { data } = await apiClient.get<StatsSummary>('/stats/summary')
  return data
}
