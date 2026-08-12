import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
export const CLI_ENTRY = resolve(here, '../dist/index.js')

export const KEY = {
  enter: '\r',
  down: '\u001b[B',
  up: '\u001b[A',
  space: ' ',
  ctrlC: '\u0003',
} as const

/** Strip ANSI escapes so assertions read like the text a human sees. */
export function plain(output: string): string {
  // eslint-disable-next-line no-control-regex
  return output.replace(/\u001b\[[0-9;?]*[a-zA-Z]/g, '').replace(/\r/g, '')
}

export interface DriveResult {
  stdout: string
  stderr: string
  code: number | null
}

export interface DriveOptions {
  args?: string[]
  cwd?: string
  /**
   * Called once the CLI has stopped writing, with everything printed since the
   * previous keystroke. Return the keys to send, or `null` to stop responding
   * and just wait for exit.
   */
  respond: (recent: string, all: string) => string | null
  /** Safety net so a hung prompt fails the test instead of the suite. */
  timeoutMs?: number
  /** Guards against a responder that never finishes the flow. */
  maxInteractions?: number
}

/**
 * Drive the real, built CLI through its stdin.
 *
 * We deliberately do not pre-buffer every keystroke: @clack/prompts opens and
 * closes a readline interface per prompt, so input written before a prompt is
 * listening can be dropped. Instead we wait for the output to go quiet, which
 * means the next prompt has finished rendering, and only then send a key.
 *
 * stdin is a pipe rather than a pty. Clack only calls `setRawMode` when
 * `isTTY` is set, so the prompts still function; what we lose is cursor
 * redrawing, which is exactly the part we do not want to assert on.
 */
export function driveCli(options: DriveOptions): Promise<DriveResult> {
  // A healthy run answers 24 prompts in a couple of seconds. If we are past
  // 20s something is stuck, and failing fast beats a suite that hangs.
  const { args = [], cwd, respond, timeoutMs = 20_000, maxInteractions = 200 } = options

  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [CLI_ENTRY, ...args], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    })

    let stdout = ''
    let stderr = ''
    let sinceLastKey = ''
    let interactions = 0
    let quietTimer: NodeJS.Timeout | undefined
    let finished = false

    const hardStop = setTimeout(() => {
      finished = true
      child.kill('SIGKILL')
      reject(new Error(`CLI did not exit within ${timeoutMs}ms. Output so far:\n${plain(stdout)}`))
    }, timeoutMs)

    const sendNext = () => {
      if (finished || child.stdin.destroyed || !child.stdin.writable) return
      if (interactions >= maxInteractions) {
        finished = true
        child.kill('SIGKILL')
        reject(new Error(`Responder exceeded ${maxInteractions} interactions.`))
        return
      }
      const keys = respond(sinceLastKey, stdout)
      sinceLastKey = ''
      if (keys === null) return
      interactions += 1
      // The process may have exited between the timer firing and this write.
      child.stdin.write(keys, () => undefined)
    }

    const scheduleSend = () => {
      if (quietTimer) clearTimeout(quietTimer)
      quietTimer = setTimeout(sendNext, 80)
    }

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
      sinceLastKey += chunk.toString()
      scheduleSend()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
      scheduleSend()
    })

    child.stdin.on('error', () => undefined)

    child.on('error', (error) => {
      finished = true
      clearTimeout(hardStop)
      if (quietTimer) clearTimeout(quietTimer)
      reject(error)
    })

    child.on('close', (code) => {
      finished = true
      clearTimeout(hardStop)
      if (quietTimer) clearTimeout(quietTimer)
      resolvePromise({ stdout: plain(stdout), stderr: plain(stderr), code })
    })
  })
}

/** Answers every prompt by accepting the highlighted option. */
export const acceptDefaults = () => KEY.enter

/** Moves down `steps` times before accepting, i.e. picks option `steps + 1`. */
export function chooseOption(steps: number): string {
  return KEY.down.repeat(steps) + KEY.enter
}
