## File structure

Each component lives in its own file. The default layout is, top to bottom:

1. Imports (organized by `pnpm format:imports`)
2. Module-level constants (numbers, lookup tables)
3. Type/prop declarations
4. The exported main component
5. Stateless subcomponents and helper functions below the main component
6. `const styles = StyleSheet.create({ ... })` at the bottom

Rules:

- **1 exported component per file.** Stateless subcomponents used only by the main component
  may live in the same file, below `styles`. Anything with its own state, effects, or context
  consumers goes in its own file.
- **All styles go in `StyleSheet.create({...})`.** No inline `style={{...}}` objects on JSX
  elements, and no module-level `const someStyle = {...}` plain-object style constants. If a
  style needs to be passed to a function-based `style` callback, build the object inside
  `StyleSheet.create()` and spread/merge it there. Variants (e.g. pressed, disabled) belong in
  the same `StyleSheet.create()` block as their base style.
- **Run formatters before committing:**
  - `pnpm format:changed` — formats all changed files
  - `pnpm format:imports <file>...` — runs biome's `organizeImports` on the listed files
    (pass each changed file explicitly; it does not infer them)
- **Type exports stay co-located with their component.** A `*Props` type lives in the same file
  as the component that uses it. Promote to a shared types file only when a second component
  imports it.
- Move colors to theme/colors.ts
- Refactor into a component if it's a nested component inside .map()

## Navigation header convention

- The root stack uses the custom `GameHeader` in `app/_layout.tsx`. Keep the left and right header
  sides balanced with an empty `headerSide` placeholder whenever only one side has controls; this
  keeps titles centered on back-only and action-only screens. Native `headerTitleAlign` does not
  replace this balancing in the custom header.
- Simple screens (index, friends, scripts, scripts/[id], role-notes, create) override the
  stack's `header` option with `TitleHeader` to render a big centered title. Pass `icon` for a
  leading image and `right` for a right-aligned action button. The big centered title replaces
  the default 15-17pt header text on those screens.
