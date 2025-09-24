import { AlertCircle, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { cn } from '../lib/utils'

export function ErrorAlert() {
  const { error, dispatch } = useApp()

  if (!error) return null

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 max-w-md',
      'bg-destructive text-destructive-foreground rounded-lg p-4',
      'border border-destructive/20 shadow-lg',
      'animate-in slide-in-from-top-2 duration-300'
    )}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium">Error</h4>
          <p className="text-sm mt-1 opacity-90">{error}</p>
        </div>
        <button
          onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
          className="flex-shrink-0 p-1 hover:bg-destructive/10 rounded-md transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}