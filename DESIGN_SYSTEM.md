# UI/UX Design System - Mosca Branca Parts

## Design System Source

Generated using UI/UX Pro Max Skill for **automotive spare parts e-commerce** with keywords: `automotive`, `spare parts`, `ecommerce`, `professional`, `trusted`.

## Identity

**Project:** Mosca Branca Parts
**Type:** E-commerce (Automotive Spare Parts)
**Industry:** Automotive / Auto Parts Retail
**Personality:** Professional, Trusted, Premium

---

## Core Design System

### Pattern
- **Hero-Centric + Feature-Rich**
- CTA positioned above the fold
- Sections: Hero → Features → CTA

### Style
- **Motion-Driven**
  - Animation-heavy with micro-interactions
  - Smooth transitions (150-300ms)
  - Scroll effects & parallax (3-5 layers)
  - Entrance animations
  - ⚠ Performance: Good
  - ⚠ Accessibility: Must respect `prefers-reduced-motion`

### Colors

| Role | Color | Tailwind | Notes |
|------|-------|---------|-------|
| Primary Dark | `#1E293B` | `slate-800` | Backgrounds, dark text |
| Secondary | `#334155` | `slate-700` | Borders, muted elements |
| CTA / Action | `#DC2626` | `red-600` | Primary buttons, links |
| Background Light | `#F8FAFC` | `slate-50` | Page backgrounds |
| Text Primary | `#0F172A` | `slate-900` | Body text, headings |
| Text Secondary | `#475569` | `slate-600` | Muted text, descriptions |
| Text Muted | `#94A3B8` | `slate-400` | Placeholder, meta info |
| Border Light | `#E2E8F0` | `slate-200` | Cards, input borders |
| Error | `#DC2626` | `red-600` | Errors, destructive actions |
| Success | `#16A34A` | `green-600` | Success states, in stock |
| Warning | `#F59E0B` | `amber-500` | Warnings, limited stock |

### Typography

#### Font Stack
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syncopate:wght@400;700&display=swap');
```

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Body / UI | **Inter** | 400, 500, 600 | General UI text |
| Prices / Numbers | **Barlow** | 700, 900 | Product prices, quantities |
| Headings | **Syncopate** | 700 | Display headings |
| Technical | **Space Mono** | 400, 700 | Codes, specs, rare labels |

#### Typography Guidelines
- Line height: 1.5-1.75 for body text
- Line length: 65-75 characters max
- Minimum size: 16px for body text on mobile

### Spacing Scale
- `space-1` → `4px`
- `space-2` → `8px`
- `space-3` → `12px`
- `space-4` → `16px`
- `space-5` → `20px`
- `space-6` → `24px`
- `space-8` → `32px`
- `space-10` → `40px`
- `space-12` → `48px`

### Border Radius
- `rounded-sm`: `2px` (Inputs, tags)
- `rounded`: `4px` (Cards, buttons)
- `rounded-lg`: `8px` (Large cards, modals)

---

## Component Guidelines

### Buttons

**Primary (CTA)**
```tsx
<button className="
  cursor-pointer
  bg-zinc-900
  hover:bg-zinc-800
  disabled:bg-zinc-400
  disabled:cursor-not-allowed
  text-white
  font-inter
  font-semibold
  px-5 py-2.5
  min-h-[44px]
  transition-colors duration-200
  flex items-center gap-2
  focus:outline-none
  focus:ring-2
  focus:ring-red-500
  focus:ring-offset-2
">
  {label}
</button>
```

**Secondary**
```tsx
<button className="
  cursor-pointer
  border border-zinc-300
  hover:border-red-500
  hover:text-red-600
  text-zinc-600
  font-inter
  text-sm
  px-4 py-2.5
  min-h-[44px]
  transition-colors duration-200
  focus:outline-none
  focus:ring-2
  focus:ring-red-500
">
  {label}
</button>
```

### Inputs

```tsx
<input
  type="text"
  inputMode="numeric"
  placeholder="00000-000"
  className="
    flex-1
    border border-zinc-300
    px-3 py-2.5
    text-sm
    font-inter
    text-zinc-800
    placeholder:text-zinc-400
    focus:outline-none
    focus:border-red-500
    focus:ring-2
    focus:ring-red-500/20
    transition-colors duration-200
    aria-invalid={hasError}
  "
  aria-label={label}
  aria-invalid={hasError}
/>
```

### Cards (Product)

```tsx
<a href={href} className="
  block
  bg-white
  border border-zinc-200
  hover:shadow-lg
  hover:-translate-y-0.5
  transition-all duration-200
  group
  cursor-pointer
">
  {/* Image */}
  <div className="relative aspect-square bg-zinc-50 overflow-hidden">
    <Image
      src={img}
      alt={alt}
      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
    />
  </div>

  {/* Content */}
  <div className="p-3">
    <p className="font-inter text-xs text-zinc-500 mb-1">{category}</p>
    <h3 className="font-inter text-sm text-zinc-800 font-medium leading-snug">
      {name}
    </h3>
    <p className="font-barlow font-black text-zinc-900 text-xl">
      R$ {price}
    </p>
  </div>
</a>
```

### Loading States

**Spinner**
```tsx
<div className="flex items-center gap-2">
  <Loader2 className="h-4 w-4 animate-[spin_1s_linear_infinite]" aria-hidden="true" />
  <span>Carregando...</span>
