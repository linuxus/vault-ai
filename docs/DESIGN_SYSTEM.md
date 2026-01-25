# Vault AI - Design System

## Overview

This design system establishes the visual language for Vault AI, drawing inspiration from HashiCorp's design principles while creating a cohesive, modern interface optimized for secrets management workflows.

---

## Design Principles

### 1. Clarity Over Cleverness

Secrets management requires precision. Every interface element should communicate its purpose clearly, avoiding ambiguity that could lead to operational errors.

### 2. Progressive Disclosure

Surface essential information first. Advanced options and detailed configurations are revealed contextually, keeping the interface approachable without sacrificing power.

### 3. Confidence Through Feedback

Every action provides clear feedback. Users should never wonder if an operation succeeded, especially when working with sensitive data.

### 4. Defensive Design

Critical operations (delete, revoke, overwrite) require explicit confirmation. Destructive actions are visually distinct and harder to trigger accidentally.

---

## Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Vault Purple | `#7B61FF` | 123, 97, 255 | Primary actions, active states |
| Vault Purple Dark | `#6B4FE0` | 107, 79, 224 | Hover states, emphasis |
| Vault Purple Light | `#9B85FF` | 155, 133, 255 | Light accents, backgrounds |

### Neutral Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Gray 900 | `#0F172A` | 15, 23, 42 | Primary text, headings |
| Gray 800 | `#1E293B` | 30, 41, 59 | Sidebar background |
| Gray 700 | `#334155` | 51, 65, 85 | Secondary text, borders |
| Gray 600 | `#475569` | 71, 85, 105 | Muted text |
| Gray 500 | `#64748B` | 100, 116, 139 | Placeholder text |
| Gray 400 | `#94A3B8` | 148, 163, 184 | Disabled states |
| Gray 300 | `#CBD5E1` | 203, 213, 225 | Borders, dividers |
| Gray 200 | `#E2E8F0` | 226, 232, 240 | Subtle backgrounds |
| Gray 100 | `#F1F5F9` | 241, 245, 249 | Page backgrounds |
| Gray 50 | `#F8FAFC` | 248, 250, 252 | Card backgrounds |
| White | `#FFFFFF` | 255, 255, 255 | Surface backgrounds |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#10B981` | Successful operations, valid states |
| Success Light | `#D1FAE5` | Success backgrounds |
| Warning | `#F59E0B` | Warnings, expiring items |
| Warning Light | `#FEF3C7` | Warning backgrounds |
| Error | `#EF4444` | Errors, destructive actions |
| Error Light | `#FEE2E2` | Error backgrounds |
| Info | `#3B82F6` | Informational messages |
| Info Light | `#DBEAFE` | Info backgrounds |

### Dark Mode Colors

| Name | Light Mode | Dark Mode |
|------|------------|-----------|
| Background | `#F8FAFC` | `#0F172A` |
| Surface | `#FFFFFF` | `#1E293B` |
| Surface Elevated | `#FFFFFF` | `#334155` |
| Text Primary | `#0F172A` | `#F1F5F9` |
| Text Secondary | `#475569` | `#94A3B8` |
| Border | `#E2E8F0` | `#334155` |

### CSS Variables

```css
:root {
  /* Primary */
  --color-primary: #7B61FF;
  --color-primary-dark: #6B4FE0;
  --color-primary-light: #9B85FF;

  /* Neutrals */
  --color-gray-900: #0F172A;
  --color-gray-800: #1E293B;
  --color-gray-700: #334155;
  --color-gray-600: #475569;
  --color-gray-500: #64748B;
  --color-gray-400: #94A3B8;
  --color-gray-300: #CBD5E1;
  --color-gray-200: #E2E8F0;
  --color-gray-100: #F1F5F9;
  --color-gray-50: #F8FAFC;

  /* Semantic */
  --color-success: #10B981;
  --color-success-light: #D1FAE5;
  --color-warning: #F59E0B;
  --color-warning-light: #FEF3C7;
  --color-error: #EF4444;
  --color-error-light: #FEE2E2;
  --color-info: #3B82F6;
  --color-info-light: #DBEAFE;

  /* Surfaces */
  --color-background: var(--color-gray-50);
  --color-surface: #FFFFFF;
  --color-surface-elevated: #FFFFFF;

  /* Text */
  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-600);
  --color-text-muted: var(--color-gray-500);

  /* Borders */
  --color-border: var(--color-gray-200);
  --color-border-strong: var(--color-gray-300);
}

[data-theme="dark"] {
  --color-background: var(--color-gray-900);
  --color-surface: var(--color-gray-800);
  --color-surface-elevated: var(--color-gray-700);
  --color-text-primary: var(--color-gray-100);
  --color-text-secondary: var(--color-gray-400);
  --color-text-muted: var(--color-gray-500);
  --color-border: var(--color-gray-700);
  --color-border-strong: var(--color-gray-600);
}
```

