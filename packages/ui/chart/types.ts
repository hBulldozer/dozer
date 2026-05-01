export type ChartTimeRange = '24h' | '3d' | '1w'

export interface OHLC {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export interface Candle {
  time: number
  value: number
  color?: string
}

export interface ChartHoverData {
  time: string
  open?: number
  high?: number
  low?: number
  close?: number
  value?: number
}
