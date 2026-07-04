# Tooltips & Popovers

> Dependencies: `colors.md`, `radius.md`, `shadows.md`

## Tooltips

### Core Specs
- Padding: 12px horizontal, 8px vertical
- Font: 10px, 400 weight, 'Press Start 2P'
- Radius: 0px (default)
- Shadow: none (shadow-xs)
- Transition: opacity, 300ms

### Dark (Default)
- Background: dark
- Text: white
- Border: 4px dotted transparent

### Light
- Background: neutral-primary-medium
- Text: heading color
- Border: 4px dotted, border-default

## Popovers

### Core Specs
- Background: neutral-primary
- Radius: 0px (base)
- Shadow: shadow-md
- Border: 4px dotted, border-default
- Transition: opacity, 300ms

### Header / Title
- Padding: 12px horizontal, 8px vertical
- Background: neutral-secondary-soft
- Bottom border: 1px solid border-default
- Font: 10px, 400 weight, heading color

### Body / Content
- Standard: 12px horizontal, 8px vertical padding; 10px, body color
- Rich: 16px padding; 10px, body color

## Arrows

- Size: 8x8px rotated 45deg
- Color must match the background of the tooltip/popover variant

## Rules

- Tooltips: 0px radius
- Popovers: 0px radius
- Dark tooltips: dark background, white text
- Light tooltips/popovers: semantic neutral background + 4px dotted border tokens
- Arrows match parent background color
