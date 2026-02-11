import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X, AlertCircle } from 'lucide-react';

export interface PendingAction {
  type: 'CREATE_TASK' | 'CREATE_GOAL' | 'CREATE_HABIT' | 'CREATE_LIST' | 'CREATE_PORTFOLIO' | 'DELETE_TASK' | 'DELETE_GOAL' | 'DELETE_HABIT';
  description: string;
  params: string[];
}

interface AIConfirmationProps {
  actions: PendingAction[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function AIConfirmation({ actions, onConfirm, onCancel }: AIConfirmationProps) {
  const getActionIcon = (type: string) => {
    if (type.startsWith('DELETE_')) {
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
    return <Check className="w-4 h-4 text-primary" />;
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'CREATE_LIST': return 'Create List';
      case 'CREATE_TASK': return 'Create Task';
      case 'CREATE_GOAL': return 'Create Goal';
      case 'CREATE_HABIT': return 'Create Habit';
      case 'CREATE_PORTFOLIO': return 'Create Portfolio';
      case 'DELETE_TASK': return 'Delete Task';
      case 'DELETE_GOAL': return 'Delete Goal';
      case 'DELETE_HABIT': return 'Delete Habit';
      default: return type;
    }
  };

  return (
    <Card className="p-4 border-primary/30 bg-primary/5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-sm">Confirm Actions</h4>
          <p className="text-xs text-muted-foreground mt-1">
            The AI wants to make the following changes. Do you want to proceed?
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {actions.map((action, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 p-2 rounded-lg bg-background/50 border border-border/50"
          >
            {getActionIcon(action.type)}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                {getActionLabel(action.type)}
              </p>
              <p className="text-sm truncate">{action.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          size="sm"
          onClick={onConfirm}
          className="gap-2"
        >
          <Check className="w-4 h-4" />
          Confirm
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>
    </Card>
  );
}
