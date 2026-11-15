// Tailwind theme for ICG. Maps utility names to design/tokens.css (rules: /DESIGN.md).
// For the Next.js build, copy `theme.extend` into its Tailwind config.
tailwind.config = {
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: "var(--color-night)", end: "var(--color-night-end)" },  // .bg-night also gets the gradient from tokens.css
        surface: { DEFAULT: "var(--color-surface)", raised: "var(--color-surface-raised)" },
        line: "var(--color-line)",
        "on-dark": { DEFAULT: "var(--color-text-on-dark)", muted: "var(--color-muted-on-dark)" },
        marigold: { DEFAULT: "var(--color-marigold)", bright: "var(--color-marigold-bright)", on: "var(--color-on-marigold)" },
        paper: "var(--color-paper)",
        card: { DEFAULT: "var(--color-card)", hover: "var(--color-card-hover)" },
        ink: { DEFAULT: "var(--color-ink)", muted: "var(--color-ink-muted)", faint: "var(--color-ink-faint)" },
        amber: "var(--color-amber)",
        rule: "var(--color-rule)",
        error: { DEFAULT: "var(--color-error)", soft: "var(--color-error-soft)" },
        disabled: { bg: "var(--color-disabled-bg)", text: "var(--color-disabled-text)" },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      borderRadius: { xs: "var(--radius-xs)", sm: "var(--radius-sm)", pill: "var(--radius-pill)" },
      maxWidth: { container: "var(--container)" },
    },
  },
};
