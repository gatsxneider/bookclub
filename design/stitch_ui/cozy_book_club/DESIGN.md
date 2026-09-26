---
name: Cozy Book Club
colors:
  surface: '#fcf9f4'
  surface-dim: '#dcdad5'
  surface-bright: '#fcf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ee'
  surface-container: '#f0ede9'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e5e2dd'
  on-surface: '#1c1c19'
  on-surface-variant: '#424842'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f3f0eb'
  outline: '#727972'
  outline-variant: '#c2c8c0'
  surface-tint: '#45664e'
  primary: '#32533c'
  on-primary: '#ffffff'
  primary-container: '#4a6b53'
  on-primary-container: '#c5eacc'
  inverse-primary: '#abcfb2'
  secondary: '#99462a'
  on-secondary: '#ffffff'
  secondary-container: '#fe9572'
  on-secondary-container: '#762c12'
  tertiary: '#793921'
  on-tertiary: '#ffffff'
  tertiary-container: '#975037'
  on-tertiary-container: '#ffd9cc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c7ecce'
  primary-fixed-dim: '#abcfb2'
  on-primary-fixed: '#01210f'
  on-primary-fixed-variant: '#2e4e37'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59e'
  on-secondary-fixed: '#390b00'
  on-secondary-fixed-variant: '#7a2f15'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59c'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#73341d'
  background: '#fcf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e5e2dd'
typography:
  display-hero:
    fontFamily: Noto Serif
    fontSize: 44px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 42px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Noto Serif
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Noto Serif
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
  body-quote:
    fontFamily: Noto Serif
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 32px
  body-quote-mobile:
    fontFamily: Noto Serif
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 28px
  body-reading:
    fontFamily: Noto Serif
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 30px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system crafts an intimate, tactile digital sanctuary for communal reading, literary discussion, and reflective note-taking. Inspired by the warmth of antique paperbacks, quiet corner libraries, afternoon sun over natural linen, and botanical tea nooks, the aesthetic blends Scandinavian hygge with contemporary East Asian editorial warmth.

### Emotional Target
- **Lyrical Calm:** Evoking the stillness of opening a brand-new or well-loved book; quiet, serene, unhurried.
- **Approachable Charm:** Friendly, soft, and lightly playful without feeling juvenile; inviting everyday readers, active book clubs, and thoughtful writers alike.
- **Literary Trust:** High-contrast readability, respectful hierarchy, and book-first layouts that honor long-form writing and markdown notes.

### Visual Style
A blend of **Tactile Editorial** and **Soft Modernism**:
- Natural paper ivory backdrops paired with herbal sage tones and warm baked terracotta highlights.
- Organic rounded silhouettes (`rounded-xl` to `rounded-2xl`) combined with delicate, whisper-soft warm shadows.
- Textual elevation built upon generous line height, literary serifs for excerpts, and clean geometric sans for utility controls.

## Colors

The palette draws directly from pressed botanicals, sunlit cream parchment, and sun-dried clay pottery. It balances sustained visual comfort during extended reading sessions with crisp semantic distinction.

### Light Mode Foundations
- **Canvas Base (`surface-ground`):** `#FAF7F2` (Warm Book Cream) — soft, glare-free background evoking cotton-rag paper.
- **Surface Elevation (`surface-card`):** `#FFFFFF` — clean contrast for reading cards, discussion bubbles, and floating panels.
- **Surface Muted (`surface-subtle`):** `#F5EFEB` — secondary containers, sidebars, and inactive tab strips.
- **Primary / Sage:**
  - Base: `#4A6B53` (Deep Forest Sage) — primary action triggers, active tabs, bookmark indicators.
  - Hover / Deep: `#3D5A45` — pressed states and high-contrast anchors.
  - Tint / Surface: `#E8EFE9` — selected chip backgrounds, alert highlights, active reading progress tracks.
- **Secondary / Terracotta & Peach:**
  - Base: `#D97757` (Cinnamon Terracotta) — badge highlights, favorite/like hearts, reading goals, urgent prompts.
  - Muted / Accent: `#E89274` — secondary badges, progress fill gradients.
  - Tint / Soft Peach: `#FDF1ED` — notification backdrops and member reaction tags.
