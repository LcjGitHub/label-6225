/** 语言对 */
export interface LanguagePair {
  id: number
  lang_a: string
  lang_b: string
  label: string
  entry_count?: number
}

/** 创建/更新语言对请求体 */
export interface PairPayload {
  lang_a: string
  lang_b: string
  label: string
}

/** 假朋友词条 */
export interface Entry {
  id: number
  pair_id: number
  word_a: string
  word_b: string
  meaning: string
  pitfall: string
}

/** 创建/更新词条请求体 */
export interface EntryPayload {
  word_a: string
  word_b: string
  meaning: string
  pitfall: string
}
