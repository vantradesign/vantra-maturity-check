import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  // The catalog JSON is inlined into the bundle on purpose: the engine has to
  // work in a browser (static web app) and offline (CLI), so nothing may be
  // read from disk or fetched at runtime.
  treeshake: true,
})
