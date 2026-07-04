# Cards

> Dependencies: `colors.md`, `radius.md`, `shadows.md`, `typography.md`

## Core Specs

- **Background:** neutral-primary-soft
- **Border:** 4px dotted, border-default color
- **Radius:** 0px (base)
- **Shadow:** none (shadow-xs)

## Card Heading

- Desktop: 16px, 400 weight, heading color, 'Press Start 2P'
- Mobile: 14px, 400 weight, heading color, 'Press Start 2P'
- Never skip heading levels — the page hierarchy must logically arrive at the card heading level.

## States

### Static Card (no interactivity)
- Background: neutral-primary-soft
- Border: 4px dotted, border-default
- Radius: 0px
- Shadow: none (shadow-xs)
- No hover styles. Non-interactive cards must NOT have hover background changes.

### Interactive Card (clickable)
- Same base styles as static card
- Hover: neutral-secondary-medium background
- Transition: colors
- Cursor: pointer

## Rules

- Background: neutral-primary-soft
- Border: 4px dotted, border-default
- Radius: 0px
- Shadow: none (shadow-xs)
- Interactive hover: neutral-secondary-medium background
- Non-interactive: no hover styles
