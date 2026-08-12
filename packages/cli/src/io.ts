import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { sanitiseAnswers, type AnswerSet, type Catalog } from '@vantra/maturity-core'

export async function writeTextFile(path: string, contents: string): Promise<string> {
  const absolute = resolve(process.cwd(), path)
  await mkdir(dirname(absolute), { recursive: true })
  await writeFile(absolute, contents, 'utf-8')
  return absolute
}

/**
 * Read answers back from a previous JSON export. [PM] This is the whole
 * "compare over time" story: no server, two files, one diff.
 */
export async function readAnswersFile(catalog: Catalog, path: string): Promise<AnswerSet> {
  const absolute = resolve(process.cwd(), path)
  let parsed: unknown
  try {
    parsed = JSON.parse(await readFile(absolute, 'utf-8'))
  } catch (error) {
    throw new Error(`Could not read ${absolute}: ${(error as Error).message}`)
  }
  const answers =
    parsed && typeof parsed === 'object' && 'answers' in parsed
      ? ((parsed as { answers: AnswerSet }).answers ?? {})
      : (parsed as AnswerSet)
  return sanitiseAnswers(catalog, answers ?? {})
}

export function timestampedName(extension: string): string {
  const stamp = new Date().toISOString().slice(0, 10)
  return `vantra-maturity-${stamp}.${extension}`
}
