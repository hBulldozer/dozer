import classNames from 'classnames'
import React, { forwardRef } from 'react'

import { DEFAULT_INPUT_CLASSNAME, ERROR_INPUT_CLASSNAME } from './index'
import { escapeRegExp, inputRegex, formatCentsToDecimal } from './utils'

const defaultClassName = 'w-0 p-0 text-2xl bg-transparent'

export type NumericProps = Omit<React.HTMLProps<HTMLInputElement>, 'onChange' | 'as'> & {
  onUserInput?: (input: string) => void
  error?: boolean
  fontSize?: string
  align?: 'right' | 'left'
  variant?: 'default' | 'unstyled'
  autoDecimal?: boolean // New prop to enable automatic decimal formatting
}

export const Input = forwardRef<HTMLInputElement, NumericProps>(
  (
    {
      value,
      onUserInput,
      placeholder = '0',
      className = defaultClassName,
      title = 'Token Amount',
      inputMode = 'decimal',
      type = 'text',
      pattern = '^[0-9]*[.,]?[0-9]*$',
      min = 0,
      minLength = 1,
      maxLength = 79,
      variant = 'default',
      error,
      autoDecimal = false,
      ...rest
    },
    ref
  ) => {
    const enforcer = (nextUserInput: string) => {
      if (autoDecimal) {
        // For auto-decimal mode, only allow digits and limit to reasonable length
        const digitsOnly = nextUserInput.replace(/\D/g, '')
        if (digitsOnly.length <= 6) { // Max 6 digits (e.g., 123456 -> 1234.56)
          const formattedValue = formatCentsToDecimal(digitsOnly)
          if (onUserInput) {
            onUserInput(formattedValue)
          }
        }
      } else {
        // Original validation logic with 2 decimal place limit
        if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
          if (onUserInput) {
            onUserInput(nextUserInput)
          }
        }
      }
    }

    return (
      <input
        ref={ref}
        value={value}
        onChange={(event) => {
          if (autoDecimal) {
            // For auto-decimal mode, pass the raw input to enforcer
            enforcer(event.target.value)
          } else {
            // replace commas with periods, because uniswap exclusively uses period as the decimal separator
            enforcer(event.target.value.replace(/,/g, '.'))
          }
        }}
        // universal input options
        inputMode={inputMode}
        title={title}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        // text-specific options
        type={type}
        pattern={pattern}
        placeholder={placeholder}
        min={min}
        minLength={minLength}
        maxLength={maxLength}
        className={
          variant === 'default'
            ? classNames(DEFAULT_INPUT_CLASSNAME, error ? ERROR_INPUT_CLASSNAME : '', className)
            : className
        }
        {...rest}
      />
    )
  }
)
