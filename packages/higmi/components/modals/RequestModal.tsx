import * as React from 'react'

import { Loader } from '@dozer/ui'

interface RequestModalProps {
  pending: boolean
  result: any
}

const RequestModal = (props: RequestModalProps) => {
  const { pending, result } = props
  return (
    <>
      {pending ? (
        <div className="relative w-full break-words">
          <div className="my-4 text-2xl font-bold">{'Pending JSON-RPC Request'}</div>
          <div className="flex flex-col text-left">
            <Loader />
            <div className="my-4 text-2xl font-bold">{'Approve or reject request using your wallet'}</div>
          </div>
        </div>
      ) : result ? (
        <div className="relative w-full break-words">
          <div className="my-4 text-2xl font-bold">
            {result.valid ? 'JSON-RPC Request Approved' : 'JSON-RPC Request Failed'}
          </div>
          <div className="flex flex-col text-left">
            {Object.keys(result).map((key) => (
              <div className="flex items-center justify-between" key={key}>
                <div className="text-sm text-gray-400">{key}</div>
                <div className="text-sm">{result[key].toString()}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative w-full break-words">
          <div className="my-4 text-2xl font-bold">{'JSON-RPC Request Rejected'}</div>
        </div>
      )}
    </>
  )
}

export default RequestModal
