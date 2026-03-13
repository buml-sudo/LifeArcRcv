// LifeArc — sdílené styly
// Tovární funkce pro opakující se vzory. Každá bere ColorSet a vrací ViewStyle/TextStyle objekt.

import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ColorSet, fontSizes, fontWeights, radius, shadows, spacing } from './index';

// ---------------------------------------------------------------------------
// Kartičky
// ---------------------------------------------------------------------------

export function cardStyle(c: ColorSet): ViewStyle {
  return {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    ...shadows.card,
  };
}

// ---------------------------------------------------------------------------
// Inputy
// ---------------------------------------------------------------------------

export function inputStyle(c: ColorSet): ViewStyle & TextStyle {
  return {
    backgroundColor: c.surfaceElevated,
    borderWidth: 1.5,
    borderColor: c.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: c.text,
    fontSize: fontSizes.md,
    marginBottom: spacing.md,
  };
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function modalOverlayStyle(): ViewStyle {
  return {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: spacing.xl,
  };
}

export function modalContentStyle(c: ColorSet): ViewStyle {
  return {
    backgroundColor: c.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.modal,
  };
}

// ---------------------------------------------------------------------------
// Tlačítka
// ---------------------------------------------------------------------------

export function primaryButtonStyle(c: ColorSet): ViewStyle {
  return {
    backgroundColor: c.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.fab,
  };
}

export function ghostButtonStyle(c: ColorSet): ViewStyle {
  return {
    backgroundColor: c.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

export function dangerButtonStyle(c: ColorSet): ViewStyle {
  return {
    backgroundColor: c.dangerLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

// ---------------------------------------------------------------------------
// FAB
// ---------------------------------------------------------------------------

export function fabStyle(c: ColorSet): ViewStyle {
  return {
    backgroundColor: c.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center' as const,
    ...shadows.fab,
  };
}

// ---------------------------------------------------------------------------
// Chip / tag
// ---------------------------------------------------------------------------

export function chipStyle(c: ColorSet): ViewStyle & TextStyle {
  return {
    backgroundColor: c.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    color: c.primary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  };
}

// ---------------------------------------------------------------------------
// Segmented control — pill container
// ---------------------------------------------------------------------------

export function segmentContainerStyle(c: ColorSet): ViewStyle {
  return {
    flexDirection: 'row' as const,
    backgroundColor: c.surfaceElevated,
    borderRadius: radius.full,
    padding: 3,
  };
}

export function segmentOptionStyle(active: boolean, c: ColorSet): ViewStyle {
  return {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: 'center' as const,
    ...(active ? { backgroundColor: c.surface, ...shadows.card } : {}),
  };
}

export function segmentTextStyle(active: boolean, c: ColorSet): TextStyle {
  return {
    fontSize: fontSizes.sm,
    fontWeight: active ? fontWeights.bold : fontWeights.medium,
    color: active ? c.text : c.textSecondary,
  };
}

// ---------------------------------------------------------------------------
// Sekční nadpis (Settings styl)
// ---------------------------------------------------------------------------

export function sectionHeaderStyle(c: ColorSet): TextStyle {
  return {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: c.textTertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
  };
}

// ---------------------------------------------------------------------------
// Typografie — nadpisy
// ---------------------------------------------------------------------------

export function screenTitleStyle(c: ColorSet): TextStyle {
  return {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.extrabold,
    color: c.text,
  };
}

export function subtitleStyle(c: ColorSet): TextStyle {
  return {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: c.textSecondary,
    marginTop: 2,
  };
}

// ---------------------------------------------------------------------------
// Pomocná: icon badge (kulatý barevný odznak s ikonou)
// ---------------------------------------------------------------------------

export function iconBadgeStyle(bg: string, size = 44): ViewStyle {
  return {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: bg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

// ---------------------------------------------------------------------------
// Status chip (Open / Closed / Locked)
// ---------------------------------------------------------------------------

export function statusChipStyle(color: string): ViewStyle {
  return {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: color + '22',  // 13% opacity
  };
}

export function statusChipTextStyle(color: string): TextStyle {
  return {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color,
  };
}

// ---------------------------------------------------------------------------
// Shared StyleSheet pro nejběžnější layout prvky
// ---------------------------------------------------------------------------

export const layoutStyles = StyleSheet.create({
  flex1: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center', justifyContent: 'center' },
  absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
