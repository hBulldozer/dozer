import { Listbox, Transition } from '@headlessui/react'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import classNames from 'classnames'
import { FC, forwardRef, Fragment, ReactNode, useState } from 'react'

import { ExtractProps } from '../types'

export type SelectOptionProps = ExtractProps<typeof Listbox.Option> & {
  children?: ReactNode
  showArrow?: boolean
  as?: string | React.ComponentType<any>
  href?: string
  target?: string
}

const SelectOption: FC<SelectOptionProps> = forwardRef(
  ({ className, children, showArrow = true, as, href, target, ...props }, ref) => {
    const [hover, setHover] = useState(false)

    return (
      <Listbox.Option
        ref={ref}
        {...props}
        as={as}
        href={href}
        target={target}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={({ active }: { active: boolean }) =>
          classNames(
            active ? 'text-white bg-white bg-opacity-[0.06]' : 'text-high-emphesis',
            'flex gap-2 px-2 items-center font-medium text-sm cursor-default select-none relative py-3 rounded-2xl whitespace-nowrap',
            className
          )
        }
      >
        {children}
        <Transition
          as={Fragment}
          show={hover && showArrow}
          enter="ease-in-out duration-300"
          enterFrom="translate-x-[10px] opacity-0"
          enterTo="translate-x-[-10px] opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="translate-x-[-10px] opacity-100"
          leaveTo="translate-x-[10px] opacity-0"
          unmount={false}
        >
          <div className="absolute top-0 bottom-0 right-0 flex items-center justify-center">
            <div className="p-1 bg-white rounded-full shadow-lg text-yellow shadow-black/30">
              <ArrowRightIcon width={10} height={10} />
            </div>
          </div>
        </Transition>
      </Listbox.Option>
    )
  }
)

export default SelectOption
