import {
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpToLine,
  CheckCircle2,
  Focus,
  Lightbulb,
  MoveHorizontal,
  RotateCcw,
  ScanLine,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Badge } from '@/components/common/badge';
import { colors, radii, spacing } from '@/theme/tokens';
import type { GuidanceArrow, GuidanceResult } from '@/features/capture-guidance/types';
import { getLocalizedCorrectionInstruction, getLocalizedCorrectionLabel } from '@/features/localization/strings';
import { useTranslation } from '@/features/localization/use-translation';
import { useLocalizationStore } from '@/store/localization-store';

export function PositioningGuidanceOverlay({ result }: { result: GuidanceResult }) {
  const languageCode = useLocalizationStore((state) => state.preference?.languageCode);
  const t = useTranslation();
  const toneColor = result.visual.tone === 'ready' ? colors.green : result.visual.tone === 'blocking' ? colors.red : colors.amber;
  const guideColor = result.visual.tone === 'ready' ? colors.green : result.visual.tone === 'blocking' ? colors.red : colors.amber;
  const localizedMessage = getLocalizedCorrectionInstruction(result.correction, languageCode);
  const localizedLabel = getLocalizedCorrectionLabel(result.correction, languageCode);

  return (
    <View pointerEvents="none" style={styles.overlayRoot}>
      <View style={[styles.guideBox, { borderColor: guideColor }]}>
        <View style={[styles.ruleVertical, styles.ruleVerticalOneThird]} />
        <View style={[styles.ruleVertical, styles.ruleVerticalTwoThirds]} />
        <View style={[styles.ruleHorizontal, styles.ruleHorizontalOneThird]} />
        <View style={[styles.ruleHorizontal, styles.ruleHorizontalTwoThirds]} />
        <View style={[styles.corner, styles.cornerTopLeft]} />
        <View style={[styles.corner, styles.cornerTopRight]} />
        <View style={[styles.corner, styles.cornerBottomLeft]} />
        <View style={[styles.corner, styles.cornerBottomRight]} />
      </View>
      <View style={styles.guidance}>
        <View style={styles.guidanceTop}>
          <View style={[styles.iconBubble, { backgroundColor: `${toneColor}22` }]}>
            <GuidanceArrowIcon arrow={result.visual.arrow} color={toneColor} />
          </View>
          <View style={styles.guidanceText}>
            <AppText color={colors.white} variant="label">
              {localizedLabel}
            </AppText>
            <AppText color={colors.slate200} variant="small">
              {localizedMessage}
            </AppText>
          </View>
          <Badge label={result.blocksCapture ? t('qc.blocked') : t('common.ready')} tone={result.blocksCapture ? 'warning' : 'success'} />
        </View>
        <AppText color={colors.slate200} variant="caption">
          {t('qc.localFallback')} · {Math.round((result.confidence ?? 0) * 100)}% {t('qc.confidence')}
        </AppText>
      </View>
    </View>
  );
}

function GuidanceArrowIcon({ arrow, color }: { arrow: GuidanceArrow; color: string }) {
  switch (arrow) {
    case 'left':
      return <ArrowLeft color={color} size={24} />;
    case 'right':
      return <ArrowRight color={color} size={24} />;
    case 'up':
      return <ArrowUp color={color} size={24} />;
    case 'down':
      return <ArrowDown color={color} size={24} />;
    case 'closer':
      return <ArrowDownToLine color={color} size={24} />;
    case 'farther':
      return <ArrowUpToLine color={color} size={24} />;
    case 'straighten':
      return <RotateCcw color={color} size={24} />;
    case 'steady':
      return <MoveHorizontal color={color} size={24} />;
    case 'light':
      return <Lightbulb color={color} size={24} />;
    case 'focus':
      return <Focus color={color} size={24} />;
    case 'ready':
      return <CheckCircle2 color={color} size={24} />;
    default:
      return <ScanLine color={color} size={24} />;
  }
}

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 10,
    elevation: 10,
  },
  guideBox: {
    alignSelf: 'center',
    width: '82%',
    maxWidth: 520,
    aspectRatio: 4 / 3,
    position: 'relative',
    borderWidth: 2,
    borderRadius: radii.md,
    backgroundColor: 'rgba(15,23,42,0.04)',
    shadowColor: colors.ink,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 2,
  },
  ruleVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(15,23,42,0.44)',
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  ruleHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,23,42,0.44)',
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  ruleVerticalOneThird: {
    left: '33.333%',
  },
  ruleVerticalTwoThirds: {
    left: '66.666%',
  },
  ruleHorizontalOneThird: {
    top: '33.333%',
  },
  ruleHorizontalTwoThirds: {
    top: '66.666%',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: 'rgba(255,255,255,0.94)',
    shadowColor: colors.ink,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: radii.md,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: radii.md,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: radii.md,
  },
  cornerBottomRight: {
    right: -1,
    bottom: -1,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: radii.md,
  },
  guidance: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(15,23,42,0.78)',
  },
  guidanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidanceText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
});
