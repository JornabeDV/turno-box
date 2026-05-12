# Turno box — Tactical Training Operating System

## Brand Positioning

Turno box is a competitive training operating system for serious athletes.

It is not a generic fitness app. The interface must feel like mission-critical software used by elite competitors to manage their training schedule, track their capacity, and execute their performance protocol.

The emotional direction is: **"You are logging into a system that takes your training as seriously as you do."**

### Interface Qualities

- Precise
- Disciplined
- Technical
- High-agency
- Performance-oriented
- Intentional
- Raw (not polished-smooth, not friendly-cuddly)

### Avoid

- Generic SaaS appearance
- Mobile-template aesthetics
- Gaming RGB culture
- Cyberpunk visuals
- Esports overlays
- Visual noise
- Crowded dashboards
- Glassmorphism / blur effects
- Soft shadows / glows
- Rounded pill shapes
- Calm / airy / spa-like interfaces

---

## Core Design Philosophy

### Tactical Minimalism

Every visual decision prioritizes:

- Hierarchy through scale and weight, not color
- Compartmentalization through visible borders, not shadows
- Information density where it matters (data, schedules, metrics)
- Deliberate negative space around macro-typography
- Mechanical rigidity — everything aligns to a grid

The system should feel:

- Architectural
- Systematic
- Intentionally raw
- Like a declassified blueprint or military terminal

### Typography-First Hierarchy

Before color communicates importance, typography does. Display text is massive, condensed, uppercase. Data text is small, monospace, uppercase. Body text is minimal or absent.

---

## Visual Identity

### Color System

All colors simulate physical media or primitive emissive displays. No gradients, no soft drop shadows, no modern translucency.

| Token | Hex | Role |
|---|---|---|
| **Ocean Obsidian** | `#0A1F2A` | Primary background — page canvas |
| **Deep Teal** | `#0E2A38` | Card/container surfaces |
| **Panel Teal** | `#143D52` | Hover states, subtle separators |
| **Border Teal** | `#1A4A63` | All visible 1px borders |
| **Tangerine Tango** | `#F78837` | Primary CTA, active states, key highlights, accents |
| **Teal Tide** | `#27C7B8` | Success states, utility indicators, secondary links, stats |
| **Phosphor White** | `#EAEAEA` | Primary text |
| **Muted Terminal** | `#6B8A99` | Secondary text, metadata, placeholders |
| **Danger Red** | `#E61919` | Errors, critical states, full classes |

**Rules:**
- Background never uses pure black (`#000000`). Ocean Obsidian is the darkest surface.
- Accent colors (Tangerine, Teal Tide) are used sparingly. Tangerine is reserved for actions and primary emphasis only.
- Teal Tide is the only "positive" color. Never use green.
- Danger Red is the only "negative" color. Never use rose/pink.

### Typography System

#### Display / Structural (Macro-Typography)

- **Font:** Oswald (Google Fonts)
- **Weights:** 400 (labels, nav), 500 (subheaders), 700 (headlines, CTAs, prices)
- **Scale:** Massive for headlines, using fluid sizing where appropriate
- **Tracking:** Tight (`-0.02em` to `-0.03em`), forcing glyphs into solid blocks
- **Line-height:** Compressed (`0.85` to `0.95`)
- **Casing:** Exclusively UPPERCASE for all display text
- **Usage:** Headlines, page titles, CTA buttons, prices, greetings, section headers

#### Data / Telemetry (Micro-Typography)

- **Font:** JetBrains Mono (Google Fonts)
- **Weights:** 400 (data), 500 (labels)
- **Scale:** Fixed and small (`10px` to `14px` / `0.625rem` to `0.875rem`)
- **Tracking:** Generous (`0.05em` to `0.08em`) to simulate terminal matrix spacing
- **Line-height:** Standard (`1.2` to `1.4`)
- **Casing:** Exclusively UPPERCASE
- **Usage:** Metadata, navigation labels (mobile), unit IDs, timestamps, cupos, badges, validity periods, system status

#### Body / UI

- **Font:** Oswald 400–500
- **Scale:** `14px` to `16px`
- **Casing:** Sentence case allowed only for long-form descriptions
- **Usage:** Descriptions, helper text, form labels

### Shape Language

- **Default radius:** `0px` — absolute rejection of curvature for mechanical rigidity
- **Exceptions:** `2px` for inputs, `4px` for small badges only
- **No pill shapes.** No large rounded corners.
- **No border-radius on cards, buttons (except 2px), modals, or containers.**

### Elevation & Depth

Depth is created using:
- Tonal layering (Ocean Obsidian → Deep Teal → Panel Teal)
- Visible 1px solid borders (`#1A4A63`)
- 2px solid accent borders for emphasis (left border on cards)

**Strictly prohibited:**
- Soft shadows
- Glow effects
- Backdrop blur / glassmorphism
- Neumorphism
- Floating card aesthetics

---

## Layout Philosophy

### The Blueprint Grid

- Strict adherence to CSS Grid and Flexbox architectures
- Elements are anchored precisely, not floating
- Full-width compartments on mobile
- Generous internal padding within bordered containers (`16px` to `24px`)

### Visible Compartmentalization

- Extensive use of solid borders (`1px solid #1A4A63`) to delineate zones
- Horizontal rules (`<hr>` or `border-t`) frequently span full width to segregate operational units
- Cards rely on borders + tonal separation, never shadows

### Bimodal Density

- **High density:** Tightly packed monospace metadata (cupos, horarios, badges)
- **Low density:** Vast negative space framing macro-typography (greetings, titles)

