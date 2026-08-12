import type { AnswerSet, Catalog } from './types.js'

/**
 * Client-side share payload.
 *
 * [Engineering] No server, no database: a result travels as base64url inside a
 * URL fragment. Free-text notes are deliberately dropped — they are the one
 * field likely to contain internal detail, and a shareable link is not a safe
 * place for it. Notes stay in the local JSON export.
 */

export const SHARE_PAYLOAD_VERSION = 1

export interface SharePayload {
  v: number
  /** catalog id */
  c: string
  /** catalog version */
  cv: string
  /** questionId -> optionId */
  a: Record<string, string>
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  const base64 =
    typeof btoa === 'function' ? btoa(binary) : Buffer.from(input, 'utf-8').toString('base64')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  if (typeof atob === 'function') {
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  }
  return Buffer.from(padded, 'base64').toString('utf-8')
}

export function encodeAnswers(catalog: Catalog, answers: AnswerSet): string {
  const compact: Record<string, string> = {}
  for (const [questionId, answer] of Object.entries(answers)) {
    if (answer?.optionId) compact[questionId] = answer.optionId
  }
  const payload: SharePayload = {
    v: SHARE_PAYLOAD_VERSION,
    c: catalog.id,
    cv: catalog.version,
    a: compact,
  }
  return toBase64Url(JSON.stringify(payload))
}

export interface DecodeResult {
  answers: AnswerSet
  /** Answers referencing questions or options the catalog no longer knows. */
  dropped: string[]
  /** True when the link was produced by a different catalog version. */
  versionMismatch: boolean
}

/**
 * Never throws on user input: a corrupt link degrades to "no answers restored".
 */
export function decodeAnswers(catalog: Catalog, encoded: string): DecodeResult | null {
  let payload: SharePayload
  try {
    payload = JSON.parse(fromBase64Url(encoded)) as SharePayload
  } catch {
    return null
  }
  if (!payload || payload.v !== SHARE_PAYLOAD_VERSION || payload.c !== catalog.id) return null
  if (typeof payload.a !== 'object' || payload.a === null) return null

  const answers: AnswerSet = {}
  const dropped: string[] = []
  const questions = catalog.categories.flatMap((category) => category.questions)

  for (const [questionId, optionId] of Object.entries(payload.a)) {
    const question = questions.find((candidate) => candidate.id === questionId)
    const option = question?.options.find((candidate) => candidate.id === optionId)
    if (!question || !option) {
      dropped.push(questionId)
      continue
    }
    answers[questionId] = { questionId, optionId }
  }

  return { answers, dropped, versionMismatch: payload.cv !== catalog.version }
}
