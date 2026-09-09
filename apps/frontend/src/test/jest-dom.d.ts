// Solo tipos: amplía `Assertion`/`AsymmetricMatchersContaining` de vitest con
// los matchers de jest-dom (toBeInTheDocument, toHaveTextContent, ...).
// Al ser un .d.ts nunca lo procesa Vite/esbuild como JS — se referencia desde
// setup.ts con una directiva triple-slash, no con un import en runtime, para
// no ejecutar 'dist/vitest.js' de jest-dom (ver el comentario en setup.ts:
// ese runtime resuelve el 'vitest' equivocado por el hoisting del monorepo).
import "@testing-library/jest-dom/vitest";
