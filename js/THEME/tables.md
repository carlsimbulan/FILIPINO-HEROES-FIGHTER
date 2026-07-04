# Tables

> Dependencies: `colors.md`, `radius.md`, `shadows.md`

## Wrapper

- Horizontal scroll overflow
- Background: neutral-primary-soft
- Radius: 0px (base)
- Border: 4px dotted, border-default
- Shadow: none (shadow-xs)

## Table Element

- Full width, left-aligned text (right-aligned for RTL)
- Font: 10px, body color, 'Press Start 2P'

## Table Head

- Font: 10px, body color, 400 weight
- Background: neutral-secondary-soft
- Bottom border: 1px solid border-default
- Cell padding: 24px horizontal, 12px vertical

## Table Body

- Row background: neutral-primary
- Row bottom border: 1px solid border-default (omit on last row to avoid doubling with wrapper border)
- Row hover: neutral-secondary-soft background (optional)
- Row header: 400 weight, heading color, no-wrap
- Cell padding: 24px horizontal, 16px vertical

## Rules

- Wrapper must have horizontal scroll overflow for responsive scrolling
- Last row: omit bottom border to avoid doubling with wrapper border
- Row headers: always `scope="row"` for semantic structure
- Hover on rows is optional
- No arbitrary hex codes — use token colors only
