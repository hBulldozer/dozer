import { useState, useEffect } from 'react'

const WS_URL = `${process.env.NEXT_PUBLIC_LOCAL_NODE_URL?.replace('http', 'ws')}event_ws`
const NODE_URL = `${process.env.NEXT_PUBLIC_LOCAL_NODE_URL}event`

type EventConstantType = 'EVENT'

export enum EventType {
  LOAD_STARTED = 'LOAD_STARTED', //	Will be triggered when the full node is initializing and starts reading from the local database.	EmptyData
  LOAD_FINISHED = 'LOAD_FINISHED', //	Will be triggered when the full node is ready to establish new connections, sync, and exchange transactions.	EmptyData
  NEW_VERTEX_ACCEPTED = 'NEW_VERTEX_ACCEPTED', //	Will be triggered when a vertex is synced, and the consensus algorithm immediately identifies it as an accepted vertex.	TxData
  REORG_STARTED = 'REORG_STARTED', //Will be triggered when a reorg process starts, that is, the best chain changes. Starts a new event group.	ReorgData
  REORG_FINISHED = 'REORG_FINISHED', //	Will be triggered when a reorg process finishes, that is, a new best chain was found. Closes the event group opened by the previous REORG_STARTED event.	EmptyData
  VERTEX_METADATA_CHANGED = 'VERTEX_METADATA_CHANGED', //	Will be triggered when the metadata for a vertex changes. This will happen both for new vertices and for vertices that are affected during a reorg. In the latter case, these events will belong to the same event group as the reorg start and finish events.	TxData
}
export interface Event {
  latest_event_id: number
  network: string
  stream_id: string
  type: EventConstantType
  peer_id: string //Full node ID. Different full nodes can have different sequences of events.
  event: BaseEvent
}

export interface BaseEvent {
  id: number //Unique and sequential event ID.
  timestamp: number //	Timestamp in which the event was generated, in unix seconds. This is only informative, as events aren't guaranteed to have sequential timestamps. For example, if the system clock changes between two events, it's possible that timestamps won't be ordered. Always use the id for reliable ordering.
  type: EventType //	The event type.
  data: TxData //Data for this event. Its schema depends on type.
  group_id?: number //	Used to link events, for example, many events will have the same group_id when they belong to the same reorg process.
}

export interface TxData {
  hash: string //	The hash of this vertex.
  nonce?: number //The nonce of this vertex.
  timestamp: number //The timestamp of this vertex.
  version: number //	The version of this vertex.
  weight: number //The weight of this vertex.
  inputs: TxInput[] //	The inputs of this vertex.
  outputs: TxOutput[] //The outputs of this vertex.
  parents: string[] //The hashes of this vertex's parents.
  tokens: string[] //The tokens of this vertex.
  token_name?: string //	The token name of this vertex, if it is a TokenCreationTransaction.
  token_symbol?: string //The token symbol of this vertex, if it is a TokenCreationTransaction.
  metadata: TxMetadata //	The metadata of this vertex.
  aux_pow?: string //The auxiliary Proof of Work of this vertex, if it is a MergeMinedBlock.
}

export interface ReorgData {
  reorg_size: number //	The amount of blocks affected by this reorg.
  previous_best_block: string //	The hash of the best block before this reorg happened.
  new_best_block: string //	The hash of the best block after this reorg.
  common_block: string //	The hash of the last common block between the two differing blockchains.
}

export interface TxMetadata {
  hash: string
  spent_outputs: SpentOutput[]
  conflict_with: string[]
  voided_by: string[]
  received_by: number[]
  children: string[]
  twins: string[]
  accumulated_weight: number
  score: number
  first_block?: string
  height: number
  validation: string
}

export interface TxInput {
  tx_id: string
  index: number
  data: string
}

export interface TxOutput {
  value: number
  script: string
  token_data: number
}

export interface SpentOutput {
  tx_ids: string[]
  index: number
}

