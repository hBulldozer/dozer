import { ButtonColor, ButtonSize, ButtonVariant } from './Button'

export const BUTTON_CLASSES: Record<string, string> = {
  btn: 'font-medium flex hover:ring-1 focus:ring-1 items-center justify-center gap-2 rounded-xl cursor-pointer',
  'btn-disabled': 'cursor-not-allowed opacity-40 !ring-0',
  'btn-filled': 'text-stone-50',
  'btn-empty': '!ring-0',
  'btn-outlined': 'border-2 hover:ring-2 border-opacity-20 ring-offset-2 ring-offset-stone-900 rounded-xl',
  'btn-outlined-red':
    'border-2 border-red-600 text-red-600 hover:ring-2 border-opacity-20 ring-red-900 ring-offset-2 ring-offset-stone-900 rounded-xl',
  'btn-outlined-yellow': 'border-yellow ring-yellow-700 text-yellow',
  'btn-outlined-amber': 'border-amber ring-amber-700 text-amber',
  'btn-outlined-gradient':
    'bg-gradient-to-r hover:ring-4 ring-stone-600 ring-amber/30 from-yellow to-yellow focus:border-yellow-700',
  'btn-outlined-gray': 'border-stone-700 ring-stone-700 text-stone-400',
  'btn-filled-red': 'bg-red ring-red-700',
  'btn-filled-yellow': '!text-stone-800 bg-yellow ring-yellow-500 hover:bg-yellow-600 focus:bg-yellow-600',
  'btn-filled-amber': 'bg-amber ring-amber-700',
  'btn-filled-gradient':
    'bg-gradient-to-r hover:ring-4 !ring-yellow/20 from-yellow-600 to-yellow-600 focus:border-yellow-700',
  'btn-filled-gray': 'bg-stone-700 ring-stone-600',
  'btn-xs': 'px-2 h-[28px] text-xs',
  'btn-sm': 'px-3 h-[36px] text-sm font-semibold',
  'btn-default': 'px-3 h-[44px] text-sm font-semibold',
  'btn-md': 'px-4 h-[52px] rounded-2xl text-base font-semibold',
  'btn-lg': 'px-6 h-[60px] rounded-2xl text-base font-semibold',
  'btn-empty-red': 'text-red hover:text-red-300',
  'btn-empty-yellow': 'text-yellow hover:text-yellow-300',
  'btn-empty-amber': 'text-amber hover:text-amber-300',
  'btn-empty-gray': 'text-stone-400 hover:text-stone-200',
}

export const BUTTON_STYLES: Record<ButtonVariant, Record<ButtonColor, string>> = {
  outlined: {
    red: 'btn-outlined-red',
    yellow: 'btn-outlined-yellow',
    blue: 'btn-outlined-blue',
    amber: 'btn-outlined-amber',
    gradient: 'btn-outlined-gradient',
    gray: 'btn-outlined-gray',
  },
  filled: {
    red: 'btn-filled-red',
    yellow: 'btn-filled-yellow',
    blue: 'btn-filled-yellow',
    amber: 'btn-filled-amber',
    gradient: 'btn-filled-gradient',
    gray: 'btn-filled-gray',
  },
  empty: {
    red: 'btn-empty-red',
    yellow: 'btn-empty-yellow',
    blue: 'btn-empty-yellow',
    amber: 'btn-empty-amber',
    gradient: 'btn-empty-gradient',
    gray: 'btn-empty-gray',
  },
}

export const BUTTON_STYLES_VARIANT: Record<ButtonVariant, string> = {
  outlined: 'btn-outlined',
  filled: 'btn-filled',
  empty: 'btn-empty',
}

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  default: 'btn-default',
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
}
