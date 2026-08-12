import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  clean: true,
  dts: false,
  sourcemap: false,
  banner: { js: '#!/usr/bin/env node' },
  // `@vantra/maturity-core` is bundled in so a global `npx` run never depends on the
  // workspace layout; the interactive dependencies stay external and are
  // installed from the lockfile.
  noExternal: ['@vantra/maturity-core'],
})
