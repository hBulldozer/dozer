import { useRouter } from 'next/router'
import { FC } from 'react'

import { classNames, Link } from '..'

export interface NavItemProps {
  href: string
  label: string
  external?: boolean
  target?: string
  className?: string
}

export const NavItem: FC<NavItemProps> = ({ href, label, external, target, className }) => {
  const { basePath, pathname } = useRouter()

  if (external) {
    return (
      <Link.External target={target} href={href} className="decoration-transparent">
        <span
          className={classNames(
            href.includes(basePath) || href == '/' ? 'text-stone-200' : 'text-stone-400',
            'text-sm font-semibold hover:text-white cursor-pointer',
            className
          )}
        >
          {label}
        </span>
      </Link.External>
    )
  }

  return (
    <Link.Internal href={href} className="decoration-transparent" passHref>
      <a>
        <span
          className={classNames(
            href == pathname ? 'text-stone-200' : 'text-stone-400',
            'text-sm font-semibold hover:text-white cursor-pointer'
          )}
        >
          {label}
        </span>
      </a>
    </Link.Internal>
  )
}
