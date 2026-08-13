import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { acceptDefaults, chooseOption, CLI_ENTRY, driveCli, KEY } from './drive.js'

/**
 * End-to-end coverage of the interactive path.
 *
 * The unit tests in `@vantra-design/maturity-core` prove the scoring; these tests
 * prove that a human pressing keys reaches that scoring at all — the prompts
 * appear in order, answers are recorded against the right questions, notes are
 * captured, cancelling writes nothing, and the exports land on disk.
 */

let workdir: string

beforeAll(async () => {
  if (!existsSync(CLI_ENTRY)) {
    throw new Error(`Build the CLI before running e2e tests: expected ${CLI_ENTRY}`)
  }
  workdir = await mkdtemp(join(tmpdir(), 'vantra-maturity-e2e-'))
})

afterAll(async () => {
  if (workdir) await rm(workdir, { recursive: true, force: true })
})

describe('interactive run', () => {
  it('walks all 24 questions and scores the first option as level 1', async () => {
    const result = await driveCli({
      args: ['--lang', 'en', '--no-notes'],
      cwd: workdir,
      respond: acceptDefaults,
    })

    expect(result.code).toBe(0)
    // Every dimension is introduced before its questions.
    expect(result.stdout).toContain('Dimension: Documentation')
    expect(result.stdout).toContain('Dimension: Versioning')
    expect(result.stdout).toContain('Dimension: Governance')
    expect(result.stdout).toContain('Dimension: Adoption')
    // The counter reaches the last question, so no prompt was skipped.
    expect(result.stdout).toContain('Question 1/24')
    expect(result.stdout).toContain('Question 24/24')
    // The first option of every question scores 1.
    expect(result.stdout).toContain('1.00 / 5.00')
    expect(result.stdout).toContain('Level 1')
    expect(result.stdout).toContain('Next steps')
  })

  it('records the selected option, not just the default', async () => {
    // Four downs from the top selects the fifth option, which scores 5.
    const result = await driveCli({
      args: ['--lang', 'en', '--no-notes'],
      cwd: workdir,
      respond: (recent) => (/Question \d+\/24/.test(recent) ? chooseOption(4) : KEY.enter),
    })

    expect(result.code).toBe(0)
    expect(result.stdout).toContain('5.00 / 5.00')
    expect(result.stdout).toContain('Level 5')
  })

  it('writes the exports it was asked for', async () => {
    const jsonPath = join(workdir, 'result.json')
    const markdownPath = join(workdir, 'report.md')

    const result = await driveCli({
      args: ['--lang', 'en', '--no-notes', '--json', jsonPath, '--markdown', markdownPath],
      cwd: workdir,
      respond: acceptDefaults,
    })

    expect(result.code).toBe(0)

    const exported = JSON.parse(await readFile(jsonPath, 'utf-8'))
    expect(exported.tool).toBe('vantra-maturity-check')
    expect(Object.keys(exported.answers)).toHaveLength(24)
    expect(exported.result.overall.score).toBe(1)
    expect(exported.result.overall.answered).toBe(24)

    const markdown = await readFile(markdownPath, 'utf-8')
    expect(markdown).toContain('# Maturity report')
    expect(markdown).toContain('1.00 / 5.00')
  })

  it('captures a free-text note against the question that asked for it', async () => {
    const jsonPath = join(workdir, 'noted.json')
    const NOTE = 'Two designers, one engineer, 20% time'

    const result = await driveCli({
      args: ['--lang', 'en', '--json', jsonPath],
      cwd: workdir,
      respond: (recent) => (/Add a note\?/.test(recent) ? `${NOTE}${KEY.enter}` : KEY.enter),
    })

    expect(result.code).toBe(0)

    const exported = JSON.parse(await readFile(jsonPath, 'utf-8'))
    const noted = Object.values(exported.answers as Record<string, { note?: string }>).filter(
      (answer) => answer.note === NOTE,
    )
    expect(noted.length).toBeGreaterThan(0)
  })

  it('shows the running score when asked between dimensions', async () => {
    const result = await driveCli({
      args: ['--lang', 'en', '--no-notes'],
      cwd: workdir,
      // `y` confirms the "show the score so far" prompt.
      respond: (recent) => (/Show the score so far\?/.test(recent) ? `y${KEY.enter}` : KEY.enter),
    })

    expect(result.code).toBe(0)
    expect(result.stdout).toContain('Score so far')
  })

  it('answers in German when asked to', async () => {
    const result = await driveCli({
      args: ['--lang', 'de', '--no-notes'],
      cwd: workdir,
      respond: acceptDefaults,
    })

    expect(result.code).toBe(0)
    expect(result.stdout).toContain('Frage 1/24')
    expect(result.stdout).toContain('Nächste Schritte')
    // German uses a decimal comma on both sides of the score.
    expect(result.stdout).toContain('1,00 / 5,00')
  })
})

describe('cancelling', () => {
  it('exits with 130 and writes nothing', async () => {
    const jsonPath = join(workdir, 'cancelled.json')
    let sent = false

    const result = await driveCli({
      args: ['--lang', 'en', '--no-notes', '--json', jsonPath],
      cwd: workdir,
      respond: () => {
        if (sent) return null
        sent = true
        return KEY.ctrlC
      },
    })

    expect(result.code).toBe(130)
    expect(result.stdout).toContain('Stopped')
    expect(existsSync(jsonPath)).toBe(false)
  })
})

describe('resuming', () => {
  it('restores answers from a previous export', async () => {
    const first = join(workdir, 'first.json')
    await driveCli({
      args: ['--lang', 'en', '--no-notes', '--json', first],
      cwd: workdir,
      respond: (recent) => (/Question \d+\/24/.test(recent) ? chooseOption(4) : KEY.enter),
    })

    const second = join(workdir, 'second.json')
    const result = await driveCli({
      args: ['--lang', 'en', '--no-notes', '--from', first, '--json', second],
      cwd: workdir,
      respond: acceptDefaults,
    })

    expect(result.code).toBe(0)
    expect(result.stdout).toContain('Restored answers from')

    // Accepting every prompt keeps the restored selection, so the score holds.
    const exported = JSON.parse(await readFile(second, 'utf-8'))
    expect(exported.result.overall.score).toBe(5)
  })
})
