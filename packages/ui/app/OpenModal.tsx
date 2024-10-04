import { FC } from 'react'

import { classNames, Link } from '..'
import React from 'react'

export interface OpenModalProps {
  setOpen: (open: boolean) => void
  label: string
}

export const OpenModal: FC<OpenModalProps> = ({ setOpen, label }) => {
  return (
    // <Link.Internal href="" className="decoration-transparent">
    <a>
      <span
        className={classNames('text-stone-400', 'text-sm font-semibold hover:text-white cursor-pointer')}
        onClick={() => setOpen(true)}
      >
        {label}
      </span>
    </a>
    // </Link.Internal>
  )
}
