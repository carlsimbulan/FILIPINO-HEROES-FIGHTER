# Modals

> Dependencies: `colors.md`, `radius.md`, `shadows.md`, `buttons.md`, `inputs.md`

## Core Specs

### Overlay (Backdrop)
- Fixed, covers full screen
- Z-index: 40
- Background: black at 70% opacity
- Backdrop blur: small amount

### Content Container
- Background: neutral-primary
- Radius: 0px (base)
- Shadow: shadow-xl
- Padding: 20px
- Border: 4px dotted, border-default

## Anatomy

### Header
- Bottom border: 1px solid border-default
- Top corners: 0px
- Title: 16px, 400 weight, heading color, 'Press Start 2P'
- Close button: Ghost variant from `buttons.md`, 6px padding

### Body
- Vertical padding: 24px
- Vertical spacing between elements: 24px
- Text: 12px, 1.8 line-height, body color

### Footer
- Top border: 1px solid border-default
- Bottom corners: 0px

## Variants

### Default (Information)
Standard header + body + footer with primary/secondary action buttons.

### Pop-up (Confirmation)
Centered text, prominent icon, reduced padding:
- Body: 24px padding, text centered
- Icon: centered, 16px bottom margin, 48x48px, gray color

### Form Modal
Body contains inputs following `inputs.md`. Vertical spacing between form elements: 16px.

## Rules

- Backdrop covers full screen with fixed positioning
- Content: neutral-primary background, 0px radius, shadow-xl, 4px dotted border
- Header/Footer separated by 1px solid border-default borders
- Close button must be present and functional
- Accessibility: `role="dialog"`, implement focus trap in code
- Dark mode automatic via token system
