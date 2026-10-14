import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BASE_WIDTH = 390; // iPhone 14/15 logical width
const CONTENT_MAX_WIDTH = 1100;

export interface ResponsiveInfo {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  /** Width actually used by content (capped on large tablets). */
  contentWidth: number;
  /** Photo grid column count for the current width. */
  columns: number;
  insets: ReturnType<typeof useSafeAreaInsets>;
  /** Scales a size relative to a 390pt-wide phone, clamped to stay sane. */
  scale: (size: number) => number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const contentWidth = Math.min(width, CONTENT_MAX_WIDTH);
  const columns = contentWidth >= 960 ? 5 : contentWidth >= 720 ? 4 : contentWidth >= 520 ? 3 : 2;
  const factor = Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.25);

  return {
    width,
    height,
    isLandscape: width > height,
    isTablet: Math.min(width, height) >= 600,
    contentWidth,
    columns,
    insets,
    scale: (size) => Math.round(size * factor),
  };
}