export const useWebSocket = (
  types: EventType[],
  notifications: Record<number, string[]>,
  updateNotificationStatus: (txHash: string, state: string, message?: string) => void,
  last_ack_event_id = 0,
  window_size = 10
): BaseEvent[] => {
  const [messages, setMessages] = useState<BaseEvent[]>([])
  const [socket, setSocket] = useState<WebSocket | null>(null)

  const txList = Object.values(notifications).map((notification: string[]) => {
    const json = JSON.parse(notification[0])
    return json.txHash
  })

  useEffect(() => {
    const connect = async () => {
      try {
        const ws = new WebSocket(WS_URL)
        setSocket(ws)

        ws.onopen = () => {
          // console.log('WebSocket connection opened')
          // Send start message after connection is established
          ws.send(
            JSON.stringify({
              type: 'START_STREAM',
              last_ack_event_id: last_ack_event_id, // Start from the beginning
              window_size: window_size, // Adjust window size as needed
            })
          )
        }

        ws.onmessage = (event: MessageEvent) => {
          const message: BaseEvent = JSON.parse(event.data).event // Extract actual event
          if (message && message.id && message.type) {
            ws.send(
              JSON.stringify({
                type: 'ACK',
                ack_event_id: message.id, // Start from the beginning
                window_size: window_size, // Adjust window size as needed
              })
            )
            if (types.includes(message.type) && txList.includes(message.data.hash)) {
              setMessages((prevMessages) =>
                prevMessages
                  .map((msg) => {
                    return msg.id
                  })
                  .includes(message.id)
                  ? prevMessages
                  : [...prevMessages, message]
              )
              const txHash = message.data.hash
              const voided_by = message.data.metadata.voided_by.length
              const first_block = message.data.metadata.first_block

              updateNotificationStatus(
                txHash,
                voided_by ? 'failed' : first_block ? 'success' : 'pending',
                voided_by
                  ? `TX Failed. Voided by ${message.data.metadata.voided_by[0]}`
                  : first_block
                  ? 'success'
                  : 'pending'
              )
            }
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }
      } catch (error) {
        console.error('Error connecting to WebSocket:', error)
      }
    }

    connect()

    return () => {
      socket?.close()
    }
  }, [Object.values(notifications).length])

  return messages
}

export const useWebSocketGeneric = (
  onMessage: (message: BaseEvent) => void,
  real_time = false,
  last_ack_event_id = 0,
  window_size = 10
): [BaseEvent[], boolean] => {
  const [messages, setMessages] = useState<BaseEvent[]>([])
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnecting, setIsConnecting] = useState(false) // Track connection state

  const get_latest = async () => {
    const headers: HeadersInit = {}
    if (process.env.NEXT_PUBLIC_NODE_API_KEY) {
      headers['X-API-Key'] = process.env.NEXT_PUBLIC_NODE_API_KEY
    }
    const response = await fetch(`${NODE_URL}?size=1`, { headers })
    const result = await response.json()
    const latest = result.latest_event_id

    return latest
  }
  useEffect(() => {
    let latest: number
    const connect = async () => {
      setIsConnecting(true) // Set connecting state
      try {
        const ws = new WebSocket(WS_URL)
        setSocket(ws)

        ws.onopen = () => {
          // console.log('WebSocket connection opened')
          setIsConnecting(false) // Set connected state
          // Send start message after connection is established
          ws.send(
            JSON.stringify({
              type: 'START_STREAM',
              last_ack_event_id: real_time ? (latest - 10 > 0 ? latest - 10 : latest) : last_ack_event_id, // Start from the beginning
              window_size: window_size, // Adjust window size as needed
            })
          )
        }

        ws.onmessage = (event: MessageEvent) => {
          const message: BaseEvent = JSON.parse(event.data).event // Extract actual event
          if (message && message.id && message.type) {
            ws.send(
              JSON.stringify({
                type: 'ACK',
                ack_event_id: message.id, // Start from the beginning
                window_size: window_size, // Adjust window size as needed
              })
            )
            onMessage(message)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          setIsConnecting(false) // Set disconnected state
          // Implement retry logic here (optional)
        }
      } catch (error) {
        console.error('Error connecting to WebSocket:', error)
        setIsConnecting(false) // Set disconnected state
      }
    }

    if (real_time)
      get_latest().then((res) => {
        latest = res
        connect()
      })
    else connect()

    return () => {
      socket?.close() // Close connection on cleanup
    }
  }, []) // Include socket in dependency array

  return [messages, isConnecting] // Return messages and connection state
}
