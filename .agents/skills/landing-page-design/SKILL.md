---
name: landing-page-design
description: "Complete system for building high-converting Syn DAO and SynArc landing pages: intake questions, page structure, layout selection, conversion copywriting, SEO, plus strict visual rules for typography, hexagon geometry, cyan-to-purple neon accents, dark surfaces, spacing, corner radius, backgrounds, hero layout, icons, and motion. Use this skill whenever building, editing, styling, reviewing, or writing copy for ANY landing page, marketing site, web UI, page section, component, or prototype across the Syn DAO ecosystem, even when the user does not mention design, conversion, tokens, or a design system. Always consult it before choosing page sections, headlines, CTAs, fonts, font sizes, spacing values, border radii, background colors, icons, or transitions."
---

# Syn DAO Landing Page Design System

A landing page is not a general dashboard. A landing page wins one intent:

**one offer → one audience → one primary action.**

This skill has two halves. **Part A** decides what the page says and how it is structured. **Part B** is the non-negotiable visual system tailored for Syn DAO. Work through A before touching B.

## Scope

Apply to all Syn DAO web UI work: landing pages, protocol sites, dApp onboarding, components, dashboards, prototypes, and design reviews. When a rule here conflicts with a framework default, this file wins. When the user's explicit prompt conflicts with a rule, the user wins.

---

# PART A — Strategy and structure

## A1. Intake

Gather these before designing or writing. Ask only for what is missing, and ask in one batch rather than one question at a time.

**Purpose**
- What is the ONE primary action? (launch app, join DAO, deposit/stake, waitlist, read docs)
- What is the offer, exactly what do they get?
- What counts as a conversion? (wallet connect, governance vote, subscription, deposit)

**Audience and context**
- Who is the ICP? (Web3 native builders, DAO delegates, DeFi institutions, general users)
- What problem are they trying to solve?
- Top three objections (security audit doubts, complexity, liquidity risk)
- Traffic source: Twitter/X, search, governance forum, referral
- What do visitors already know when they land?

**Proof and assets**
- Proof points: TVL, transaction volume, audit badges, backer logos, active agents
- Product screenshots, interactive terminals, protocol metrics
- Security guarantees, multisig setup, open-source audit reports

**Constraints**
- Brand voice: high-conviction, technical precision, institutional-grade
- Visual direction: Syn DAO cyber-minimalist (deep obsidian, neon cyan/purple accents, hexagonal geometry)
- Mobile priority?

If the user cannot answer, make a reasonable assumption, state it in one line, and continue. Do not stall the build.

## A2. Page structure

**Above the fold (required)**
1. Headline: outcome plus audience
2. Subheadline: clarifies how and adds technical specificity
3. Primary CTA: clear verb plus destination ("Launch App", "Stake SYN", "Explore Governance")
4. One proof signal: audited TVL stat, active agent count, or audit partner badge
5. Hero visual: interactive app preview, glowing hexagon topology, or glassmorphic protocol terminal

**Mid page (the argument)**
6. Problem to solution: why legacy coordination fails vs. Syn DAO autonomous architecture
7. Benefits: three to five, outcome-driven metrics
8. How it works: three clear steps (e.g., Connect → Delegate → Automate)
9. Social proof: TVL metrics, partner protocols, security auditors (CertiK, OpenZeppelin)

**Bottom (objection handling)**
10. FAQ: six to eight high-impact questions (audits, custody, tokenomics)
11. Risk reversal: non-custodial, open-source contracts, multi-sig timelocks
12. Final CTA: identical to the hero CTA

Include the mandatory tagline reveal section from B11 in the mid-page argument, right after the hero metrics.

## A3. Layout selection

| Type | Use when |
|---|---|
| **A. Autonomous Hero + Protocol Stats** | Primary protocol launch. Clear hero preview with live network metrics. Most common for Syn DAO. |
| **B. Architecture Deep Dive** | Complex protocol mechanics requiring step-by-step education for validators/delegates. |
| **C. Token / Governance Minimal** | Targeted action page (airdrop claim, proposal voting, waitlist). |
| **D. Comparative Matrix** | Showing performance/yield advantages over traditional DAOs or multi-sigs. |

## A4. Conversion rules

- **One primary action above the fold.** Never display competing primary buttons. Secondary links use ghost/outline styling.
- **Write benefit first.** Features are what it does. Benefits are what the protocol achieves.
- **Be specific.**
  - ❌ "Next-generation decentralized coordination"
  - ✅ "Execute multi-agent treasury proposals in 12 seconds with zero slippage"
- **Reduce perceived risk.** Prominently display audit status, non-custodial architecture, and on-chain verifiability.

## A5. Copywriting

- **Headline formulas**:
  - "{Outcome} without {pain}"
  - "The Autonomous {category} for {audience}"
  - "Scale {protocol metric} with zero {friction}"
- **Button CTA**: Active verb + clear destination ("Connect & Stake", "View Agent Registry", "Enter SynArc"). Never "Submit" or "Click Here".
- **Banned filler words**: "revolutionize", "supercharge", "cutting edge", "effortless", "transform your workflow", "harness the power". State verifiable mechanisms instead.

## A6. Build order

Work section by section, in this sequence:
1. Hero & Navigation
2. Tagline Reveal
3. Protocol Metrics & Architecture
4. How It Works
5. Security & Proof
6. FAQ & Final CTA

---

# PART B — Visual system (Syn DAO Cyber-Minimalist)

Every visual value must resolve through these rules instead of being invented ad hoc.

## B1. Typography

