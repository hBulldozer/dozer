import classNames from 'classnames'
import React, { forwardRef } from 'react'

import { DEFAULT_INPUT_CLASSNAME, ERROR_INPUT_CLASSNAME } from './index'

export type AddressProps = Omit<React.HTMLProps<HTMLInputElement>, 'as' | 'onChange' | 'value' | 'ref'> & {
  pattern: string
  id: string
  error?: boolean
  value: string | undefined
  onChange(x: string): void
  variant?: 'default' | 'unstyled'
}

export const TextGeneric = forwardRef<HTMLInputElement, AddressProps>(
  (
    {
      id,
      value = '',
      onChange,
      placeholder = 'Address',
      title = 'Address',
      className = '',
      error,
      pattern,
      variant = 'default',
      ...rest
    },
    ref
  ) => {
    return (
      <>
        <input
          id={id}
          ref={ref}
          title={title}
          placeholder={placeholder}
          value={value}
          type="text"
          className={
            variant === 'default'
              ? classNames(DEFAULT_INPUT_CLASSNAME, error ? ERROR_INPUT_CLASSNAME : '', className)
              : className
          }
          onChange={(event) => onChange(event.target.value)}
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          pattern={pattern}
          {...rest}
        />
      </>
    )
  }
)
