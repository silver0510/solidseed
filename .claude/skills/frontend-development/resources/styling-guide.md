# Styling Guide

Modern styling patterns using Tailwind CSS utility classes and shadcn/ui components.

---

## Tailwind CSS Fundamentals

### Utility-First Approach

Style elements directly in JSX using utility classes:

```tsx
<div className="p-4 bg-white rounded-lg shadow-md">
    <h2 className="text-xl font-semibold text-gray-900">Title</h2>
    <p className="mt-2 text-gray-600">Description text</p>
</div>
```

**Key Benefits:**
- No context switching between CSS and JSX
- Consistent design tokens (spacing, colors, typography)
- Automatic dead code elimination
- Zero runtime overhead

### The cn() Helper

Use the `cn()` utility for conditional class merging:

```typescript
import { cn } from '@/lib/utils';

// Conditional classes
<div className={cn(
    'p-4 rounded-lg',
    isActive && 'bg-blue-500 text-white',
    isDisabled && 'opacity-50 cursor-not-allowed'
)}>
    Content
</div>

// Merge with component defaults
<Button className={cn('w-full', className)}>Click me</Button>
```

---

## Layout Patterns

### Flexbox

```tsx
// Row layout with gap
<div className="flex items-center gap-4">
    <Avatar />
    <div>Content</div>
</div>

// Column layout
<div className="flex flex-col gap-2">
    <Label>Email</Label>
    <Input />
</div>

// Space between
<div className="flex justify-between items-center">
    <h2>Title</h2>
    <Button>Action</Button>
</div>
```

### Grid

```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card>Item 1</Card>
    <Card>Item 2</Card>
    <Card>Item 3</Card>
</div>

// Fixed columns
<div className="grid grid-cols-12 gap-4">
    <div className="col-span-8">Main content</div>
    <div className="col-span-4">Sidebar</div>
</div>
```

### Container

```tsx
// Centered content with max-width
<div className="container mx-auto px-4">
    <div className="max-w-4xl mx-auto">
        Content
    </div>
</div>
```

---

## Spacing

### Padding & Margin

```tsx
// Padding
<div className="p-4">All sides 1rem</div>
<div className="px-6">Horizontal 1.5rem</div>
<div className="py-3">Vertical 0.75rem</div>
<div className="pt-8 pr-4 pb-2 pl-6">Individual sides</div>

// Margin
<div className="m-4">All sides</div>
<div className="mx-auto">Center horizontally</div>
<div className="mt-8">Top margin</div>
<div className="-mt-4">Negative margin</div>

// Gap (in flex/grid)
<div className="flex gap-4">Items with gap</div>
<div className="flex gap-x-6 gap-y-2">Different x/y gaps</div>
```

### Spacing Scale

| Class | Value |
|-------|-------|
| `0` | 0px |
| `1` | 0.25rem (4px) |
| `2` | 0.5rem (8px) |
| `4` | 1rem (16px) |
| `6` | 1.5rem (24px) |
| `8` | 2rem (32px) |
| `12` | 3rem (48px) |

---

## Typography

```tsx
// Font sizes
<p className="text-sm">Small (14px)</p>
<p className="text-base">Base (16px)</p>
<p className="text-lg">Large (18px)</p>
<p className="text-xl">Extra large (20px)</p>
<p className="text-2xl">2XL (24px)</p>

// Font weight
<p className="font-normal">Normal (400)</p>
<p className="font-medium">Medium (500)</p>
<p className="font-semibold">Semibold (600)</p>
<p className="font-bold">Bold (700)</p>

// Text alignment
<p className="text-left">Left</p>
<p className="text-center">Center</p>
<p className="text-right">Right</p>

// Text color
<p className="text-gray-900">Dark text</p>
<p className="text-gray-600">Muted text</p>
<p className="text-muted-foreground">shadcn muted</p>
```

---

## Colors

### shadcn/ui Color System

shadcn/ui uses CSS variables mapped to semantic names:

```tsx
// Background
<div className="bg-background">Default background</div>
<div className="bg-muted">Muted background</div>
<div className="bg-card">Card background</div>

// Text
<p className="text-foreground">Default text</p>
<p className="text-muted-foreground">Muted text</p>

// Primary colors
<button className="bg-primary text-primary-foreground">Primary</button>

// Destructive (errors)
<button className="bg-destructive text-destructive-foreground">Delete</button>
```

### Custom Colors

```tsx
// Direct Tailwind colors
<div className="bg-blue-500 text-white">Blue</div>
<div className="bg-green-600">Green</div>
<div className="bg-red-500">Red</div>

// Opacity modifier
<div className="bg-black/75">75% opacity black</div>
<div className="text-blue-500/50">50% opacity text</div>
```

