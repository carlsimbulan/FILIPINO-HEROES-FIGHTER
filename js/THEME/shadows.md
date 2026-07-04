# Shadows

| Token | CSS value |
|---|---|
| shadow-2xs | `none` |
| shadow-xs | `none` |
| shadow-sm | `0 0 6px rgba(42, 63, 229, 0.1)` |
| shadow-md | `0 0 10px rgba(42, 63, 229, 0.15)` |
| shadow-lg | `0 0 16px rgba(42, 63, 229, 0.2)` |
| shadow-xl | `0 0 24px rgba(42, 63, 229, 0.25)` |
| shadow-2xl | `0 0 32px rgba(42, 63, 229, 0.3)` |

## Component Mapping

| Component type | Token |
|---|---|
| Subtle separators, tiny UI details | shadow-2xs or shadow-xs (none) |
| Inputs, buttons, small controls, lightweight cards | shadow-xs or shadow-sm |
| Standard cards, popovers, dropdowns | shadow-md |
| Prominent cards, sticky surfaces | shadow-lg |
| Modals, high-priority overlays | shadow-xl |
| Hero overlays, top-level emphasis (sparingly) | shadow-2xl |

## Rules

- Use only these tokens — no custom box-shadow values
- Keep elevation steps intentional; the arcade aesthetic favors flat design with optional subtle blue glow
- Components in the same family share the same baseline elevation
- Hover/focus on interactive elevated elements: step up by one level
- Never stack multiple shadow tokens on one element
- Never use shadow-xl/shadow-2xl for dense list items or body containers
