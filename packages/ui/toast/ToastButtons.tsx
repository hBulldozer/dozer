import { FC } from 'react'

import { classNames } from '../index'
import { Typography } from '../typography'

interface ToastButtons {
  href?: string
  onDismiss(): void
}

export const ToastButtons: FC<ToastButtons> = ({ href, onDismiss }) => {
  return (
    <div className={classNames(href ? 'grid-cols-2' : 'grid-cols-auto', 'grid divide-x divide-stone-200/5')}>
      {href && (
        <Typography
          as="a"
          href={href}
          target="_blank"
          variant="xs"
          weight={600}
          className="py-3 text-yellow text-center hover:bg-stone-700/20 cursor-pointer border-t border-stone-200/5"
        >
          View Detail
        </Typography>
      )}
      <Typography
        onClick={onDismiss}
        variant="xs"
        weight={600}
        className="py-3 text-yellow text-center hover:bg-stone-700/20 cursor-pointer border-t border-stone-200/5"
      >
        Dismiss
      </Typography>
    </div>
  )
}
