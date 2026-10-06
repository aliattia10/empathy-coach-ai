import "@testing-library/jest-dom";

// Vitest loads modules that construct the Supabase client at import time.
if (!import.meta.env.VITE_SUPABASE_URL) {
  // @ts-expect-error vitest env stub
  import.meta.env.VITE_SUPABASE_URL = "https://example.supabase.co";
}
if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  // @ts-expect-error vitest env stub
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = "test-anon-key";
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
