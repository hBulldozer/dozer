import { Disclosure } from '@headlessui/react'
import { FC } from 'react'

import { Notification } from './Notification'
import { Typography } from '@dozer/ui'
import { client } from '@dozer/api'

interface NotificationGroupProps {
  notifications: string[]
  client: typeof client
}

export const NotificationGroup: FC<NotificationGroupProps> = ({ notifications, client }) => {
  return (
    <Disclosure>
      {({ open }) => {
        return (
          <div className="relative">
            {notifications.length > 1 && open && (
              <div className="absolute left-[33px] top-7 bottom-7 w-0.5 bg-gradient-to-b from-stone-700 to-yellow" />
            )}
            <Notification data={notifications[0]} showExtra={notifications.length > 1} client={client} />
            {notifications.length > 1 && (
              <Disclosure.Panel>
                {notifications.map((el, idx) => {
                  if (idx > 0) {
                    return <Notification key={idx} data={el} hideStatus client={client} />
                  }
                })}
              </Disclosure.Panel>
            )}
          </div>
        )
      }}
    </Disclosure>
  )
}