---

## Borders & Shadows

```tsx
// Border
<div className="border">1px border</div>
<div className="border-2">2px border</div>
<div className="border border-gray-300">Colored border</div>
<div className="border-t border-b">Top and bottom only</div>

// Border radius
<div className="rounded">Small radius</div>
<div className="rounded-md">Medium radius</div>
<div className="rounded-lg">Large radius</div>
<div className="rounded-full">Full circle</div>

// Shadows
<div className="shadow-sm">Small shadow</div>
<div className="shadow">Default shadow</div>
<div className="shadow-md">Medium shadow</div>
<div className="shadow-lg">Large shadow</div>
```

---

## Responsive Design

### Mobile-First Breakpoints

Tailwind uses mobile-first responsive design. Base styles apply to all screens, breakpoint prefixes apply at that size and up:

```tsx
// Text size: base on mobile, larger on desktop
<h1 className="text-2xl md:text-4xl lg:text-6xl">
    Responsive heading
</h1>

// Layout: stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">
    <div>Left</div>
    <div>Right</div>
</div>

// Grid: 1 col -> 2 col -> 3 col
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card>1</Card>
    <Card>2</Card>
    <Card>3</Card>
</div>
```

### Breakpoint Reference

| Prefix | Min Width |
|--------|-----------|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |
| `2xl:` | 1536px |

### Hide/Show at Breakpoints

```tsx
// Hide on mobile, show on desktop
<div className="hidden lg:block">Desktop only</div>

// Show on mobile, hide on desktop
<div className="block lg:hidden">Mobile only</div>
```

---

## Dark Mode

### Using shadcn/ui Theme

shadcn/ui handles dark mode with CSS variables:

```tsx
// Automatic theme-aware colors
<div className="bg-background text-foreground">
    Automatically adapts to light/dark mode
</div>

// Manual dark: variants
<div className="bg-white dark:bg-gray-900">
    Explicit dark mode override
</div>
```

### Theme Toggle

```tsx
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
```

---

## Component Styling

### Customizing shadcn/ui Components

Components in `components/ui/` can be modified directly:

```tsx
// components/ui/button.tsx
const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground',
                destructive: 'bg-destructive text-destructive-foreground',
                outline: 'border border-input bg-background',
                // Add custom variant
                gradient: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
            },
        },
    }
);
```

### Override with className

```tsx
// Add custom styles to shadcn components
<Card className="border-2 border-purple-500 shadow-xl">
    Custom styled card
</Card>

<Button className="w-full py-6">
    Full width, taller button
</Button>
```

---

## Common Patterns

### Card Layout

```tsx
<Card>
    <CardHeader>
        <CardTitle className="text-2xl">Dashboard</CardTitle>
        <CardDescription>View your metrics</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
        <p className="text-muted-foreground">Content here</p>
    </CardContent>
    <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
    </CardFooter>
</Card>
```

### Form Layout

```tsx
<form className="space-y-6">
    <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
    </div>

    <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" />
    </div>

    <Button type="submit" className="w-full">Sign In</Button>
</form>
```

### Dashboard Grid

```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-2xl font-bold">$45,231.89</p>
            <p className="text-xs text-muted-foreground">
                +20.1% from last month
            </p>
        </CardContent>
    </Card>
    {/* More cards */}
</div>
```

---

## What NOT to Use

### Avoid Inline Style Objects

```tsx
// ❌ AVOID - Inline style objects
<div style={{ padding: '16px', backgroundColor: 'white' }}>

// ✅ PREFERRED - Tailwind classes
<div className="p-4 bg-white">
```

### Avoid CSS Modules for Components

```tsx
// ❌ AVOID - CSS modules
import styles from './Component.module.css';
<div className={styles.container}>

// ✅ PREFERRED - Tailwind + cn()
<div className={cn('p-4 rounded-lg', className)}>
```

---

## Best Practices

1. **Use Tailwind utilities** directly in JSX
2. **Use cn()** for conditional styling
3. **Use shadcn/ui components** for common patterns
4. **Mobile-first** responsive design
5. **Semantic color names** (bg-background, not bg-white)
6. **Consistent spacing** using Tailwind scale
7. **Test dark mode** for all components

---

## See Also

- [component-patterns.md](component-patterns.md) - Component structure
- [complete-examples.md](complete-examples.md) - Full examples
- `references/tailwind-utilities.md` - Complete utility reference
- `references/tailwind-responsive.md` - Responsive patterns
- `references/shadcn-components.md` - Component catalog
