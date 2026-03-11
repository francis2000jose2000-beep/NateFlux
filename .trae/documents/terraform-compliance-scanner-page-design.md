# Page Design Specification (Desktop-first)

## Global Styles
- Theme: light by default.
- Layout width: centered container (max-w-6xl) with generous whitespace.
- Design tokens
  - Background: `slate-50`
  - Surface/cards: `white` with `slate-200` border
  - Text: `slate-900` primary, `slate-600` secondary
  - Primary action: `indigo-600` (hover `indigo-700`)
  - Status colors: pass `emerald-600`, fail `rose-600`, warn/high `amber-600`
- Typography
  - Page title: text-2xl font-semibold
  - Section title: text-lg font-semibold
  - Body: text-sm / text-base depending on density
- Interaction states
  - Buttons: focus ring visible (`focus-visible:ring-2 ring-indigo-400`)
  - Inputs: validation styles for error (`border-rose-500` + inline error text)
  - Tables: row hover highlight (`slate-50`)

## Page: Scan & Report Page
### Meta Information
- Title: “Terraform Compliance Scanner”
- Description: “Clone a public GitHub repo, scan Terraform, export a typed compliance report.”
- Open Graph: title/description same as above; type “website”.

### Layout
- Primary layout: CSS Grid for desktop.
  - Top header row (full width)
  - Main content split: left column “Scan Configuration” (fixed-ish width) + right column “Report” (flexible)
- Spacing: 24–32px section gaps; 12–16px intra-component spacing.
- Responsive behavior
  - Desktop (default): 2-column grid (config left, report right)
  - Tablet/small: collapses to single column with config above report

### Page Structure
1. Header
2. Main grid
   - Left: Scan Configuration card stack
   - Right: Report Summary + Findings + Export
3. Footer (minimal)

### Sections & Components
#### 1) Header (sticky optional)
- Left: product name “Terraform Compliance Scanner”
- Right: small text link “What is scanned?” (opens inline help modal/accordion; purely informational)

#### 2) Scan Configuration (Left column)
- Card: “Repository”
  - Text input: GitHub repo URL (placeholder example)
  - Optional inputs (collapsed by default):
    - Ref (branch/tag/SHA)
    - Subpath (folder)
  - Inline validation messages
- Card: “Scanner”
  - Radio/select: “Mock” (default), “Checkov (if available)”
  - Helper text: explains that Checkov requires server runtime availability
- Card: “Run”
  - Primary button: “Scan now”
  - Secondary: “Reset” (clears report + form)
  - Progress indicator:
    - Stepper: clone → discover → scan → report
    - Duration timer (optional)
  - Error banner area (only visible on error)

#### 3) Report Area (Right column)
- Empty state (before first scan)
  - Illustration/icon + short instructions
- Report Summary panel (after scan)
  - Key metrics: files scanned, passed/failed/skipped, highest severity
  - Metadata: repo, ref, scanner used, finished timestamp
  - Overall status badge: PASS/FAIL (fail if any failed finding)
- Findings section
  - Toolbar:
    - Search box (filter by file path / check id / message)
    - Dropdown filters: status, severity
  - Table columns:
    - Status badge
    - Severity
    - Check ID + title
    - File path (monospace) + line range
    - Message (truncated with expand row)
  - Row expand: shows remediation and full message
- Export section
  - Buttons:
    - “Copy JSON”
    - “Download JSON” (filename includes repo + timestamp)
  - Small note: “Use this JSON in CI pipelines.”

#### 4) Footer
- Minimal: “Built for on-demand scanning; temp files are always cleaned up.”