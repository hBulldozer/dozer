import React, { FC } from 'react'

import { classNames } from '../index'
import { Typography } from '../typography'

interface FormControl {
  label: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
  error?: string
}

export const FormControl: FC<FormControl> = ({ className, label, children, disabled = false, error }) => {
  return (
    <div
      aria-disabled={disabled}
      className={classNames(className, disabled ? 'opacity-40 pointer-events-none' : '', 'flex flex-col gap-2')}
    >
      <div className="flex items-center justify-between">
        <Typography variant="sm" weight={500} className="text-stone-200">
          {label}
        </Typography>
        {error && (
          <Typography variant="xxs" className="text-red-500 text-right flex-grow flex-shrink break-words max-w-[50%]">
            {error}
          </Typography>
        )}
      </div>
      {children}
    </div>
  )
}
