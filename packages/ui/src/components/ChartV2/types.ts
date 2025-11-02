/**
 * Types for ChartV2 component
 */

export enum ChartType {
  LINE = 'line',
  AREA = 'area',
  BAR = 'bar',
}

export enum ChartPeriod {
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1M',
  YEAR = '1Y',
  ALL = 'ALL',
}

export interface ChartDataPoint {
  timestamp: number
  value: number
  // Optional additional values for tooltip
  additionalValues?: Record<string, number | string>
}

export interface ChartConfig {
  /** Chart type: line, area, or bar */
  type?: ChartType
  /** Show gradient fill for area charts */
  showGradient?: boolean
  /** Primary color (hex or named color from theme) */
  color?: string
  /** Secondary color for gradients */
  gradientColor?: string
  /** Enable smooth curve interpolation */
  smooth?: boolean
  /** Show grid lines */
  showGrid?: boolean
  /** Height of chart in pixels */
  height?: number
  /** Custom tooltip formatter */
  tooltipFormatter?: (params: any) => string
  /** Custom axis label formatter */
  axisLabelFormatter?: (value: number, period: ChartPeriod) => string
  /** Enable animations */
  enableAnimations?: boolean
}

export interface ChartProps {
  /** Chart data points */
  data: ChartDataPoint[]
  /** Current period selection */
  period: ChartPeriod
  /** Chart configuration */
  config?: ChartConfig
  /** Loading state */
  isLoading?: boolean
  /** Show period selector */
  showPeriodSelector?: boolean
  /** Available periods */
  availablePeriods?: ChartPeriod[]
  /** Period change callback */
  onPeriodChange?: (period: ChartPeriod) => void
  /** Custom CSS class */
  className?: string
  /** Show current value display */
  showCurrentValue?: boolean
  /** Value formatter for display */
  valueFormatter?: (value: number) => string
  /** Show percentage change */
  showPercentageChange?: boolean
  /** Mouse over callback */
  onMouseOver?: (dataPoint: ChartDataPoint) => void
  /** Mouse leave callback */
  onMouseLeave?: () => void
}