</div>
```

**Skeleton**
```tsx
<div className="animate-pulse bg-zinc-200 h-4 w-full" />
```

---

## UX Guidelines

### Forms & Input
- ✅ Use `inputMode` for mobile keyboards
- ✅ Validate on blur (not only on submit)
- ✅ Visible labels (never placeholder-only)
- ✅ Distinct input styling (border/background)
- ✅ `aria-invalid` when error exists
- ✅ Focus ring for keyboard navigation

### Error Messages
```tsx
{error && (
  <p
    role="alert"
    className="text-red-600 text-sm"
    aria-live="polite"
  >
    {error}
  </p>
)}
```

### Loading & Async
- ✅ Show feedback during async operations
- ✅ Disable button during loading
- ✅ Use skeleton or spinner
- ✅ Respect `prefers-reduced-motion`

### Touch Targets
- ✅ Minimum 44×44px for touch
- ✅ Consistent spacing

### Hover States
- ✅ Clear visual feedback (color, shadow)
- ✅ Smooth transitions (150-300ms)
- ✅ No layout shift (avoid scale transforms)

### Focus States
- ✅ Visible focus ring
- ✅ Focus ring with offset
- ✅ Focus order matches visual order

---

## Accessibility (CRITICAL)

### Color Contrast
- Minimum 4.5:1 for normal text
- Light mode: Use `slate-900` (#0F172A) for text
- Muted text: `slate-600` (#475569) minimum
- Avoid `slate-400` or lighter for body text

### ARIA Labels
- Icon-only buttons: `aria-label` required
- Lists: `role="list"` and `aria-label`
- Errors: `role="alert"` and `aria-live="polite"`

### Keyboard Navigation
- Tab order matches visual order
- Focus states visible (focus ring)
- Enter key support for actions

### Screen Readers
- Descriptive alt text for images
- `aria-hidden="true"` for decorative icons
- Semantic HTML (nav, main, section, etc.)

---

## Motion & Animation

### Duration
- Micro-interactions: 150-300ms
- Hover effects: 200ms
- Page transitions: 300-400ms
- Scroll animations: Using Intersection Observer

### Performance
- Use `transform` and `opacity`
- Avoid animating `width`, `height`, `left`, `top`
- Respect `prefers-reduced-motion`

---

## Anti-Patterns (AVOID)

| ❌ Avoid | ✅ Instead |
|---------|-----------|
| Emoji icons | SVG icons (Lucide, Heroicons) |
| Scale on hover (shifts layout) | Color/opacity transitions |
| No focus indicators | Focus ring with offset |
| Placeholder-only labels | Visible labels above/below input |
| Borderless inputs | Border/background styling |
| Instant state changes | Smooth transitions (150-300ms) |
| Low contrast text | 4.5:1 minimum contrast ratio |
| Same style for disabled | `opacity-50 cursor-not-allowed` |
| No error feedback | `role="alert"` + `aria-live` |

---

## Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| Mobile | 375px | Small phones |
| Mobile Large | 414px | Large phones |
| Tablet | 768px | Tablets |
| Desktop | 1024px | Small laptops |
| Desktop Large | 1280px | Standard desktops |
| Desktop XL | 1440px | Large desktops |

### Responsive Guidelines
- No horizontal scroll on mobile
- Content fits viewport width
- Stack columns on mobile
- Optimize images for each breakpoint

---

## Icon System

### Icon Library
- **Lucide React** (Primary)
- Consistent sizing: `h-4 w-4`, `h-5 w-5`, `h-6 w-6`
- Same `viewBox` (24×24) for consistency

### Common Icons

| Icon | Component | Usage |
|------|-----------|-------|
| 🚚 Truck | `Truck` | Shipping, delivery |
| 🛒 Cart | `ShoppingCart` | Shopping cart |
| ❤️ Heart | `Heart` | Wishlist, favorites |
| 📦 Package | `Package` | Stock, inventory |
| 🛡️ Shield | `Shield` | Guarantees, returns |
| 🔄 Refresh | `RefreshCw` | Exchange, reload |
| ➡️ Chevron | `ChevronRight` | Navigation, breadcrumbs |
| 💬 Message | `MessageCircle` | WhatsApp, contact |

---

## Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis used as icons (use SVG)
- [ ] All icons from consistent set (Lucide)
- [ ] Brand logos are correct
- [ ] Hover states don't cause layout shift
- [ ] Use theme colors directly (not var())

### Interaction
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear visual feedback
- [ ] Transitions are smooth (150-300ms)
- [ ] Focus states visible for keyboard nav

### Light/Dark Mode
- [ ] Light mode text has sufficient contrast (4.5:1)
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both modes
- [ ] Test both modes before delivery

### Layout
- [ ] Floating elements have proper spacing
- [ ] No content hidden behind fixed navbars
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

### Accessibility
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] `prefers-reduced-motion` respected
- [ ] Error messages use `role="alert"`

---

## File Structure

```
mosca-ecom-main/
├── src/
│   ├── components/
│   │   ├── automotive/
│   │   │   ├── top-header.tsx
│   │   │   ├── add-to-cart.tsx
│   │   │   └── product-card.tsx
│   │   └── shipping-calculator.tsx
│   ├── app/
│   │   ├── produto/[slug]/
│   │   │   └── page.tsx
│   │   └── api/shipping/calculate/
│   │       └── route.ts
│   └── lib/
│       └── products.ts
├── design-system/
│   └── mosca-branca-parts/
│       ├── MASTER.md (this file)
│       └── pages/ (page-specific overrides)
└── .claude/
    └── skills/
        └── ui-ux-pro-max/
```

---

## References

- **UI/UX Pro Max Skill**: `.claude/skills/ui-ux-pro-max/`
- **Design System Generator**: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py`
- **Google Fonts**: [Syncopate + Space Mono](https://fonts.google.com/share?selection?family=Space+Mono:wght@400;700|Syncopate:wght@400;700)

---

**Last Updated:** 2026-05-30
**Version:** 1.0.0