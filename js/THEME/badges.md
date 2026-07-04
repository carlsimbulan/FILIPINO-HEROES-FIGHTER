# Badges

> Dependencies: `colors.md`, `radius.md`

## Core Specs

- **Border:** 4px dotted
- **Default radius:** 0px
- **Pill radius:** 9999px

## Sizes

| Size | Font size | Horizontal padding | Vertical padding |
|---|---|---|---|
| Default (small) | 8px | 6px | 2px |
| Large | 10px | 8px | 4px |

## Variants

### Brand
- **Background:** brand-softer
- **Border:** 4px dotted border-brand-subtle
- **Text:** fg-brand-strong

### Alternative (Neutral Soft)
- **Background:** neutral-primary-soft
- **Border:** 4px dotted border-default
- **Text:** heading

### Gray (Neutral Medium)
- **Background:** neutral-secondary-medium
- **Border:** 4px dotted border-default
- **Text:** heading

### Danger
- **Background:** danger-soft
- **Border:** 4px dotted border-danger-subtle
- **Text:** fg-danger-strong

### Success
- **Background:** success-soft
- **Border:** 4px dotted border-success-subtle
- **Text:** fg-success-strong

### Warning
- **Background:** warning-soft
- **Border:** 4px dotted border-warning-subtle
- **Text:** fg-warning

### Dark
- **Background:** dark
- **Border:** 4px dotted transparent
- **Text:** white

## Pill Badges

Use 9999px radius instead of 0px on any variant.

## Badges with Icons

- Icon size (default): 12x12px
- Icon size (large): 14x14px
- Icon spacing: 4px margin next to label

## Icon-only Badge

Square shape — equalize dimensions to 24x24px, no horizontal text padding.

## Dismissible Badges

Badge content + a close button. Close button hover backgrounds per variant:

| Variant | Close button hover background |
|---|---|
| Brand | brand-soft |
| Alternative | neutral-tertiary |
| Gray | neutral-quaternary |
| Danger | danger-medium |
| Success | success-medium |
| Warning | warning-medium |

## Dot / Notification Badge

- Positioned absolutely: -4px top, -4px right
- Size: 12x12px, fully rounded
- 2px border in border-buffer color
- Background: danger