---

## Typography

### Font Stack

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
}
```

### Type Scale

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| Display | 36px / 2.25rem | 1.2 | 700 | Hero sections |
| H1 | 30px / 1.875rem | 1.3 | 600 | Page titles |
| H2 | 24px / 1.5rem | 1.35 | 600 | Section headers |
| H3 | 20px / 1.25rem | 1.4 | 600 | Subsection headers |
| H4 | 16px / 1rem | 1.5 | 600 | Card headers |
| Body Large | 18px / 1.125rem | 1.6 | 400 | Lead paragraphs |
| Body | 14px / 0.875rem | 1.6 | 400 | Default text |
| Body Small | 13px / 0.8125rem | 1.5 | 400 | Secondary info |
| Caption | 12px / 0.75rem | 1.4 | 400 | Labels, metadata |
| Code | 13px / 0.8125rem | 1.5 | 400 | Inline code |
| Code Block | 13px / 0.8125rem | 1.6 | 400 | Code blocks |

### Typography Classes

```css
.text-display {
  font-size: 2.25rem;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.text-h1 {
  font-size: 1.875rem;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.text-h2 {
  font-size: 1.5rem;
  line-height: 1.35;
  font-weight: 600;
}

.text-h3 {
  font-size: 1.25rem;
  line-height: 1.4;
  font-weight: 600;
}

.text-h4 {
  font-size: 1rem;
  line-height: 1.5;
  font-weight: 600;
}

.text-body-lg {
  font-size: 1.125rem;
  line-height: 1.6;
}

.text-body {
  font-size: 0.875rem;
  line-height: 1.6;
}

.text-body-sm {
  font-size: 0.8125rem;
  line-height: 1.5;
}

.text-caption {
  font-size: 0.75rem;
  line-height: 1.4;
}

.text-code {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.5;
}
```

---

## Spacing System

### Base Unit

The spacing system uses a 4px base unit for consistent rhythm throughout the interface.

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| space-0 | 0 | 0px | None |
| space-1 | 0.25rem | 4px | Tight spacing |
| space-2 | 0.5rem | 8px | Related elements |
| space-3 | 0.75rem | 12px | Component padding |
| space-4 | 1rem | 16px | Default spacing |
| space-5 | 1.25rem | 20px | Medium spacing |
| space-6 | 1.5rem | 24px | Section spacing |
| space-8 | 2rem | 32px | Large gaps |
| space-10 | 2.5rem | 40px | Page sections |
| space-12 | 3rem | 48px | Major sections |
| space-16 | 4rem | 64px | Page padding |

### Layout Spacing

```css
:root {
  --sidebar-width: 260px;
  --header-height: 56px;
  --chat-panel-width: 380px;
  --content-max-width: 1200px;
  --page-padding: var(--space-6);
  --card-padding: var(--space-4);
  --section-gap: var(--space-8);
}
```

---

## Component Specifications

### Buttons

#### Primary Button

```
┌─────────────────────────────────┐
│         Primary Action          │
└─────────────────────────────────┘

- Background: var(--color-primary)
- Text: White
- Padding: 10px 16px
- Border radius: 6px
- Font weight: 500
- Min width: 80px

Hover: background var(--color-primary-dark)
Active: transform scale(0.98)
Disabled: opacity 0.5, cursor not-allowed
```

#### Secondary Button

```
┌─────────────────────────────────┐
│        Secondary Action         │
└─────────────────────────────────┘

- Background: Transparent
- Border: 1px solid var(--color-border-strong)
- Text: var(--color-text-primary)
- Padding: 10px 16px
- Border radius: 6px

Hover: background var(--color-gray-100)
```

#### Danger Button

```
┌─────────────────────────────────┐
│           Delete                │
└─────────────────────────────────┘

- Background: var(--color-error)
- Text: White
- Use for destructive actions only
```

#### Button Sizes

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| sm | 32px | 8px 12px | 13px |
| md | 40px | 10px 16px | 14px |
| lg | 48px | 12px 24px | 16px |

### Input Fields

#### Text Input

```
┌─────────────────────────────────────────────┐
│ Label                                       │
├─────────────────────────────────────────────┤
│ [icon] Placeholder text                     │
└─────────────────────────────────────────────┘
  Helper text or error message

- Height: 40px
- Padding: 10px 12px
- Border: 1px solid var(--color-border)
- Border radius: 6px
- Background: var(--color-surface)

Focus: border-color var(--color-primary), box-shadow 0 0 0 3px rgba(123, 97, 255, 0.15)
Error: border-color var(--color-error)
Disabled: background var(--color-gray-100), opacity 0.7
```

#### Secret Value Input

```
┌─────────────────────────────────────────────────────┐
│ ••••••••••••••••                      [👁] [📋]    │
└─────────────────────────────────────────────────────┘

- Monospace font
- Masked by default
- Toggle visibility button
- Copy to clipboard button
```

### Cards

#### Standard Card

```
┌─────────────────────────────────────────────────────┐
│  Header                                    [Action] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Content area                                       │
│                                                     │
└─────────────────────────────────────────────────────┘

- Background: var(--color-surface)
- Border: 1px solid var(--color-border)
- Border radius: 8px
- Padding: var(--card-padding)
- Shadow: 0 1px 3px rgba(0, 0, 0, 0.05)
```

#### Secret Card

```
┌─────────────────────────────────────────────────────┐
│ 🔑  secret/data/database                            │
├─────────────────────────────────────────────────────┤
│  username    admin                          [Copy]  │
│  password    ••••••••                 [Show][Copy]  │
│  host        db.example.com                 [Copy]  │
├─────────────────────────────────────────────────────┤
│  Version 3  •  Updated 2 hours ago         [Edit]   │
└─────────────────────────────────────────────────────┘
```

### Tables

#### Standard Table

```
┌─────────────────────────────────────────────────────────────────┐
│ Name              │ Type      │ Created           │ Actions     │
├─────────────────────────────────────────────────────────────────┤
│ database          │ kv-v2     │ Jan 15, 2025      │ [···]       │
│ certificates      │ pki       │ Jan 10, 2025      │ [···]       │
│ aws               │ aws       │ Dec 22, 2024      │ [···]       │
└─────────────────────────────────────────────────────────────────┘

Header:
- Background: var(--color-gray-50)
- Font weight: 600
- Padding: 12px 16px
- Border bottom: 1px solid var(--color-border)

Rows:
- Padding: 12px 16px
- Border bottom: 1px solid var(--color-border)
- Hover: background var(--color-gray-50)
```

### Navigation

#### Sidebar

```
┌────────────────────────┐
│  [Logo]  Vault AI      │
├────────────────────────┤
│                        │
│  📦 Secrets            │
│     └─ kv-v2          │
│     └─ database       │
│                        │
│  🔐 PKI                │
│     └─ pki            │
│                        │
│  🔑 Authentication     │
│                        │
│  📜 Policies           │
│                        │
├────────────────────────┤
│  ⚙️  Settings          │
│  👤 User              │
└────────────────────────┘

- Width: var(--sidebar-width)
- Background: var(--color-gray-800) (dark theme)
- Text: var(--color-gray-300)
- Active item: background rgba(123, 97, 255, 0.15), text var(--color-primary-light)
```

#### Breadcrumbs

```
Home  /  Secrets  /  kv-v2  /  database  /  credentials

- Font size: 13px
- Separator: " / " with muted color
- Current item: font-weight 500
- Links: color var(--color-primary) on hover
```

### Modals

#### Standard Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Modal Title                                         [×]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Modal content goes here. Can include forms,                │
│  information, or confirmations.                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                      [Cancel]  [Confirm]    │
└─────────────────────────────────────────────────────────────┘

- Max width: 560px (configurable)
- Border radius: 12px
- Overlay: rgba(15, 23, 42, 0.6)
- Animation: fade in + scale from 95%
```

#### Confirmation Modal (Destructive)

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Delete Secret                                   [×]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Are you sure you want to delete "database/credentials"?    │
│                                                             │
│  This action cannot be undone.                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                      [Cancel]  [Delete]     │
└─────────────────────────────────────────────────────────────┘

- Delete button uses danger styling
- Warning icon in header
```

### Toast Notifications

```
Success:
┌─────────────────────────────────────────────────────┐
│ ✓  Secret saved successfully                   [×]  │
└─────────────────────────────────────────────────────┘

Error:
┌─────────────────────────────────────────────────────┐
│ ✕  Permission denied: read secret/data/prod   [×]  │
└─────────────────────────────────────────────────────┘

- Position: top-right
- Width: 360px max
- Duration: 5 seconds (configurable)
- Border-left: 4px solid semantic color
```

---

## Layout Patterns

### App Shell

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Logo]                    Search...                    [🔔] [👤]        │
├────────────────┬────────────────────────────────────────┬───────────────┤
│                │                                        │               │
│                │                                        │   Chat        │
│   Sidebar      │          Main Content                  │   Panel       │
│                │                                        │               │
│                │                                        │               │
│                │                                        │               │
│                │                                        │               │
│                │                                        │               │
│                │                                        │               │
├────────────────┴────────────────────────────────────────┴───────────────┤
│                            Status Bar                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### List + Detail View

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  ┌────────────────────┐  ┌───────────────────────────────────────┐│
│  │                    │  │                                       ││
│  │   List Panel       │  │        Detail Panel                   ││
│  │                    │  │                                       ││
│  │   - Item 1 ◄──────────│        Details for Item 1             ││
│  │   - Item 2         │  │                                       ││
│  │   - Item 3         │  │                                       ││
│  │                    │  │                                       ││
│  └────────────────────┘  └───────────────────────────────────────┘│
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

- List panel: 300px width
- Resizable divider
- Selected item highlighted
```

### Form Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Section Header                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Label                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Input field                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│  Helper text                                                │
│                                                             │
│  Label                              Label                   │
│  ┌─────────────────────────┐       ┌─────────────────────┐ │
│  │ Half width input        │       │ Half width input    │ │
│  └─────────────────────────┘       └─────────────────────┘ │
│                                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  [Cancel]  [Save]                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

- Max form width: 640px
- Field gap: 20px
- Section gap: 32px
```

---

## Iconography

### Icon Library

Use Lucide Icons for consistency with HashiCorp's visual style.

### Common Icons

| Usage | Icon | Name |
|-------|------|------|
| Secrets | 🔑 | `key` |
| PKI/Certificates | 📜 | `file-certificate` |
| Authentication | 🔐 | `lock` |
| Policies | 📋 | `clipboard-list` |
| Settings | ⚙️ | `settings` |
| User | 👤 | `user` |
| Search | 🔍 | `search` |
| Add/Create | ➕ | `plus` |
| Edit | ✏️ | `pencil` |
| Delete | 🗑️ | `trash-2` |
| Copy | 📋 | `copy` |
| Refresh | 🔄 | `refresh-cw` |
| Download | ⬇️ | `download` |
| Upload | ⬆️ | `upload` |
| Folder | 📁 | `folder` |
| File | 📄 | `file` |
| Check | ✓ | `check` |
| Close | ✕ | `x` |
| Warning | ⚠️ | `alert-triangle` |
| Info | ℹ️ | `info` |
| Chat | 💬 | `message-square` |
| AI | ✨ | `sparkles` |

### Icon Sizing

| Size | Pixels | Usage |
|------|--------|-------|
| xs | 12px | Inline indicators |
| sm | 16px | Button icons, list items |
| md | 20px | Navigation, cards |
| lg | 24px | Headers, empty states |
| xl | 32px | Feature icons |

---

## Animation & Motion

### Timing Functions

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Duration Scale

| Token | Duration | Usage |
|-------|----------|-------|
| instant | 100ms | Micro-interactions (hover, focus) |
| fast | 150ms | Small transitions |
| normal | 200ms | Standard transitions |
| slow | 300ms | Larger animations |
| slower | 400ms | Complex animations |

### Standard Animations

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale in */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Spin */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Motion Principles

1. **Purposeful**: Animations guide attention and provide feedback
2. **Quick**: Keep durations short to maintain responsiveness
3. **Natural**: Use easing curves that feel organic
4. **Consistent**: Same actions produce same animations

---

## Accessibility

### Color Contrast

All text must meet WCAG 2.1 AA standards:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

### Focus States

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Keyboard Navigation

- All interactive elements are focusable
- Tab order follows logical reading order
- Escape closes modals and dropdowns
- Arrow keys navigate within components

### Screen Reader Support

- Semantic HTML elements
- ARIA labels for icon-only buttons
- Live regions for dynamic content
- Skip links for main content

---

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet portrait |
| lg | 1024px | Tablet landscape |
| xl | 1280px | Desktop |
| 2xl | 1536px | Large desktop |

### Layout Adaptations

```
Desktop (xl+):
┌──────────┬────────────────────────┬──────────┐
│ Sidebar  │       Content          │   Chat   │
└──────────┴────────────────────────┴──────────┘

Tablet (md-lg):
┌──────────┬─────────────────────────────────┐
│ Sidebar  │            Content              │
│ (mini)   │                                 │
└──────────┴─────────────────────────────────┘
(Chat as floating panel)

Mobile (< md):
┌─────────────────────────────────────────────┐
│                  Content                    │
└─────────────────────────────────────────────┘
(Sidebar and Chat as drawer overlays)
```

---

## Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        vault: {
          purple: '#7B61FF',
          'purple-dark': '#6B4FE0',
          'purple-light': '#9B85FF',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      spacing: {
        'sidebar': '260px',
        'header': '56px',
        'chat': '380px',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
      },
    },
  },
};
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-16 | Vault AI Team | Initial design system |