- **Text & Neutral Tiers:**
  - `text-primary`: `#2D2825` (Deep Charcoal Walnut) — high legibility, avoiding harsh true blacks.
  - `text-secondary`: `#6E655F` (Roasted Hazel Muted) — supporting metadata, timestamps, author bylines.
  - `text-tertiary`: `#9C938B` (Warm Sandstone) — placeholders, inactive counters, subtle icons.
  - `border-subtle`: `#E6DED6` (Natural Woven Sand) — delicate dividers and container borders.

### Dark Mode (Nocturne Reading)
- **Canvas Ground:** `#1C221E` (Deep Nocturne Pine / Forest Charcoal).
- **Surface Card:** `#252D28` (Warm Night Moss).
- **Surface Raised:** `#2E3731` (Muted Card Layer).
- **Text Primary:** `#EAE5DC` (Crisp Warm Ivory).
- **Text Secondary:** `#A6A097` (Weathered Parchment Grey).
- **Borders:** `#36413A` (Subtle Pine Edge).
- **Primary Sage Dark:** `#739B7D` (Luminous Sprout).
- **Secondary Terracotta Dark:** `#E89274` (Luminous Clay).

## Typography

Typography prioritizes prolonged eye comfort and distinct dual-type role separation:
- **Literary & Narrative (Noto Serif):** Used for book titles, section headlines, reflective club prompts, book excerpts, and long-form markdown reading content. It provides rhythm and editorial gravity. (Fallbacks include KoPubWorld Batang and Nanum Myeongjo).
- **Interface & Utility (Plus Jakarta Sans):** Handles navigational elements, interactive controls, data tags, metrics, and short discussion comments. Its gentle curvature pairs naturally with organic round shapes. (Fallback to Pretendard / Inter).

### Markdown Specifications
- **Heading 1 (`#`):** Equivalent to `headline-lg`, accompanied by `margin-bottom: 1rem` and `margin-top: 2rem`.
- **Heading 2 (`##`):** Equivalent to `headline-md`, marked with subtle divider space.
- **Heading 3 (`###`):** Equivalent to `headline-sm`, tight and contextual.
- **Paragraphs (`p`):** Mapped to `body-reading`, enforced line-height of `1.75` for Korean and English character sets to avoid crowding.
- **Blockquotes (`>`):** Set in `body-quote`, rendered with a `3px` solid Sage Green (`#4A6B53`) left border, padded with `1rem` on the left, styled in italic or soft serif weight, nestled on a warm micro-tinted canvas (`#FAF7F2`).

## Layout & Spacing

The layout is built around an airy, calm reading experience that never feels congested. It employs a content-first hybrid grid system with maximum reading widths.

### Structure & Grids
- **Desktop (1200px+):** 12-column grid with `1.5rem` (24px) gutters and a max canvas width of `1280px`. Left rail (260px) for club shelves and reading goals; central column (680px max) for the primary reading/markdown stream; optional right rail (280px) for participant avatars, notes, and bookmark indexes.
- **Tablet (768px - 1199px):** 8-column grid with `1rem` gutters; navigation compresses to a top bar or collapsible drawer; central content expands smoothly.
- **Mobile (< 768px):** 4-column single-column flow with `1rem` side margins; bottom-sheet navigation ensures comfortable one-handed reading.

### Reading Rhythm
Long-form markdown prose strictly clamps to `68ch` (~640px to 720px) to safeguard optimal typographic eye-sweep. Vertical rhythm strictly follows an `8px` baseline grid, scaling margins dynamically between review chapters.

## Elevation & Depth

This design system avoids harsh, mechanical drop-shadows. Instead, elevation simulates soft afternoon daylight cascading onto deckled paper and linen surfaces using diffuse, warm-tinted ambients.

### Elevation Hierarchy
- **Level 0 (Flat / Inset):** `surface-ground` (`#FAF7F2`) with `1px solid #E6DED6`. Applied to page backgrounds, embedded markdown quote boxes, and inner status wells.
- **Level 1 (Resting Cards):** `surface-card` (`#FFFFFF`) with a delicate warm ambient shadow:
  - `box-shadow: 0 2px 8px -2px rgba(45, 40, 37, 0.05), 0 1px 3px rgba(45, 40, 37, 0.03);`
  - Border: `1px solid rgba(230, 222, 214, 0.8)`.
  - Intended for book summary cards, discussion list rows, and member cards.
