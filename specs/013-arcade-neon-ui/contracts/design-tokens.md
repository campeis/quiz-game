# Contract: Design Token Interface

This document defines the stable TypeScript interface for the arcade-neon design token system. All components depend on this contract; changes must be backward-compatible or require updating all consumers simultaneously.

## tokens.ts Exports (stable interface)

```typescript
// Color tokens
export const colors: {
  background: string;     // Page root background
  surface: string;        // Card/panel backgrounds
  surfaceHover: string;   // Interactive surface hover state
  border: string;         // Default element borders
  borderDim: string;      // Subdued separators
  text: string;           // Primary text
  textSecondary: string;  // Muted/secondary text
  primary: string;        // Primary interactive color
  primaryHover: string;   // Primary hover state
  accent: string;         // Secondary accent color
  success: string;        // Correct/success state
  error: string;          // Error/incorrect state
  warning: string;        // Urgency/caution state
  winner: string;         // Rank-1 highlight
}

// Typography tokens — NOTE: fontFamily is split into fontDisplay + fontBody
export const typography: {
  fontDisplay: string;    // Display/heading typeface stack
  fontBody: string;       // Body/UI typeface stack
  sizes: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
    display: string;
  };
  weights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

// Spacing, borderRadius, breakpoints — unchanged from previous version
export const spacing: { xs: string; sm: string; md: string; lg: string; xl: string; xxl: string }
export const borderRadius: { sm: string; md: string; lg: string; xl: string; full: string }
export const breakpoints: { mobile: string; tablet: string; desktop: string }
```

## neon.ts Exports (stable interface)

```typescript
export type GlowIntensity = 'low' | 'medium' | 'high';

// Returns a CSS box-shadow string for neon border/container glow
export function neonBoxShadow(color: string, intensity?: GlowIntensity): string;

// Returns a CSS text-shadow string for neon text glow
export function neonTextShadow(color: string, intensity?: GlowIntensity): string;

// Returns a React.CSSProperties object including animation for pulsing glow
export function neonPulseStyle(color: string): React.CSSProperties;
```

## useReducedMotion.ts Export (stable interface)

```typescript
// Returns true when prefers-reduced-motion: reduce is active
export function useReducedMotion(): boolean;
```

## Breaking Change Policy

Any rename or removal of an exported token requires updating ALL components in a single atomic commit. Token additions are non-breaking. Splitting or restructuring token groups is a breaking change.
