/**
 * InBody Tracker — Dark-mode design system.
 *
 * Import individual tokens for tree-shaking:
 *   import { Colors, Spacing, Radius, Typography, CardStyle } from '../theme';
 *
 * Font names declared here are loaded in App.tsx via useFonts().
 * Do not use a font name in a StyleSheet until `fontsLoaded === true`.
 */

// ─── Colour Palette ──────────────────────────────────────────────────────────

export const Colors = {
  // ── Backgrounds ────────────────────────────────────────────────────────────
  background:      '#0D0F14',   // near-black canvas
  surface:         '#161B24',   // bottom sheet / screen surface
  card:            '#1E2533',   // elevated card
  surfaceElevated: '#252D3D',   // tooltip / popover
  overlay:         'rgba(0,0,0,0.65)',

  // ── Brand / Accent ─────────────────────────────────────────────────────────
  primary:         '#00E5FF',   // cyan – primary CTA, sparklines, active tabs
  primaryDim:      'rgba(0,229,255,0.12)', // subtle cyan tint for backgrounds
  primaryDark:     '#00B8CC',   // pressed state
  accent:          '#00E5FF',   // alias – kept for compat with existing screens

  // ── Status ─────────────────────────────────────────────────────────────────
  success:         '#00C97B',   // normal / healthy range (green)
  successDim:      'rgba(0,201,123,0.15)',
  warning:         '#FF6B35',   // over / elevated values (orange-red)
  warningDim:      'rgba(255,107,53,0.15)',
  error:           '#FF4560',   // critical / delete actions
  errorDim:        'rgba(255,69,96,0.15)',
  info:            '#5B8AF7',   // informational blue

  // ── Gold ───────────────────────────────────────────────────────────────────
  gold:            '#FFB830',   // InBody score / achievements

  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary:     '#F0F4FF',   // headings, values
  textSecondary:   '#6B7A99',   // labels, subtitles, muted UI
  textDisabled:    '#3A4258',
  textInverse:     '#0D0F14',   // text on light/cyan buttons

  // ── Borders ────────────────────────────────────────────────────────────────
  border:          '#252D3D',
  borderSubtle:    '#1C2230',

  // ── Chart colour ramp (ordered for multi-series) ───────────────────────────
  chart: [
    '#00E5FF',  // cyan
    '#00C97B',  // green
    '#FFB830',  // gold
    '#FF6B35',  // orange-red
    '#5B8AF7',  // blue
    '#C77DFF',  // purple
  ],

  transparent: 'transparent',
} as const;

// ─── Spacing Scale ───────────────────────────────────────────────────────────
// Base unit: 4 px

export const Spacing = {
  xxs: 2,
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const Radius = {
  sm:   8,
  md:   12,
  lg:   20,
  xl:   28,
  full: 9999,
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────

/**
 * Font family name strings that must be passed to useFonts() in App.tsx.
 * Each value matches exactly the key used in the expo-google-fonts font map.
 */
export const FontFamily = {
  /** Space Grotesk — body text, labels, UI copy */
  body:       'SpaceGrotesk_400Regular',
  bodyMedium: 'SpaceGrotesk_500Medium',
  bodySemi:   'SpaceGrotesk_600SemiBold',
  bodyBold:   'SpaceGrotesk_700Bold',

  /** Bebas Neue — large stat numbers, hero values */
  stat:       'BebasNeue_400Regular',

  /** Fallback when fonts are not yet loaded */
  system:     'System',
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 64,
} as const;

export const LineHeight = {
  tight:   1.15,
  normal:  1.5,
  relaxed: 1.75,
} as const;

/**
 * Pre-composed text style objects.
 * Usage: <Text style={Typography.statLarge}>70.2</Text>
 */
export const Typography = {
  /** Big stat numbers — Bebas Neue */
  statHero: {
    fontFamily: FontFamily.stat,
    fontSize: FontSize['6xl'],
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  statLarge: {
    fontFamily: FontFamily.stat,
    fontSize: FontSize['4xl'],
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  statMedium: {
    fontFamily: FontFamily.stat,
    fontSize: FontSize['3xl'],
    color: Colors.textPrimary,
    letterSpacing: 1,
  },

  /** Screen headings — Space Grotesk Bold */
  heading1: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize['3xl'],
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  heading2: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  heading3: {
    fontFamily: FontFamily.bodySemi,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
  },

  /** Body / UI text — Space Grotesk Regular */
  body: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  bodySmall: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  caption: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textDisabled,
  },
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 12,
  },
  /** Cyan glow — for highlighted / active cards */
  glow: {
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ─── Shared Card Style ───────────────────────────────────────────────────────
/**
 * Drop-in card base style.
 * Usage: <View style={[CardStyle, { ... your overrides ... }]}>
 */
export const CardStyle = {
  backgroundColor: Colors.card,
  borderRadius:    Radius.lg,
  borderWidth:     1,
  borderColor:     Colors.border,
  padding:         Spacing.lg,
  ...Shadow.md,
} as const;

/**
 * Highlighted card — adds a cyan border + glow for "latest" / "active" items.
 */
export const CardStyleActive = {
  ...CardStyle,
  borderColor: Colors.primary,
  ...Shadow.glow,
} as const;

// ─── Navigation Theme ────────────────────────────────────────────────────────
/**
 * Pass to <NavigationContainer theme={NavTheme}>.
 * Keeps React Navigation's internal surfaces consistent with our palette.
 */
export const NavTheme = {
  dark: true,
  colors: {
    primary:        Colors.primary,
    background:     Colors.background,
    card:           Colors.surface,
    text:           Colors.textPrimary,
    border:         Colors.border,
    notification:   Colors.warning,
  },
  fonts: {
    regular: { fontFamily: FontFamily.body, fontWeight: '400' as const },
    medium:  { fontFamily: FontFamily.bodyMedium, fontWeight: '500' as const },
    bold:    { fontFamily: FontFamily.bodyBold, fontWeight: '700' as const },
    heavy:   { fontFamily: FontFamily.bodyBold, fontWeight: '900' as const },
  },
} as const;

// ─── Convenience default export ───────────────────────────────────────────────

const Theme = {
  Colors,
  Spacing,
  Radius,
  FontFamily,
  FontSize,
  LineHeight,
  Typography,
  Shadow,
  CardStyle,
  CardStyleActive,
  NavTheme,
} as const;

export default Theme;
