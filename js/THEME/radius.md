# Border Radius

| Token | Value | Default usage |
|---|---|---|
| base | 0px | Buttons, cards, inputs, modals, sections |
| default | 0px | Badges, tooltips, dropdown items, small controls |
| sm | 0px | Checkboxes, tiny elements |
| full | 9999px | Pills, avatars, toggles, dot indicators |

## Rules

- 0px is the default radius across the product — sharp, squared-off corners for the arcade aesthetic
- Never use arbitrary radius values outside this scale
- Radius must be consistent within each component family
- Only use `full` (9999px) for elements that are explicitly circular: pill badges, avatars, toggles, dot indicators
