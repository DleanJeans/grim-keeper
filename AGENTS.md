## Navigation header convention

The root stack uses the custom `CompactHeader` in `app/_layout.tsx`. Keep the left and right header
sides balanced with an empty `headerSide` placeholder whenever only one side has controls; this
keeps titles centered on back-only and action-only screens. Native `headerTitleAlign` does not
replace this balancing in the custom header.
