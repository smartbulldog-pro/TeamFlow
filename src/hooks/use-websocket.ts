'use client'

import { useEffect, useRef, useState } from 'react'

interface UseWebSocketProps {
  workspaceId?: string
  boardId?: string
  userId?: string
}

interface WebSocketMessage {
  type: string
  payload: any
}

export function useWebSocket({ workspaceId, boardId, userId }: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = () => {
    try {
      const wsUrl = `/?XTransformPort=3002`
      wsRef.current = new WebSocket(`ws://localhost:3002`)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        
        // Join workspace and board if provided
        if (workspaceId) {
          sendMessage('join_workspace', { workspaceId })
        }
        if (boardId) {
          sendMessage('join_board', { boardId })
        }
      }

      wsRef.current.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data)
        setLastMessage(message)
      }

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }

  const sendMessage = (type: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }))
    }
  }

  const broadcastCardMoved = (cardId: string, columnId: string, position: number) => {
    sendMessage('card_moved', { cardId, columnId, position })
  }

  const broadcastCardCreated = (card: any) => {
    sendMessage('card_created', { card })
  }

  const broadcastUserTyping = (data: any) => {
    sendMessage('user_typing', data)
  }

  const broadcastCursorMove = (x: number, y: number) => {
    sendMessage('cursor_move', { x, y })
  }

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [])

  // Reconnect when workspace or board changes
  useEffect(() => {
    if (isConnected) {
      if (workspaceId) {
        sendMessage('join_workspace', { workspaceId })
      }
      if (boardId) {
        sendMessage('join_board', { boardId })
      }
    }
  }, [workspaceId, boardId, isConnected])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    broadcastCardMoved,
    broadcastCardCreated,
    broadcastUserTyping,
    broadcastCursorMove,
    disconnect,
  }
}