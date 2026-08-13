import * as p from '@clack/prompts'
import pc from 'picocolors'
import { Command, Option } from 'commander'
import {
  DEFAULT_CATALOG_ID,
  getCatalog,
  isLocale,
  renderMarkdownReport,
  resolveLocale,
  scoreAssessment,
  toJsonExport,
  type AnswerSet,
  type Locale,
} from '@vantra-design/maturity-core'
import { runInteractive } from './interactive.js'
import { renderTerminalReport } from './render.js'
import { readAnswersFile, timestampedName, writeTextFile } from './io.js'
import { m } from './messages.js'

const VERSION = '0.1.0'

// `vmc catalog | head` closes the pipe early; without this the process dies
// with an unhandled EPIPE instead of exiting quietly like every other CLI.
process.stdout.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EPIPE') process.exit(0)
  throw error
})

interface CommonOptions {
  lang?: string
  catalog: string
  markdown?: string
  json?: string
  from?: string
  notes: boolean
}

function detectLocale(flag: string | undefined): Locale {
  if (isLocale(flag)) return flag
  // Falls back to the shell locale (LANG=de_DE.UTF-8), then to English.
  return resolveLocale(flag ?? process.env.LC_ALL ?? process.env.LANG)
}

async function exportResult(
  catalog: ReturnType<typeof getCatalog>,
  answers: AnswerSet,
  locale: Locale,
  options: CommonOptions,
  interactive: boolean,
): Promise<void> {
  const result = scoreAssessment(catalog, answers)
  process.stdout.write(renderTerminalReport(catalog, result, locale))

  let markdownPath = options.markdown
  let jsonPath = options.json

  if (interactive && !markdownPath && !jsonPath) {
    const choice = await p.multiselect({
      message: m('exportPrompt', locale),
      required: false,
      options: [
        { value: 'markdown', label: m('exportMarkdown', locale) },
        { value: 'json', label: m('exportJson', locale) },
      ],
    })
    if (!p.isCancel(choice)) {
      if (choice.includes('markdown')) markdownPath = timestampedName('md')
      if (choice.includes('json')) jsonPath = timestampedName('json')
    }
  }

  if (markdownPath) {
    const written = await writeTextFile(
      markdownPath,
      renderMarkdownReport(catalog, result, { locale, answers }),
    )
    process.stdout.write(`${pc.green('✔')} ${m('written', locale)}: ${written}\n`)
  }
  if (jsonPath) {
    const written = await writeTextFile(
      jsonPath,
      `${JSON.stringify(toJsonExport(result, answers, locale, VERSION), null, 2)}\n`,
    )
    process.stdout.write(`${pc.green('✔')} ${m('written', locale)}: ${written}\n`)
  }
}

const program = new Command()

program
  // The default action and the `report` subcommand share flag names such as
  // `--from`; without positional parsing the root command swallows them.
  .enablePositionalOptions()
  .name('vantra-maturity-check')
  .description(
    'Score your design system across documentation, versioning, governance and adoption, and get prioritised next steps. Runs entirely offline.',
  )
  .version(VERSION)
  .addOption(new Option('-l, --lang <locale>', 'output language').choices(['en', 'de']))
  .option('-c, --catalog <id>', 'question catalog to use', DEFAULT_CATALOG_ID)
  .option('-m, --markdown [path]', 'write a Markdown report')
  .option('-j, --json [path]', 'write a JSON export (answers + result)')
  .option('-f, --from <path>', 'restore answers from a previous JSON export')
  .option('--no-notes', 'do not ask for free-text notes')
  .action(async (options: CommonOptions) => {
    const locale = detectLocale(options.lang)
    const catalog = getCatalog(options.catalog)

    try {
      p.intro(pc.bgCyan(pc.black(` ${m('intro', locale)} `)))
      p.log.message(m('welcome', locale))

      let initialAnswers: AnswerSet = {}
      if (options.from) {
        initialAnswers = await readAnswersFile(catalog, options.from)
        p.log.info(`${m('resumed', locale)} ${options.from}`)
      }

      const { answers, cancelled } = await runInteractive({
        catalog,
        locale,
        initialAnswers,
        askNotes: options.notes,
      })

      if (cancelled) {
        p.cancel(m('cancelled', locale))
        process.exitCode = 130
        return
      }
      if (Object.keys(answers).length === 0) {
        p.outro(m('noAnswers', locale))
        return
      }

      await exportResult(catalog, answers, locale, options, true)
      p.outro(m('outro', locale))
    } finally {
      // Release stdin once the prompts are done. `pause()` stops the reads but
      // leaves the handle referenced, so a piped stdin would keep the event
      // loop alive forever and `echo | vantra-maturity-check` would hang.
      process.stdin.pause()
      process.stdin.unref()
    }
  })

program
  .command('report')
  .description('Re-render a report from a previous JSON export, without any prompts.')
  .requiredOption('-f, --from <path>', 'path to a JSON export written by this tool')
  .addOption(new Option('-l, --lang <locale>', 'output language').choices(['en', 'de']))
  .option('-c, --catalog <id>', 'question catalog to use', DEFAULT_CATALOG_ID)
  .option('-m, --markdown [path]', 'write a Markdown report')
  .option('-j, --json [path]', 'write a JSON export (answers + result)')
  .action(async (options: CommonOptions) => {
    const locale = detectLocale(options.lang)
    const catalog = getCatalog(options.catalog)
    const answers = await readAnswersFile(catalog, options.from!)
    if (Object.keys(answers).length === 0) {
      process.stderr.write(`${m('noAnswers', locale)}\n`)
      process.exitCode = 1
      return
    }
    await exportResult(catalog, answers, locale, { ...options, notes: false }, false)
  })

program
  .command('catalog')
  .description('Print the bundled catalog as JSON (useful as a starting point for your own).')
  .option('-c, --catalog <id>', 'question catalog to print', DEFAULT_CATALOG_ID)
  .action((options: { catalog: string }) => {
    process.stdout.write(`${JSON.stringify(getCatalog(options.catalog), null, 2)}\n`)
  })

program.parseAsync(process.argv).catch((error: unknown) => {
  process.stderr.write(`${pc.red('✖')} ${(error as Error).message}\n`)
  process.exitCode = 1
})
