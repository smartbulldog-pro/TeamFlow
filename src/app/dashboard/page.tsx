'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Users, Settings, LogOut, LayoutDashboard } from 'lucide-react'
import { KanbanBoard } from '@/components/kanban-board'
import { WorkspaceSidebar } from '@/components/workspace-sidebar'

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

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [selectedBoard, setSelectedBoard] = useState<Workspace['boards'][0] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('')

  useEffect(() => {
    fetchUser()
    fetchWorkspaces()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      window.location.href = '/'
    }
  }

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces')
      if (response.ok) {
        const data = await response.json()
        setWorkspaces(data.workspaces)
        if (data.workspaces.length > 0 && !selectedWorkspace) {
          setSelectedWorkspace(data.workspaces[0])
          if (data.workspaces[0].boards.length > 0) {
            setSelectedBoard(data.workspaces[0].boards[0])
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWorkspace = async () => {
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newWorkspaceName,
          description: newWorkspaceDescription,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setShowCreateWorkspace(false)
        setNewWorkspaceName('')
        setNewWorkspaceDescription('')
        fetchWorkspaces()
      }
    } catch (error) {
      console.error('Failed to create workspace:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (workspaces.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Welcome to TeamFlow</CardTitle>
            <CardDescription>
              Create your first workspace to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                placeholder="My Team Workspace"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="workspace-description">Description (optional)</Label>
              <Textarea
                id="workspace-description"
                placeholder="What's this workspace for?"
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleCreateWorkspace}
              disabled={!newWorkspaceName.trim()}
              className="w-full"
            >
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-primary"></div>
              <span className="text-xl font-bold">TeamFlow</span>
            </div>
            {selectedWorkspace && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{selectedWorkspace.name}</Badge>
                {selectedBoard && (
                  <Badge variant="outline">{selectedBoard.name}</Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <Dialog open={showCreateWorkspace} onOpenChange={setShowCreateWorkspace}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Workspace
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Workspace</DialogTitle>
                  <DialogDescription>
                    Set up a new workspace for your team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-workspace-name">Workspace Name</Label>
                    <Input
                      id="new-workspace-name"
                      placeholder="My Team Workspace"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-workspace-description">Description (optional)</Label>
                    <Textarea
                      id="new-workspace-description"
                      placeholder="What's this workspace for?"
                      value={newWorkspaceDescription}
                      onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateWorkspace}
                    disabled={!newWorkspaceName.trim()}
                    className="w-full"
                  >
                    Create Workspace
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user.name}</span>
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <WorkspaceSidebar
          workspaces={workspaces}
          selectedWorkspace={selectedWorkspace}
          selectedBoard={selectedBoard}
          onWorkspaceSelect={setSelectedWorkspace}
          onBoardSelect={setSelectedBoard}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {selectedBoard ? (
            <KanbanBoard board={selectedBoard} workspace={selectedWorkspace} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <LayoutDashboard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Board Selected</h3>
                <p className="text-muted-foreground">Select a board from the sidebar to get started</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}