---

## Motion System

Animations must feel fast, dry, and mechanical:

- **Duration:** 150ms default, 200ms max
- **Easing:** `ease-out` or `cubic-bezier(0.32, 0.72, 0, 1)` (snappy, no bounce)
- **Properties:** Only `opacity` and `transform`
- **Feedback:** `scale(0.98)` on active/press states
- **Stagger:** Cascading reveals for lists (40ms increments)

**Prohibited:**
- Bounce animations
- Elastic movement
- Dramatic scaling
- Slow fades (>300ms)
- Spring physics (too organic)

---

## Component Guidelines

### Buttons

**Primary:**
- Background: Tangerine Tango (`#F78837`)
- Text: Ocean Obsidian (`#0A1F2A`)
- Font: Oswald 700, uppercase, tracking wide
- Border-radius: `0px` (or `2px` max)
- No shadow, no glow
- Full-width on mobile

**Secondary / Ghost:**
- Background: transparent
- Border: `1px solid #1A4A63`
- Text: Phosphor White
- Font: Oswald 500, uppercase

**Outline Accent:**
- Background: transparent
- Border: `1px solid #F78837`
- Text: Tangerine Tango
- Font: Oswald 500, uppercase

**Danger:**
- Border: `1px solid #E61919`
- Text: Danger Red
- Background: transparent or `#E619190D`

### Inputs

- Background: Ocean Obsidian (`#0A1F2A`)
- Border: `1px solid #1A4A63`
- Text: Phosphor White
- Placeholder: Muted Terminal
- Focus: border-color Tangerine Tango, no ring, no glow
- Icon prefix: left-aligned, Muted Terminal color
- Labels: Oswald 500, uppercase, Muted Terminal
- Border-radius: `2px`

### Cards

- Background: Deep Teal (`#0E2A38`)
- Border: `1px solid #1A4A63`
- Accent border-left: `2px solid #F78837` or `#27C7B8` for emphasis
- Border-radius: `0px`
- Padding: `16px` to `24px`
- No shadow

### Badges

- Font: JetBrains Mono, uppercase, `10px` to `11px`
- Tracking: `0.05em`
- Border-radius: `4px` (only exception to 0px rule)
- Background: transparent or subtle tint
- Border: `1px solid` matching badge color

### Tables & Lists

- No excessive borders — rely on row padding and tonal separation
- Row height: generous (`48px`+)
- Headers: Oswald 500, uppercase, Muted Terminal
- Data: JetBrains Mono, uppercase

---

## Navigation

### Bottom Nav (Mobile)

- Background: Ocean Obsidian
- Border-top: `1px solid #1A4A63`
- No blur, no shadow, no rounded corners
- Labels: Oswald 500, uppercase, `10px`
- Icons: Phosphor weight "regular", `24px`
- Active state: background Tangerine Tango, text Ocean Obsidian (solid block, not just color change)
- Items: ARENA (Trophy), CLASSES (Calendar), ABONOS (ShoppingCart), PROFILE (User)

### Header

- Background: Ocean Obsidian
- Border-bottom: `1px solid #1A4A63`
- No blur
- Logo: "Turno box" text in Oswald 700, Tangerine Tango, uppercase
- No image logo

---

## Iconography

- **Library:** Phosphor Icons (already installed)
- **Weight:** Regular or Bold. Never Fill.
- **Size:** `20px` to `24px`
- **Color:** Inherit from text color
- **Style:** Geometric, minimal, utilitarian

---

## Anti-Patterns (Strictly Banned)

- Glassmorphism, backdrop-blur, frosted glass
- Soft shadows, drop shadows, glow effects
- Border-radius > 4px on any element
- Pill-shaped buttons or badges
- Gradients of any kind
- Neon / RGB / purple / blue neon accents
- Emojis
- Generic placeholder names ("John Doe")
- Fake round numbers ("99.99%")
- AI copywriting clichés ("Elevate", "Seamless", "Unleash")
- Filler UI text: "Scroll to explore", bouncing chevrons
- Inter font
- Generic serif fonts
- Pure black (`#000000`) backgrounds
- Thin/light font weights (<400) for display text
- Centered hero layouts
- 3-column equal card grids

---

## TailwindCSS Guidelines

- Use `@theme inline` tokens (Tailwind v4)
- Prefer `grid` + `flex` layouts
- Semantic spacing
- Reusable component structure
- Design tokens via CSS variables
- Max-width containers
- `min-h-[100dvh]` never `h-screen`

Avoid:
- Arbitrary values except for one-off accents
- Random spacing
- Inconsistent padding
- Hardcoded colors (use tokens)
- Deeply nested wrappers

---

## Responsive Philosophy

Mobile-first. All layouts are designed for mobile viewport first, then expand to desktop.

- Full-width compartments on mobile
- Single column default
- Touch targets minimum `44px`
- Typography scales via `clamp()`
- Bottom nav on mobile, sidebar consideration on desktop (future)

---

## Output Requirements

When generating or refactoring UI:

1. Analyze visual hierarchy first.
2. Apply typography before color.
3. Use borders for structure, not shadows.
4. Keep everything uppercase where specified.
5. Maintain 0px border-radius default.
6. Keep functionality intact.
7. Think like a systems engineer designing a dashboard for operators.

Visual references:
- Military HUD interfaces
- Declassified technical blueprints
- 1970s–80s mainframe terminals
- Swiss industrial print manuals

But maintain Turno box unique identity: a training OS, not a generic terminal.
