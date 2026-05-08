# UI/UX & Styling Guidelines

This document serves as the absolute source of truth for the visual identity of the Event Booking Platform. All Agents must adhere to these rules for every component and page created.

## 1. Core Philosophy
- **Modern Professionalism:** Clean, high-contrast, and trustworthy. 
- **Anti-Vibe-Coded:** Avoid "trendy" AI aesthetics (no neon glows, no excessive glassmorphism, no rainbow gradients, no purple/pink "saas" vibes).
- **Mobile-First:** Every UI element must be responsive by default, using Tailwind's `md:`, `lg:` prefixes.

## 2. Color Palette (Strict HEX Codes)
- **Primary Dark (Brand Green):** `#172d13`
  - Usage: Main text, headings, dark backgrounds, sidebar headers.
- **Accent (Brand Orange):** `#d76f30`
  - Usage: Primary Buttons (CTAs), active navigation links, important alerts, highlights.
- **Secondary (Soft Green):** `#6bb77b`
  - Usage: Success states, secondary buttons, subtle borders, soft backgrounds.
- **Surface Colors:**
  - Background: White (`#ffffff`) or very light gray (`#f9fafb`).
  - Borders/Inputs: Light slate (`#e2e8f0`).

## 3. Component Standards (shadcn/ui based)
- **Buttons:** - Primary: Background `#d76f30`, text white. Rounded corners (default shadcn `md`).
  - Secondary: Background `#6bb77b` or outline with `#172d13`.
- **Inputs:** - Minimalist style. Focus ring color should be `#6bb77b`.
- **Cards:** - White background, very subtle border, no heavy shadows (use `shadow-sm`).
- **Typography:**
  - Headings: Bold, color `#172d13`.
  - Body text: Color `#172d13` (for high readability) or Slate-600 for secondary info.

## 4. Layout Rules
- Use a consistent Max-Width for page content (e.g., `max-w-7xl`).
- Padding: Use standard Tailwind spacing (e.g., `p-4` for mobile, `p-8` for desktop).
- Navigation: Clean, sticky top-bar or simple sidebar.

## 5. Implementation Instructions for Agents
- Always check `tailwind.config.ts` to ensure the brand colors are mapped to CSS variables.
- When generating new pages, use the brand colors defined above instead of default Tailwind colors like `blue-600` or `indigo-500`.