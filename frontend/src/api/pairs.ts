import { apiClient } from './client'
import type { Entry, EntryPayload, LanguagePair, PairPayload } from '../types'

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

/** 获取语言对下的词条列表，支持关键词搜索 */
export async function fetchEntries(
  pairId: number,
  keyword?: string,
): Promise<Entry[]> {
  const params = keyword ? { keyword } : undefined
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
