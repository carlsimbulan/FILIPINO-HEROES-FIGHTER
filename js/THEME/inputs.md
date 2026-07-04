# Inputs

> Dependencies: `colors.md`, `radius.md`

## Core Specs

- **Display:** block, full width
- **Radius:** 0px (base)
- **Border:** 4px dotted, border-default-medium
- **Background:** neutral-secondary-medium
- **Shadow:** none (shadow-xs)
- **Font:** 12px, heading color, 'Press Start 2P'
- **Padding:** 12px horizontal, 10px vertical
- **Placeholder:** body color
- **Transition:** all properties, 200ms

## Label

- Display: block
- Font: 10px, 400 weight, heading color, 'Press Start 2P'
- Margin bottom: 8px
- Label `htmlFor` must match the input `id`

## States

### Default
- Border: 4px dotted border-default-medium
- Background: neutral-secondary-medium

### Hover
- Border: 4px dotted border-default-strong

### Focus
- No outline
- Border: 4px dotted border-brand
- Ring: 1px, brand color

### Success
- Border: 4px dotted border-success
- Focus ring: 1px, success color

### Error / Danger
- Border: 4px dotted border-danger
- Focus ring: 1px, danger color

### Disabled
- Background: disabled
- Text: fg-disabled
- Cursor: not-allowed

## Input with Icons

- Icon size: 16x16px
- Icon color: body
- Container: relative positioned wrapper
- Start icon: absolutely positioned left, 12px left padding — input gets 36px left padding
- End icon: absolutely positioned right, 12px right padding — input gets 36px right padding
- Icons vertically centered within the wrapper

## Rules

- Every input must have a unique `id`
- Every label must have a matching `htmlFor`
- Padding: 12px horizontal, 10px vertical unless overridden for icon variants
- No arbitrary hex or hardcoded colors
