import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Each e2e case spawns the built CLI and walks 24 prompts, waiting for the
    // output to settle between keystrokes. Generous per-test time, and no
    // parallelism, because these tests are I/O bound rather than CPU bound.
    // The driver's own 20s guard should fire first and report the transcript;
    // this is only a backstop so a wedged case cannot stall the suite.
    testTimeout: 60_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
})
