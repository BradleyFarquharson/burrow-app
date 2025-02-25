# Burrow Style Guide

## Border Radius Standardization

All components in the Burrow application should use standardized border radius values to maintain consistent styling. The border radius values are defined in the CSS variables system and exposed through Tailwind classes.

### CSS Variables

The border radius variables are defined in `src/app/globals.css`:

```css
:root {
  /* ... other variables ... */
  
  /* Border radius - single source of truth */
  --radius: 0.5rem;
  --radius-full: 9999px;
}
```

### Tailwind Classes

The border radius values are exposed through Tailwind classes in `tailwind.config.ts`:

```js
borderRadius: {
  lg: 'var(--radius)',
  md: 'calc(var(--radius) - 2px)',
  sm: 'calc(var(--radius) - 4px)',
  full: 'var(--radius-full)'
}
```

### Usage Guidelines

When adding border radius to components, always use the Tailwind classes instead of hardcoded values:

✅ **Correct:**
```jsx
<div className="rounded-lg">...</div>
<button className="rounded-md">...</button>
<span className="rounded-sm">...</span>
<div className="rounded-full">...</div>
```

❌ **Incorrect:**
```jsx
<div style={{ borderRadius: '8px' }}>...</div>
<button className="rounded-[0.5rem]">...</button>
<div style={{ borderTopLeftRadius: '4px' }}>...</div>
```

### Component Border Radius Standards

To ensure consistency across the application, follow these standards:

| Component Type | Border Radius Class | Examples |
|----------------|---------------------|----------|
| Cards, containers | `rounded-lg` | Card components, panels, modals |
| Buttons, inputs | `rounded-md` | Form controls, action buttons |
| Small UI elements | `rounded-sm` | Tags, badges, chips |
| Circular elements | `rounded-full` | Avatars, icons, spinners |

### Migration Guide for Existing Components

When updating existing components to use standardized border radius:

1. Replace hardcoded values (e.g., `rounded-[8px]`) with the appropriate Tailwind class
2. For elements inheriting border radius, use `rounded-[inherit]` only when necessary
3. For UI components, refer to the table above for appropriate radius class
4. Special cases:
   - Loading spinners: always use `rounded-full`
   - Cards and panels: use `rounded-lg` (or `rounded-xl` for featured cards)
   - Form inputs: use `rounded-md`

### Common Components

- Regular cards and containers: `rounded-lg`
- Buttons and form elements: `rounded-md`
- Small badges and tags: `rounded-sm`
- Circular elements (avatars, icons): `rounded-full`

### Customizing Border Radius

If you need to change the border radius application-wide, simply update the `--radius` variable in `src/app/globals.css`. All components using the Tailwind classes will automatically update.

## Color Theme

The application uses a monochrome color scheme with:
- Dark Mode: A pure grayscale palette
- Light Mode: A warm, creamy palette that's easy on the eyes

All colors are defined as CSS variables and exposed through Tailwind, allowing for consistent styling and easy theme switching. 