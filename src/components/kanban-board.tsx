'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, MoreHorizontal, Calendar, User, GripVertical, Users } from 'lucide-react'
import { format } from 'date-fns'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useWebSocket } from '@/hooks/use-websocket'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

interface Workspace {
  id: string
  name: string
  description?: string
  icon?: string
  members: Array<{
    id: string
    role: string
    user: User
  }>
  boards: Array<{
    id: string
    name: string
    columns: Array<{
      id: string
      name: string
      cards: Array<{
        id: string
        title: string
        description?: string
        priority: 'LOW' | 'MEDIUM' | 'HIGH'
        dueDate?: string
        creator: User
        assignee?: User
      }>
    }>
  }>
}

interface KanbanBoardProps {
  board: Workspace['boards'][0]
  workspace: Workspace
}

const priorityColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800',
}

interface DraggableCardProps {
  card: {
    id: string
    title: string
    description?: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    dueDate?: string
    creator: User
    assignee?: User
  }
}

function DraggableCard({ card }: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Card Header with drag handle */}
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-sm leading-tight flex-1">
                {card.title}
              </h4>
              <div
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                {...listeners}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Description */}
            {card.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {card.description}
              </p>
            )}

            {/* Priority Badge */}
            <div className="flex items-center justify-between">
              <Badge 
                variant="secondary" 
                className={`text-xs ${priorityColors[card.priority]}`}
              >
                {card.priority}
              </Badge>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              {/* Assignee */}
              {card.assignee && (
                <div className="flex items-center space-x-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={card.assignee.avatar} alt={card.assignee.name} />
                    <AvatarFallback className="text-xs">
                      {card.assignee.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              {/* Due Date */}
              {card.dueDate && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(card.dueDate), 'MMM d')}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface DroppableColumnProps {
  column: {
    id: string
    name: string
    cards: Array<{
      id: string
      title: string
      description?: string
      priority: 'LOW' | 'MEDIUM' | 'HIGH'
      dueDate?: string
      creator: User
      assignee?: User
    }>
  }
  onAddCard: (columnId: string, title: string) => void
  showAddCard: string | null
  setShowAddCard: (value: string | null) => void
  newCardTitle: string
  setNewCardTitle: (value: string) => void
}

function DroppableColumn({ 
  column, 
  onAddCard, 
  showAddCard, 
  setShowAddCard, 
  newCardTitle, 
  setNewCardTitle 
}: DroppableColumnProps) {
  const cardIds = column.cards.map(card => card.id)

  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-muted/30 rounded-lg p-4 h-full flex flex-col">
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{column.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {column.cards.length}
          </Badge>
        </div>

        {/* Cards */}
        <ScrollArea className="flex-1">
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {column.cards.map((card) => (
                <DraggableCard key={card.id} card={card} />
              ))}

              {/* Add Card Button */}
              {showAddCard === column.id ? (
                <Card className="border-2 border-dashed border-primary">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Enter card title..."
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onAddCard(column.id, newCardTitle)
                          } else if (e.key === 'Escape') {
                            setShowAddCard(null)
                            setNewCardTitle('')
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => onAddCard(column.id, newCardTitle)}
                          disabled={!newCardTitle.trim()}
                        >
                          Add
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setShowAddCard(null)
                            setNewCardTitle('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAddCard(column.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add card
                </Button>
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
    </div>
  )
}

export function KanbanBoard({ board, workspace }: KanbanBoardProps) {
  const [showAddCard, setShowAddCard] = useState<string | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [boardUsers, setBoardUsers] = useState(0)
  const [realtimeUpdates, setRealtimeUpdates] = useState<any[]>([])

  // Get current user from auth context (simplified for now)
  const [currentUser] = useState<{ id: string }>({ id: 'current-user-id' })

  const {
    isConnected,
    lastMessage,
    broadcastCardMoved,
    broadcastCardCreated,
  } = useWebSocket({
    workspaceId: workspace.id,
    boardId: board.id,
    userId: currentUser.id,
  })

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return

    switch (lastMessage.type) {
      case 'board_users':
        setBoardUsers(lastMessage.payload.count)
        break
      case 'card_moved':
        console.log('Card moved by another user:', lastMessage.payload)
        // Handle real-time card movement
        setRealtimeUpdates(prev => [...prev, lastMessage.payload])
        setTimeout(() => {
          window.location.reload() // Simple refresh for now
        }, 1000)
        break
      case 'card_created':
        console.log('Card created by another user:', lastMessage.payload)
        // Handle real-time card creation
        setRealtimeUpdates(prev => [...prev, lastMessage.payload])
        setTimeout(() => {
          window.location.reload() // Simple refresh for now
        }, 1000)
        break
      case 'user_joined_board':
        console.log('User joined board:', lastMessage.payload)
        break
      case 'user_left_board':
        console.log('User left board:', lastMessage.payload)
        break
      default:
        console.log('Unknown WebSocket message:', lastMessage)
    }
  }, [lastMessage])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, { context }) => {
        const { active, over } = context
        if (active && over) {
          return {
            x: 0,
            y: 0,
          }
        }
        return null
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the active card and the column it's being dragged over
    const activeCard = board.columns
      .flatMap(col => col.cards)
      .find(card => card.id === activeId)
    
    if (!activeCard) return

    // Find the target column
    const targetColumn = board.columns.find(col => 
      col.cards.some(card => card.id === overId) || col.id === overId
    )

    if (targetColumn && activeCard.columnId !== targetColumn.id) {
      // Update the card's column in the UI (optimistic update)
      // This would normally be handled by state management
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the active card
    const activeCard = board.columns
      .flatMap(col => col.cards)
      .find(card => card.id === activeId)
    
    if (!activeCard) return

    // Find the target column
    const targetColumn = board.columns.find(col => 
      col.cards.some(card => card.id === overId) || col.id === overId
    )

    if (targetColumn && activeCard.columnId !== targetColumn.id) {
      // Update the card's column in the database
      try {
        const response = await fetch('/api/cards', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cardId: activeId,
            columnId: targetColumn.id,
            position: targetColumn.cards.length, // Add to the end of the column
          }),
        })

        if (response.ok) {
          // Broadcast the card movement to other users
          broadcastCardMoved(activeId, targetColumn.id, targetColumn.cards.length)
        } else {
          console.error('Failed to move card')
        }
      } catch (error) {
        console.error('Failed to move card:', error)
      }
    }

    setActiveId(null)
  }

  const handleAddCard = async (columnId: string, title: string) => {
    if (!title.trim()) return

    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          columnId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setNewCardTitle('')
        setShowAddCard(null)
        
        // Broadcast the card creation to other users
        broadcastCardCreated(data.card)
        
        // TODO: Refresh board data or use optimistic updates
        window.location.reload() // Temporary solution
      }
    } catch (error) {
      console.error('Failed to create card:', error)
    }
  }

  const activeCard = activeId 
    ? board.columns.flatMap(col => col.cards).find(card => card.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col">
        {/* Board Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{board.name}</h2>
              <div className="flex items-center space-x-4">
                <p className="text-muted-foreground">{workspace.name}</p>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {boardUsers} user{boardUsers !== 1 ? 's' : ''} online
                  </span>
                  {isConnected && (
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Real-time Updates Notification */}
        {realtimeUpdates.length > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 p-2">
            <div className="text-sm text-blue-800">
              Real-time updates are happening! {realtimeUpdates.length} update{realtimeUpdates.length !== 1 ? 's' : ''} detected.
            </div>
          </div>
        )}

        {/* Kanban Columns */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex h-full p-4 space-x-4">
            {board.columns.map((column) => (
              <DroppableColumn
                key={column.id}
                column={column}
                onAddCard={handleAddCard}
                showAddCard={showAddCard}
                setShowAddCard={setShowAddCard}
                newCardTitle={newCardTitle}
                setNewCardTitle={setNewCardTitle}
              />
            ))}

            {/* Add Column Button */}
            <div className="flex-shrink-0 w-80">
              <Card className="border-2 border-dashed border-muted-foreground/25 h-full flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                <CardContent className="p-4 text-center">
                  <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Add another column</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="rotate-3 transform">
            <Card className="cursor-pointer shadow-2xl">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm leading-tight">
                    {activeCard.title}
                  </h4>
                  {activeCard.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {activeCard.description}
                    </p>
                  )}
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${priorityColors[activeCard.priority]}`}
                  >
                    {activeCard.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}