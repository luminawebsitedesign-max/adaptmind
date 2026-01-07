import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { ChatConversation } from '@/hooks/useChatHistory';
import { formatDistanceToNow } from 'date-fns';

interface ChatHistorySidebarProps {
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  onSelectConversation: (conversation: ChatConversation) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ChatHistorySidebar({
  conversations,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isCollapsed,
  onToggleCollapse,
}: ChatHistorySidebarProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    onDeleteConversation(id);
    setDeleteConfirmId(null);
  };

  if (isCollapsed) {
    return (
      <div className="w-12 flex-shrink-0 border-r border-border/30 bg-card/30 flex flex-col">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="m-2"
          aria-label="Expand chat history"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewConversation}
          className="mx-2"
          aria-label="New conversation"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 flex-shrink-0 border-r border-border/30 bg-card/30 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border/30 flex items-center justify-between">
        <h3 className="font-medium text-sm">Chat History</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewConversation}
            className="h-8 w-8"
            aria-label="New conversation"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
            aria-label="Collapse chat history"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Start a new chat to begin
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group relative rounded-lg transition-colors cursor-pointer",
                  currentConversation?.id === conv.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50"
                )}
                onClick={() => onSelectConversation(conv)}
              >
                <div className="p-2.5 pr-10">
                  <p className="text-sm font-medium truncate">{conv.title}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}</span>
                  </div>
                </div>
                
                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(conv.id);
                  }}
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
        title="Delete Conversation?"
        description="This will permanently delete this conversation and all its messages."
        confirmLabel="Delete"
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
      />
    </div>
  );
}
