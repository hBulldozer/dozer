import { Badge, classNames, Dots, IconButton, Link, Loader, NotificationData, TimeAgo, Typography } from '@dozer/ui'
import { Disclosure } from '@headlessui/react'
import { CheckCircleIcon, ChevronDownIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { FC } from 'react'
import useWaitForTransaction from './useWaitForTransaction'
import { client as api_client } from '@dozer/api'
import chains, { ChainId } from '@dozer/chain'



export const Notification: FC<{
  data: string
  showExtra?: boolean
  hideStatus?: boolean
  client: typeof api_client
}> = ({ data, showExtra = false, hideStatus = false, client }) => {
  const notification: NotificationData = JSON.parse(data)
  const { status, message } = useWaitForTransaction(notification, client)
  if (!status)
    return (
      <div className="flex items-center gap-5 px-4 pr-8 rounded-2xl min-h-[82px] w-full">
        <div>
          <div className="rounded-full bg-stone-600 h-9 w-9" />
        </div>
        <div className="flex flex-col w-full gap-2">
          <div className="flex flex-col w-full gap-1">
            <div className="bg-stone-500 w-full h-[12px] animate-pulse rounded-full" />
            <div className="bg-stone-500 w-[60px] h-[12px] animate-pulse rounded-full" />
          </div>
          <div className="bg-stone-600 w-[120px] h-[10px] animate-pulse rounded-full" />
        </div>
      </div>
    )

  return (
    <div className="relative hover:opacity-80">
      {showExtra && (
        <Disclosure.Button className="absolute right-3 top-0 bottom-0 z-[100]">
          {({ open }) => {
            return (
              <IconButton as="div">
                <ChevronDownIcon
                  width={20}
                  height={20}
                  className={classNames(open ? 'rotate-180' : 'rotate-0', 'rounded-full transition-all delay-200')}
                />
              </IconButton>
            )
          }}
        </Disclosure.Button>
      )}
      <Link.External
        href={
          notification.href
            ? notification.href
            : chains[notification.chainId || ChainId.HATHOR].getTxUrl(notification.txHash)
        }
        className="!no-underline"
      >
        <div
          className={classNames(
            showExtra ? 'pr-10' : 'pr-4',
            'relative cursor-pointer flex items-center gap-5 rounded-2xl px-4 py-3'
          )}
        >
          <Badge badgeContent={<ArrowDownTrayIcon />}>
            <div className="p-2 bg-stone-600 rounded-full h-[36px] w-[36px] flex justify-center items-center">
              {!hideStatus &&
                (status === 'pending' ? (
                  <Loader size={18} />
                ) : status === 'failed' ? (
                  <XMarkIcon width={20} height={20} className="text-red-400" />
                ) : (
                  <></>
                ))}
              {/* {(status === 'success' || notification.summary.info) && notification.type === 'send' && (
                <ArrowRightIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'stargate' && (
                <UICurrency.Icon currency={STARGATE_TOKEN} width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'swap' && (
                <ArrowsUpDownIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'approval' && (
                <LockOpenIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'mint' && (
                <PlusIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'burn' && (
                <FireIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'enterBar' && (
                <ArrowDownTrayIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'transferStream' && (
                <ArrowRightIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'transferVesting' && (
                <ArrowRightIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'createMultipleStream' && (
                <CheckIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'createMultipleVesting' && (
                <CheckIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'cancelStream' && (
                <CheckIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'createVesting' && (
                <CheckIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'createStream' && (
                <CheckIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'updateStream' && (
                <ArrowDownTrayIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'withdrawStream' && (
                <ArrowUpTrayIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'withdrawVesting' && (
                <ArrowUpTrayIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'leaveBar' && (
                <ArrowUpTrayIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'claimRewards' && (
                <BanknotesIcon width={20} height={20} />
              )} */}
              {status === 'success' && <CheckCircleIcon width={20} height={20} className="text-green" />}
            </div>
          </Badge>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <Typography as="span" variant="sm" weight={500} className="items-center whitespace-normal text-stone-50">
                {notification.summary.info && status == 'pending' ? (
                  <Dots>{notification.summary.pending}</Dots>
                ) : status === 'failed' ? (
                  message
                ) : (
                  notification.summary.completed
                )}
              </Typography>
            </div>
            <Typography variant="xs" className="text-stone-500">
              <TimeAgo date={new Date(notification.groupTimestamp * 1000)} />
            </Typography>
          </div>
        </div>
      </Link.External>
    </div>
  )
}
