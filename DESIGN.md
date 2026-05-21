---
name: RPE Flow
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#55433b'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#887269'
  outline-variant: '#dbc1b7'
  surface-tint: '#98471a'
  primary: '#98471a'
  on-primary: '#ffffff'
  primary-container: '#f28c5a'
  on-primary-container: '#6a2700'
  inverse-primary: '#ffb694'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#5e5e5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#a7a7a6'
  on-tertiary-container: '#3b3c3c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb694'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3003'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#e3e2e1'
  tertiary-fixed-dim: '#c7c6c5'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#464746'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max-width: 1120px
  gutter: 24px
  margin-x: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-padding: 64px
---

## Brand & Style
The design system is engineered for high-performance coaching, prioritizing clarity, focus, and a sense of professional "flow." It targets elite athletic coaches who require data-rich environments that don't feel overwhelming. 

The aesthetic is a fusion of **Apple-inspired minimalism** and **Notion-inspired utility**. It utilizes a "warm-minimalist" approach, avoiding the sterile coldness of typical enterprise software in favor of an inviting, spacious environment that encourages daily usage. The interface should feel like a premium physical notebook—organized, high-quality, and intentional.

## Colors
The palette is anchored by a **warm white background** to reduce eye strain during long coaching sessions. The primary color is a **Premium Soft Orange**, chosen for its visibility and energy without being aggressive or oversaturated. 

Surface colors use a very light gray to create subtle distinction between the background and nested content. Semantic colors (Green, Yellow, Red) are desaturated to "soft" variants to ensure that high-fatigue alerts grab attention through hue rather than jarring intensity.

## Typography
This design system utilizes **Plus Jakarta Sans** across all levels to achieve a modern, approachable, yet geometric look. The typography relies on generous line heights and subtle negative letter-spacing on larger headings to mimic high-end editorial layouts.

Hierarchy is established through weight rather than just size. Headlines should feel grounded and sturdy, while body text remains light and breathable. For data-heavy coaching tables, use the `label-md` or `label-sm` tiers to maintain legibility at smaller scales.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy, centered in the viewport to maintain focus and prevent "eye-travel" fatigue. 

- **Navigation:** A single top-horizontal bar handles all top-level routing. No sidebars are used to maximize horizontal space for training data.
- **Grid:** A 12-column layout within a 1120px container. 
- **Rhythm:** An 8px linear scale drives all padding and margins. Use `stack-lg` (32px) for separating major card groups and `section-padding` (64px) for vertical whitespace between disparate content blocks.
- **Mobile:** On small screens, the container transitions to a fluid 1-column layout with 16px horizontal margins.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows**. This design system avoids harsh borders.

1.  **Level 0 (Background):** The warm white base (#FAFAFA).
2.  **Level 1 (Surfaces):** Very light gray (#F3F4F6) used for inset areas or secondary grouping.
3.  **Level 2 (Cards):** Pure white (#FFFFFF) containers. These represent the primary interactive modules.
4.  **Shadows:** Use a single, highly diffused shadow for Level 2 elements: `0 4px 20px -2px rgba(0, 0, 0, 0.05)`. The goal is for the shadow to feel like a soft glow rather than a hard drop, giving the UI a "lifted" feel from the page.

## Shapes
The shape language is defined by **Large Rounded Corners**, echoing the aesthetic of high-end consumer hardware.

- **Base Radius (rounded):** 0.5rem (8px) for buttons, inputs, and small widgets.
- **Large Radius (rounded-lg):** 1rem (16px) for standard cards and containers.
- **Extra Large Radius (rounded-xl):** 1.5rem (24px) for primary feature hero blocks or main dashboard modules.
- **Avatars:** Strictly circular (50% radius) to contrast against the softened rectangular grid of the rest of the UI.

## Components

### Buttons
Buttons are clean and flat. The **Primary Button** uses the Soft Orange background with white text. The **Secondary Button** uses a light gray background with the primary color as text. Both use a medium weight font and 0.5rem corner radius.

### Cards
Cards are the primary container for coaching data. They must have a pure white background, 1rem corner radius, and the standard ambient shadow. Content within cards should have at least 24px of internal padding to maintain the Notion-inspired spaciousness.

### Input Fields
Inputs use the `surface_hex` (#F3F4F6) as a background with no border in their default state. On focus, they transition to a white background with a 1px soft orange border.

### Avatars
Athlete avatars are always circular. Use high-resolution, "real-world" athlete imagery to maintain the professional, human-centric focus of the coaching app.

### RPE Indicators (Chips)
Use small, rounded chips for RPE (Rate of Perceived Exertion) values. The chip background should use the semantic fatigue colors (Green/Yellow/Red) with high-contrast dark text.

### Top Navigation
A slim, 64px tall bar at the top. Use a backdrop-blur (glassmorphism) effect if the navigation is sticky, allowing the warm background to bleed through slightly.