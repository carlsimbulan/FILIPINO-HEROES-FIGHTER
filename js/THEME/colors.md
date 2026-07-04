# Color Tokens


## Background Tokens

### Neutral
| Token | Light | Dark |
|---|---|---|
| neutral-primary-soft | #000000 | #000000 |
| neutral-primary | #000000 | #000000 |
| neutral-primary-medium | #0A0A1A | #0A0A1A |
| neutral-primary-strong | #141428 | #141428 |
| neutral-secondary-soft | #050510 | #050510 |
| neutral-secondary | #0A0A1A | #0A0A1A |
| neutral-secondary-medium | #0D0D22 | #0D0D22 |
| neutral-secondary-strong | #141428 | #141428 |
| neutral-tertiary-soft | #0A0A1A | #0A0A1A |
| neutral-tertiary | #0D0D22 | #0D0D22 |
| neutral-tertiary-medium | #141428 | #141428 |
| neutral-quaternary | #1A1A33 | #1A1A33 |
| quaternary-medium | #222244 | #222244 |
| gray | #333355 | #333355 |

### Brand
| Token | Light | Dark |
|---|---|---|
| brand-softer | #0A0F3D | #0A0F3D |
| brand-soft | #131B5E | #131B5E |
| brand | #2A3FE5 | #2A3FE5 |
| brand-medium | #1A2A8F | #1A2A8F |
| brand-strong | #1E30B8 | #1E30B8 |

### Status
| Token | Light | Dark |
|---|---|---|
| success-soft | #001A0A | #001A0A |
| success | #00CC66 | #00CC66 |
| success-medium | #003318 | #003318 |
| success-strong | #009944 | #009944 |
| danger-soft | #1A0005 | #1A0005 |
| danger | #FF0000 | #FF0000 |
| danger-medium | #330011 | #330011 |
| danger-strong | #CC0000 | #CC0000 |
| warning-soft | #1A0F00 | #1A0F00 |
| warning | #FFB852 | #FFB852 |
| warning-medium | #332200 | #332200 |
| warning-strong | #FF8C00 | #FF8C00 |

### Button Glint (CSS custom properties, used for the glint box-shadow effect)
| Variable | Light | Dark |
|---|---|---|
| `--color-1-400` | rgba(255,255,255,0.06) | rgba(255,255,255,0.06) |
| `--color-1-700` | rgba(0,0,0,0.3) | rgba(0,0,0,0.3) |

### Utility
| Token | Light | Dark |
|---|---|---|
| dark | #0D0D22 | #0D0D22 |
| dark-strong | #000000 | #141428 |
| disabled | #0A0A1A | #0A0A1A |

### Accent
| Token | Value (same both modes) |
|---|---|
| purple | #A855F7 |
| sky | #00BFFF |
| teal | #00FFCC |
| pink | #FFB8FF |
| cyan | #00FFDE |
| fuchsia | #FF00FF |
| indigo | #2A3FE5 |
| orange | #FFB852 |

## Text Color Tokens

### Base
| Token | Light | Dark |
|---|---|---|
| white | #FFFFFF | #FFFFFF |
| black | #000000 | #000000 |
| heading | #FFFFFF | #FFFFFF |
| body | #9CA3AF | #9CA3AF |
| body-subtle | #6B7280 | #6B7280 |

### Brand
| Token | Light | Dark |
|---|---|---|
| fg-brand-subtle | #1A2A8F | #1A2A8F |
| fg-brand | #2A3FE5 | #2A3FE5 |
| fg-brand-strong | #5B6FFF | #5B6FFF |

### Status
| Token | Light | Dark |
|---|---|---|
| fg-success | #00CC66 | #00CC66 |
| fg-success-strong | #00FF88 | #00FF88 |
| fg-danger | #FF0000 | #FF0000 |
| fg-danger-strong | #FF4444 | #FF4444 |
| fg-warning-subtle | #FFB852 | #FFB852 |
| fg-warning | #FF8C00 | #FF8C00 |
| fg-disabled | #444466 | #444466 |

### Informational / Accent
| Token | Light | Dark |
|---|---|---|
| fg-yellow | #FFCC00 | #FFCC00 |
| fg-info | #5B6FFF | #5B6FFF |
| fg-purple | #A855F7 | #A855F7 |
| fg-purple-strong | #C084FC | #C084FC |
| fg-cyan | #00FFDE | #00FFDE |
| fg-indigo | #2A3FE5 | #2A3FE5 |
| fg-pink | #FFB8FF | #FFB8FF |
| fg-lime | #00FF00 | #00FF00 |

## Border Color Tokens

| Token | Light | Dark |
|---|---|---|
| border-dark | #2A3FE5 | #2A3FE5 |
| border-buffer | #000000 | #000000 |
| border-buffer-medium | #000000 | #0D0D22 |
| border-buffer-strong | #000000 | #141428 |
| border-muted | #0A0A1A | #0A0A1A |
| border-light-subtle | #0D0D22 | #0D0D22 |
| border-light | #141428 | #141428 |
| border-light-medium | #1A1A33 | #1A1A33 |
| border-default-subtle | #141428 | #141428 |
| border-default | #2A3FE5 | #2A3FE5 |
| border-default-medium | #2A3FE5 | #2A3FE5 |
| border-default-strong | #5B6FFF | #5B6FFF |
| border-success-subtle | #003318 | #003318 |
| border-success | #00CC66 | #00CC66 |
| border-danger-subtle | #330011 | #330011 |
| border-danger | #FF0000 | #FF0000 |
| border-warning-subtle | #332200 | #332200 |
| border-warning | #FFB852 | #FFB852 |
| border-brand-subtle | #1A2A8F | #1A2A8F |
| border-brand-light | #2A3FE5 | #2A3FE5 |
| border-brand | #2A3FE5 | #2A3FE5 |
| border-dark-subtle | #0D0D22 | #141428 |
| border-purple | #A855F7 | #A855F7 |
| border-orange | #FFB852 | #FFB852 |

## Semantic Usage Rules

- Page/section backgrounds: ALWAYS #000000 black — no alternating, no light fills, every section uses neutral-primary (#000000)
- Primary buttons: brand background (#2A3FE5)
- Headings: heading text color (#FFFFFF)
- Body text: body text color (#9CA3AF)
- CTA links: fg-brand text color (#2A3FE5)
- Default borders: border-default (#2A3FE5), always dotted style, 4px width
- Status borders match intent: success → border-success, danger → border-danger, warning → border-warning
- Disabled: disabled background + fg-disabled text
- Accent palette uses Pac-Man ghost colors: red (Blinky), pink (Pinky), cyan (Inky), orange (Clyde), yellow (Pac-Man)

## Prohibited

- No raw hex/rgb values in component code — always use design tokens
- No brand text color for long-form paragraphs
- No accent text tokens (fg-purple, etc.) for body copy or navigation
- No brand/accent backgrounds for large layout surfaces (pages, sections) — background is always #000000
- No manual light/dark value swapping — let the CSS custom properties handle it
