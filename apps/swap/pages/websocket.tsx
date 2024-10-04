import { useState, useEffect } from 'react'
import { Layout } from 'components/Layout'
import React from 'react'

const WS_URL = 'ws://192.168.0.103:8080/v1a/event_ws'

type EventConstantType = 'EVENT'

enum EventType {
  LOAD_STARTED = 'LOAD_STARTED', //	Will be triggered when the full node is initializing and starts reading from the local database.	EmptyData
  LOAD_FINISHED = 'LOAD_FINISHED', //	Will be triggered when the full node is ready to establish new connections, sync, and exchange transactions.	EmptyData
  NEW_VERTEX_ACCEPTED = 'NEW_VERTEX_ACCEPTED', //	Will be triggered when a vertex is synced, and the consensus algorithm immediately identifies it as an accepted vertex.	TxData
  REORG_STARTED = 'REORG_STARTED', //Will be triggered when a reorg process starts, that is, the best chain changes. Starts a new event group.	ReorgData
  REORG_FINISHED = 'REORG_FINISHED', //	Will be triggered when a reorg process finishes, that is, a new best chain was found. Closes the event group opened by the previous REORG_STARTED event.	EmptyData
  VERTEX_METADATA_CHANGED = 'VERTEX_METADATA_CHANGED', //	Will be triggered when the metadata for a vertex changes. This will happen both for new vertices and for vertices that are affected during a reorg. In the latter case, these events will belong to the same event group as the reorg start and finish events.	TxData
}
interface Event {
  latest_event_id: number
  network: string
  stream_id: string
  type: EventConstantType
  peer_id: string //Full node ID. Different full nodes can have different sequences of events.
  event: BaseEvent
}

interface BaseEvent {
  id: number //Unique and sequential event ID.
  timestamp: number //	Timestamp in which the event was generated, in unix seconds. This is only informative, as events aren't guaranteed to have sequential timestamps. For example, if the system clock changes between two events, it's possible that timestamps won't be ordered. Always use the id for reliable ordering.
  type: EventType //	The event type.
  data: Record<string, never> | TxData | ReorgData //Data for this event. Its schema depends on type.
  group_id?: number //	Used to link events, for example, many events will have the same group_id when they belong to the same reorg process.
}

interface TxData {
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

interface ReorgData {
  reorg_size: number //	The amount of blocks affected by this reorg.
  previous_best_block: string //	The hash of the best block before this reorg happened.
  new_best_block: string //	The hash of the best block after this reorg.
  common_block: string //	The hash of the last common block between the two differing blockchains.
}

interface TxMetadata {
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

interface TxInput {
  tx_id: string
  index: number
  data: string
}

interface TxOutput {
  value: number
  script: string
  token_data: number
}

interface SpentOutput {
  tx_ids: string[]
  index: number
}
const EventsPage = () => {
  const [messages, setMessages] = useState<Event[]>([])
  const [socket, setSocket] = useState<WebSocket | null>(null)

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
              last_ack_event_id: 0, // Start from the beginning
              window_size: 10, // Adjust window size as needed
            })
          )
        }

        ws.onmessage = (event: MessageEvent) => {
          const message: Event = JSON.parse(event.data)
          setMessages((prevMessages) => [...prevMessages, message])
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
  }, [])

  const filteredMessages = messages.filter(
    (message) =>
      message.event.type === EventType.VERTEX_METADATA_CHANGED || message.event.type === EventType.NEW_VERTEX_ACCEPTED
  )

  return (
    <Layout>
      <div>
        <h1>Received Messages</h1>
        <ul>
          {filteredMessages.map((message) => (
            <li key={message.event.id}>{JSON.stringify(message)}</li>
          ))}
        </ul>
      </div>
    </Layout>
  )
}

export default EventsPage
