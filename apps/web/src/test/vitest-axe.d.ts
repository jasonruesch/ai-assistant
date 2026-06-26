import type { AxeMatchers } from 'vitest-axe/matchers';

// Make `toHaveNoViolations()` available on Vitest's `expect` types.
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
