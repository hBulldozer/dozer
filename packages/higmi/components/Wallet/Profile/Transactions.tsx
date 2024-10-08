import { ChevronLeftIcon } from '@heroicons/react/24/solid'
import { Button, IconButton, Typography } from '@dozer/ui'
import React, { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'

import { NotificationGroup } from '../../NotificationCentre'
import { ProfileView } from './Profile'
import { client } from '@dozer/api'
import { BaseEvent, EventType, useWebSocket } from '../../../systems'

interface TransactionsProps {
  setView: Dispatch<SetStateAction<ProfileView>>
  notifications: Record<number, string[]>
  clearNotifications(): void
  updateNotificationStatus: (txHash: string, state: string, message?: string) => void
  client: typeof client
}

export const Transactions: FC<TransactionsProps> = ({
  setView,
  notifications,
  clearNotifications,
  updateNotificationStatus,
  client,
}) => {
  // const [messages, setMessages] = useState<BaseEvent[]>([])
  // const desiredEventTypes = [EventType.NEW_VERTEX_ACCEPTED, EventType.VERTEX_METADATA_CHANGED]

  // const data = useWebSocket(desiredEventTypes, notifications, updateNotificationStatus)
  // useEffect(() => {
  //   // console.log('data', data)
  //   setMessages(data)
  // }, [data])
  return (
    <div className="">
      <div className="grid items-center h-12 grid-cols-3 px-2 border-b border-stone-200/20">
        <div className="flex items-center">
          <IconButton onClick={() => setView(ProfileView.Default)}>
            <ChevronLeftIcon width={24} height={24} className="text-stone-400" />
          </IconButton>
        </div>
        <Typography weight={600} className="text-stone-400">
          Transactions
        </Typography>
        <div className="flex items-end justify-end">
          <Button onClick={clearNotifications} variant="empty" size="sm" className="!p-0">
            Clear all
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 max-h-[300px] scroll">
        {Object.entries(notifications).length > 0 ? (
          Object.entries(notifications)
            .reverse()
            .map(([, _notifications], index) => {
              return <NotificationGroup key={index} notifications={_notifications} client={client} />
              // return <Typography>{_notifications}</Typography>
            })
        ) : (
          <Typography variant="sm" className="py-5 text-center text-stone-500">
            Your transactions will appear here
          </Typography>
        )}
      </div>
    </div>
  )
}
