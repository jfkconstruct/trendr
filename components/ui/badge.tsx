import * as React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-gray-100 text-gray-800',
      secondary: 'bg-blue-100 text-blue-800',
      destructive: 'bg-red-100 text-red-800',
      outline: 'border border-gray-200 bg-transparent hover:bg-gray-50'
    }

    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantClasses[variant]} ${className || ''}`}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
