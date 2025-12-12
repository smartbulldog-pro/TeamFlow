'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, LayoutDashboard, Users, Settings, Plus } from 'lucide-react'

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

interface WorkspaceSidebarProps {
  workspaces: Workspace[]
  selectedWorkspace: Workspace | null
  selectedBoard: Workspace['boards'][0] | null
  onWorkspaceSelect: (workspace: Workspace) => void
  onBoardSelect: (board: Workspace['boards'][0]) => void
}

export function WorkspaceSidebar({
  workspaces,
  selectedWorkspace,
  selectedBoard,
  onWorkspaceSelect,
  onBoardSelect,
}: WorkspaceSidebarProps) {
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set(workspaces.map(w => w.id))
  )

  const toggleWorkspace = (workspaceId: string) => {
    const newExpanded = new Set(expandedWorkspaces)
    if (newExpanded.has(workspaceId)) {
      newExpanded.delete(workspaceId)
    } else {
      newExpanded.add(workspaceId)
    }
    setExpandedWorkspaces(newExpanded)
  }

  return (
    <div className="w-64 border-r bg-muted/30">
      <ScrollArea className="h-full">
        <div className="p-4">
          <div className="space-y-2">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="space-y-1">
                <Collapsible
                  open={expandedWorkspaces.has(workspace.id)}
                  onOpenChange={() => toggleWorkspace(workspace.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant={selectedWorkspace?.id === workspace.id ? "secondary" : "ghost"}
                      className="w-full justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 rounded bg-primary"></div>
                        <span className="truncate">{workspace.name}</span>
                      </div>
                      {expandedWorkspaces.has(workspace.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pl-6">
                    {workspace.boards.map((board) => (
                      <Button
                        key={board.id}
                        variant={selectedBoard?.id === board.id ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          onWorkspaceSelect(workspace)
                          onBoardSelect(board)
                        }}
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        <span className="truncate">{board.name}</span>
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-muted-foreground"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Board
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            {selectedWorkspace && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Team Members</h4>
                  <Badge variant="secondary" className="text-xs">
                    {selectedWorkspace.members.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {selectedWorkspace.members.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {member.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{member.user.name}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                  {selectedWorkspace.members.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{selectedWorkspace.members.length - 5} more members
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Workspace Settings
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}