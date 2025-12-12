import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import cors from 'cors'
import http from 'http'

interface Client {
  id: string
  ws: WebSocket
  userId?: string
  workspaceId?: string
  boardId?: string
}

interface Message {
  type: 'join_workspace' | 'join_board' | 'card_moved' | 'card_created' | 'user_typing' | 'cursor_move'
  payload: any
}

const clients = new Map<string, Client>()
const workspaceClients = new Map<string, Set<string>>() // workspaceId -> Set of clientIds
const boardClients = new Map<string, Set<string>>() // boardId -> Set of clientIds

const server = http.createServer()
const wss = new WebSocketServer({ server })

// Enable CORS
server.on('request', cors())

wss.on('connection', (ws: WebSocket) => {
  const clientId = uuidv4()
  const client: Client = {
    id: clientId,
    ws,
  }
  
  clients.set(clientId, client)
  console.log(`Client connected: ${clientId}`)

  ws.on('message', (data: Buffer) => {
    try {
      const message: Message = JSON.parse(data.toString())
      handleMessage(client, message)
    } catch (error) {
      console.error('Invalid message format:', error)
    }
  })

  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`)
    handleDisconnect(client)
  })

  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error)
  })

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    payload: { clientId }
  }))
})

function handleMessage(client: Client, message: Message) {
  switch (message.type) {
    case 'join_workspace':
      handleJoinWorkspace(client, message.payload.workspaceId)
      break
    case 'join_board':
      handleJoinBoard(client, message.payload.boardId)
      break
    case 'card_moved':
      handleCardMoved(client, message.payload)
      break
    case 'card_created':
      handleCardCreated(client, message.payload)
      break
    case 'user_typing':
      handleUserTyping(client, message.payload)
      break
    case 'cursor_move':
      handleCursorMove(client, message.payload)
      break
    default:
      console.log('Unknown message type:', message.type)
  }
}

function handleJoinWorkspace(client: Client, workspaceId: string) {
  // Remove from previous workspace
  if (client.workspaceId) {
    const prevClients = workspaceClients.get(client.workspaceId)
    if (prevClients) {
      prevClients.delete(client.id)
      if (prevClients.size === 0) {
        workspaceClients.delete(client.workspaceId)
      }
    }
  }

  // Add to new workspace
  client.workspaceId = workspaceId
  if (!workspaceClients.has(workspaceId)) {
    workspaceClients.set(workspaceId, new Set())
  }
  workspaceClients.get(workspaceId)!.add(client.id)

  // Notify other clients in workspace
  broadcastToWorkspace(workspaceId, {
    type: 'user_joined',
    payload: {
      userId: client.userId,
      workspaceId,
    }
  }, client.id)

  // Send current workspace users count
  const workspaceUserCount = workspaceClients.get(workspaceId)?.size || 0
  client.ws.send(JSON.stringify({
    type: 'workspace_users',
    payload: { count: workspaceUserCount }
  }))
}

function handleJoinBoard(client: Client, boardId: string) {
  // Remove from previous board
  if (client.boardId) {
    const prevClients = boardClients.get(client.boardId)
    if (prevClients) {
      prevClients.delete(client.id)
      if (prevClients.size === 0) {
        boardClients.delete(client.boardId)
      }
    }
  }

  // Add to new board
  client.boardId = boardId
  if (!boardClients.has(boardId)) {
    boardClients.set(boardId, new Set())
  }
  boardClients.get(boardId)!.add(client.id)

  // Notify other clients in board
  broadcastToBoard(boardId, {
    type: 'user_joined_board',
    payload: {
      userId: client.userId,
      boardId,
    }
  }, client.id)

  // Send current board users count
  const boardUserCount = boardClients.get(boardId)?.size || 0
  client.ws.send(JSON.stringify({
    type: 'board_users',
    payload: { count: boardUserCount }
  }))
}

function handleCardMoved(client: Client, payload: any) {
  if (!client.boardId) return

  // Broadcast to all clients in the same board
  broadcastToBoard(client.boardId, {
    type: 'card_moved',
    payload: {
      ...payload,
      movedBy: client.userId,
      timestamp: Date.now(),
    }
  })
}

function handleCardCreated(client: Client, payload: any) {
  if (!client.boardId) return

  // Broadcast to all clients in the same board
  broadcastToBoard(client.boardId, {
    type: 'card_created',
    payload: {
      ...payload,
      createdBy: client.userId,
      timestamp: Date.now(),
    }
  })
}

function handleUserTyping(client: Client, payload: any) {
  if (!client.boardId) return

  // Broadcast to all clients in the same board (except sender)
  broadcastToBoard(client.boardId, {
    type: 'user_typing',
    payload: {
      userId: client.userId,
      ...payload,
    }
  }, client.id)
}

function handleCursorMove(client: Client, payload: any) {
  if (!client.boardId) return

  // Broadcast to all clients in the same board (except sender)
  broadcastToBoard(client.boardId, {
    type: 'cursor_move',
    payload: {
      userId: client.userId,
      ...payload,
    }
  }, client.id)
}

function handleDisconnect(client: Client) {
  // Remove from workspace
  if (client.workspaceId) {
    const wsClients = workspaceClients.get(client.workspaceId)
    if (wsClients) {
      wsClients.delete(client.id)
      if (wsClients.size === 0) {
        workspaceClients.delete(client.workspaceId)
      } else {
        // Notify other clients
        broadcastToWorkspace(client.workspaceId, {
          type: 'user_left',
          payload: {
            userId: client.userId,
            workspaceId: client.workspaceId,
          }
        })
      }
    }
  }

  // Remove from board
  if (client.boardId) {
    const bdClients = boardClients.get(client.boardId)
    if (bdClients) {
      bdClients.delete(client.id)
      if (bdClients.size === 0) {
        boardClients.delete(client.boardId)
      } else {
        // Notify other clients
        broadcastToBoard(client.boardId, {
          type: 'user_left_board',
          payload: {
            userId: client.userId,
            boardId: client.boardId,
          }
        })
      }
    }
  }

  clients.delete(client.id)
}

function broadcastToWorkspace(workspaceId: string, message: any, excludeClientId?: string) {
  const wsClients = workspaceClients.get(workspaceId)
  if (!wsClients) return

  const messageStr = JSON.stringify(message)
  wsClients.forEach(clientId => {
    if (clientId !== excludeClientId) {
      const client = clients.get(clientId)
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr)
      }
    }
  })
}

function broadcastToBoard(boardId: string, message: any, excludeClientId?: string) {
  const bdClients = boardClients.get(boardId)
  if (!bdClients) return

  const messageStr = JSON.stringify(message)
  bdClients.forEach(clientId => {
    if (clientId !== excludeClientId) {
      const client = clients.get(clientId)
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr)
      }
    }
  })
}

const PORT = process.env.PORT || 3002
server.listen(PORT, () => {
  console.log(`WebSocket service running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  wss.close(() => {
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  wss.close(() => {
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })
})