### Font Families
- **Headings & Display:** `Space Grotesk` or `Geist`
- **Body & Interface:** `Geist` or `Inter`
- **Numbers, Code & Metrics:** `IBM Plex Mono` or `Geist Mono`

**Rules:**
- Never use italic fonts anywhere in the interface.
- Never use ultra bold weights (900 / black). Cap at semibold (`font-semibold`) or bold (`font-bold`).
- No hyphens in copy text.
- No orphaned words: apply `text-wrap: balance` for headings and `text-wrap: pretty` for body.

### Type Scale (Tailwind default)
Snap all font sizes to Tailwind’s scale:
- `text-xs` (12px) · `text-sm` (14px) · `text-base` (16px) · `text-lg` (18px) · `text-xl` (20px) · `text-2xl` (24px) · `text-3xl` (30px) · `text-4xl` (36px) · `text-5xl` (48px) · `text-6xl` (60px)

## B2. Spacing

Only use these spacing tokens:
- `2px`, `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `40px`, `48px`, `64px`, `80px`, `96px`

**Buttons:** 8px vertical padding, 16px horizontal padding (`py-2 px-4`).

## B3. Corner radius & Geometric Accents

- **Base Radius:** `rounded-lg` (8px) for buttons/inputs, `rounded-xl` (12px) for cards, `rounded-2xl` (16px) for major modal containers.
- **Nested radius formula:** `inner radius = outer radius - gap` (when gap < 32px).
- **Syn DAO Hexagon Geometry:**
  - Used for icon containers, status pills, or node badges.
  - CSS Polygon Clip: `clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)`.
  - Subtle background honeycomb/hex grid patterns at low opacity (`rgba(0, 242, 254, 0.03)`).

## B4. Colors and Surfaces

### Canvas & Surfaces (Obsidian Dark Theme)
- **Deep Canvas Background:** `#05080F` (Base void)
- **Elevated Card Surface:** `#0B111C`
- **Stat / Inset Surface:** `#080C14`
- **Active / Hover Surface:** `#0F1620`

### Borders
- **Standard Card Border:** `#151C29` (1px solid all around; never single-sided)
- **Elevated Border:** `#1B2536`
- **Subtle Highlight:** `rgba(255, 255, 255, 0.07)`

### Syn DAO Neon Accents
- **Cyan Neon:** `#00F2FE` (Electric Cyan)
- **Brand Blue:** `#2F6FFF` / `#4F8BFF`
- **Purple Neon:** `#7F00FF` / `#9D4EDD` (Deep Cyber Purple)
- **Positive / Verified:** `#22C55E`
- **Warning / Alert:** `#EF4444`

*Note: Backgrounds remain flat obsidian. Neon gradients are applied strictly to text, borders (via border-beam), or subtle glow halos.*

## B5. Hero section

### Heading Gradients
- Primary headline gradient: `#F5F7FA` transitioning into `#00F2FE` or `#4F8BFF` → `#9D4EDD` on keyword highlights.
- Max width capped at **680px** with natural phrase breaks.

### Hero Layout
- Floated top navigation bar with translucent obsidian glass (`bg-[#0B111C]/80 backdrop-blur-md`).
- Primary CTA with neon border glow or cyan-to-purple gradient fill.
- Live protocol metrics strip directly below hero CTA (e.g. Total Value Secured, Agents Active, Epoch Time).

## B6. Icons

- **Use:** Phosphor, Lucide, or Solar icons.
- **Never use:** Material Symbols, Material Icons, or generic emojis.

## B7. Motion and Animation

- **Base curve:** `ease-[cubic-bezier(0.22,1,0.36,1)]` with `duration-500` for layout/position changes.
- **Color/Hover:** `duration-300` (never under 200ms).
- **Animate only:** `transform` and `opacity`. Never animate `top`, `left`, `width`, or `height`.
- **Reduced motion:** Replace movement with standard opacity fade.

## B8. Content realism

- Draft genuine protocol copy: verifiable mechanism names, real consensus flows, and plausible wallet/treasury metrics.
- Avoid generic web3 buzzwords: quantify throughput, latency, staking APR, and audit dates.

## B9. Component States

Every interactive element must include:
- **Hover:** border highlight shift to `#00F2FE` or `#2F6FFF`, slight background elevation.
- **Active:** `scale(0.98)` or `translateY(1px)`.
- **Focus:** accessible focus ring with `ring-2 ring-[#00F2FE]/50`.
- **Loading:** skeleton loaders matching the exact card geometry.

## B10. Tagline reveal section (Mandatory)

Every Syn DAO landing page includes a standalone large-type section highlighting the core protocol mission.
- **Typography:** `text-4xl` to `text-6xl`, max width 720px.
- **Animation:** Text starts at 25% opacity (`text-white/25`). As it scrolls into view, each word activates sequentially to full contrast (`text-white` or cyan accent) using the B7 bezier curve.

---

# Syn DAO Quick Checklist

- [ ] One clear intent and one primary CTA above the fold
- [ ] Obsidian dark palette (`#05080F`, `#0B111C`) with `#00F2FE` → `#7F00FF` neon accents
- [ ] Hexagonal geometry used for badges, nodes, or decorative topology
- [ ] Fonts: Space Grotesk (headings), Geist/Inter (body), IBM Plex Mono (metrics)
- [ ] No background gradients; all cards bordered all the way around
- [ ] Tagline reveal section included with word-by-word scroll activation
- [ ] All transitions powered by `cubic-bezier(0.22,1,0.36,1)`
- [ ] Full state handling (hover, active, focus-visible) on all controls
