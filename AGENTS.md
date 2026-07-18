- 1 component per file
- Move styles to StyleSheet.create() under the component
- Move helper functions under the styles
- Run "pnpm format:changed" and "pnpm format:imports {changedFiles}" to organize imports

## Navigation header convention

- The root stack uses the custom `GameHeader` in `app/_layout.tsx`. Keep the left and right header
  sides balanced with an empty `headerSide` placeholder whenever only one side has controls; this
  keeps titles centered on back-only and action-only screens. Native `headerTitleAlign` does not
  replace this balancing in the custom header.
- Simple screens (index, friends, scripts, scripts/[id], role-notes, create) override the
  stack's `header` option with `TitleHeader` to render a big centered title. Pass `icon` for a
  leading image and `right` for a right-aligned action button. The big centered title replaces
  the default 15-17pt header text on those screens.
