import * as React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, asChild = false, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
    
    const variantClasses = {
      default: 'bg-gray-900 text-white hover:bg-gray-800',
      outline: 'border border-gray-200 hover:bg-gray-50',
      ghost: 'hover:bg-gray-100'
    }

    const sizeClasses = {
      default: 'h-10 py-2 px-4',
      sm: 'h-9 px-3 rounded-md',
      lg: 'h-11 px-8 rounded-md'
    }

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`

    if (asChild) {
      if (React.isValidElement(children)) {
        const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<unknown> }>
        return React.cloneElement(child, {
          ...child.props,
          ...props,
          className: `${classes} ${child.props.className || ''}`,
          // Only pass ref if the child accepts refs
          ...(child.type && typeof child.type !== 'string' ? { ref } : {})
        })
      }
      return children
    }

    return (
      <button
        className={classes}
        ref={ref}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
