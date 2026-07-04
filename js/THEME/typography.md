# Typography

> Dependencies: `colors.md`

## Core Rules

- **Font:** 'Press Start 2P', cursive — loaded from Google Fonts (`https://fonts.google.com/specimen/Press+Start+2P`), configured at app level, never override
- **Headings:** regular weight (400 — only available weight for Press Start 2P), heading text color
- **Body copy:** body text color, never use brand color for paragraphs longer than one sentence
- **Semantic HTML:** Use `h1`–`h6` in order, never skip levels
- **Weight note:** Press Start 2P only provides Regular 400. All weight references in this system use 400. Visual hierarchy is achieved through size and color, not weight.

## Heading Scale

### Desktop

| Element | Size | Line-height | Letter-spacing | Margin-bottom |
|---|---|---|---|---|
| `h1` | 36px | 1.4 | 2px | 24px |
| `h2` | 28px | 1.4 | 1px | — |
| `h3` | 22px | 1.4 | 1px | — |
| `h4` | 18px | 1.5 | — | — |
| `h5` | 16px | 1.5 | — | — |
| `h6` | 14px | 1.5 | — | — |

### Responsive

| Element | Tablet (≥768px) | Mobile (default) |
|---|---|---|
| `h1` | 28px | 22px |
| `h2` | 22px | 18px |
| `h3` | 18px | 16px |
| `h4` | 16px | 14px |
| `h5` | 14px | 12px |
| `h6` | 12px | 10px |

Mobile-first: start with mobile sizes, scale up at tablet and desktop breakpoints.

Never reduce line-height below 1.3 for any heading.

## Paragraphs

### Leading Paragraph
- Size: 14px
- Weight: 400
- Color: body
- Line-height: 2.0
- Max width: ~55 characters

### Normal Paragraph
- Size: 12px
- Weight: 400
- Color: body
- Line-height: 2.0
- Max width: ~50 characters

### Small Supporting Copy
- Size: 10px
- Weight: 400
- Color: body
- Line-height: 1.8
- Use only for helper text, legal text, captions, metadata.

## UI Labels

| Context | Size | Weight |
|---|---|---|
| Button labels | 12px | 400 |
| Input labels | 10px or 12px | 400 |
| Captions / meta / badges | 8px or 10px | 400 |

Do not apply paragraph line-height (2.0) to control labels.

## Links

- **Inline links:** Same size as surrounding text, fg-brand color, underline, hover → no underline
- **CTA links:** fg-brand color, 400 weight, underline, hover → no underline

## Emphasis

- `<strong>` for high-priority emphasis in body text
- `<em>` for tone emphasis only, not visual hierarchy
- All-caps only for short labels: uppercase, 1px letter-spacing, 8px or 10px

## Dark Mode

Hierarchy stays identical. Only color tokens change (automatic via CSS custom properties). Size, weight, and spacing remain constant.
