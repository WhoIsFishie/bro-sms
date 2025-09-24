import { cn } from '../lib/utils'

export function LoadingSpinner({ className, ...props }) {
  return (
    <div
      className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', className)}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}