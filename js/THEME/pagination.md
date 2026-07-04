# Pagination

> Dependencies: `colors.md`, `radius.md`

## Container

Font: 10px, 'Press Start 2P'. Items displayed as flex with -1px overlap for seamless borders.

## Pagination Item

- Layout: flex, centered both axes
- Size: 36x36px (or 40x40px)
- Text: body color, 400 weight
- Background: neutral-secondary-medium
- Border: 4px dotted, border-default-medium
- Hover: neutral-tertiary-medium background, heading text
- Focus: no outline
- Overlap: -1px left margin

## Previous / Next Buttons

- Horizontal padding: 12px, height: 36px
- First item: 0px radius on all sides
- Last item: 0px radius on all sides

## Active Page Item

- Text: fg-brand color
- Background: neutral-tertiary-medium
- Hover text: fg-brand (stays same)

## Rules

- Display as flex with -1px child overlap for seamless borders
- Items: neutral-secondary-medium background, 4px dotted border-default-medium border, body text
- Active: fg-brand text, neutral-tertiary-medium background
- All items: 0px radius (sharp corners)
- All items need hover and focus states