- **Level 2 (Hover & Active Surfaces):**
  - `box-shadow: 0 8px 20px -4px rgba(74, 107, 83, 0.08), 0 3px 6px -2px rgba(45, 40, 37, 0.04);`
  - Used when hovering over book covers, interactive notes, and primary callout cards.
- **Level 3 (Overlays & Dialogs):**
  - `box-shadow: 0 16px 36px -8px rgba(45, 40, 37, 0.12), 0 4px 12px rgba(45, 40, 37, 0.04);`
  - Backdrop: `rgba(28, 34, 30, 0.35)` accompanied by a gentle `4px` blur for a soft, introspective atmosphere.

## Shapes

The shape system expresses warmth, approachability, and organic gentleness through generous curved perimeters.

### Radius Scale
- **Small (`rounded-md` / 8px):** Internal tags, tooltips, nested avatar borders, and code syntax blocks.
- **Medium (`rounded-lg` / 16px):** Form fields, interactive buttons, modal dialogs, and secondary card containers.
- **Large (`rounded-xl` / 24px):** Primary book display cards, review thread panels, and reading timeline containers.
- **Full (`rounded-full`):** Filter pills, reading status badges, avatar frames, bookmark buttons, and page progress indicators.

## Components

### 1. Buttons
- **Primary (Sage Forest):** Solid background `#4A6B53`, text `#FFFFFF`, radius `rounded-full` or `rounded-lg` (16px). Hover state transitions to `#3D5A45` with subtle `translateY(-1px)`.
- **Secondary (Terracotta Accent):** Solid background `#D97757`, text `#FFFFFF`. Used for key emotional triggers like "Join Discussion" or "Favorite Passage".
- **Tertiary (Paper Ghost):** Background `#F5EFEB`, text `#4A6B53`, border `1px solid #E6DED6`. Hover lifts to `#E8EFE9`.
- **Icon / Bookmark Trigger:** Circular `rounded-full` button with a gentle leaf/ribbon motif, changing from `#6E655F` to `#4A6B53` on toggle.

### 2. Chips & Status Badges
- **Reading Status Pills:**
  - *Reading:* `#E8EFE9` background with `#3D5A45` text and a mini sprout (`🌱`) icon.
  - *Finished:* `#FDF1ED` background with `#D97757` text and a mini open book (`📖`) icon.
  - *Want to Read:* `#F5EFEB` background with `#6E655F` text.
- **Category & Genre Tags:** Pill-shaped (`rounded-full`), height `28px`, text `label-sm`, subtle border `1px solid #E6DED6`.

### 3. Cards & Discussion Threads
- **Book Showcase Card:**
  - Surface `#FFFFFF` with `rounded-xl` (24px).
  - High-ratio book cover thumbnail with soft spine shadow, reading progress percentage bar in Terracotta `#E89274`, and title set in `headline-sm`.
- **Discussion / Markdown Note Card:**
  - Cream container with subtle sand border, avatar aligned with author metadata, rich text formatted in `body-reading`, and bottom bar featuring reply counts and heart reactions.

### 4. Input Fields & Textareas
- **Input Style:** Background `#FFFFFF` (or `#FAF7F2` when unfocused), text `text-primary`, border `1.5px solid #E6DED6`, `rounded-lg` (16px), padding `12px 16px`.
- **Focus State:** Border shifts smoothly to `#4A6B53` with a warm glow (`0 0 0 3px rgba(74, 107, 83, 0.15)`). No abrupt browser outlines.
- **Markdown Editor Area:** Generous line height (1.8), auto-expanding canvas, live preview toggle with dual serif quotation rendering.

### 5. Checkboxes, Radio & Toggles
- **Checkbox / Radio:** `20px` organic rounded square (`rounded-md`) or circle, border `2px solid #9C938B`.
- **Selected State:** Filled with `#4A6B53` containing a clean white checkmark.
- **Switch / Toggle:** Pill-track in `#E6DED6`, sliding knob in `#FFFFFF` with gentle shadow; active track transitions to `#4A6B53`.

### 6. Specialized Literary Components
- **Reading Progress Bar:** Slim `6px` track with `#E8EFE9` base, active fill in `#4A6B53` transitioning into `#D97757` at completion, capped with a subtle leaf dot.
- **Curated Quote Callout:** Centered serif card with oversized hanging decorative quotation marks in `#D97757` (20% opacity), accompanied by an author signature in italic small caps.