// Shared control classes — token-styled, 44px tap target, branded focus, red-free.
export const controlClass =
  'min-h-tap w-full rounded-lg border bg-transparent px-4 py-2.5 text-base text-gray-900 ' +
  'placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 ' +
  'dark:text-white/90 dark:placeholder:text-white/30'
export function borderClass(invalid: boolean): string {
  return invalid
    ? 'border-danger-400 focus:border-danger-400 dark:border-danger-700'
    : 'border-gray-300 focus:border-brand-300 dark:border-gray-700'
}
