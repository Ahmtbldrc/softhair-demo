import { toast } from "@/hooks/use-toast"

interface ErrorHandlerOptions {
  title: string
  defaultMessage: string
  variant?: "default" | "destructive"
}

export function handleError(error: unknown, options: ErrorHandlerOptions) {
  console.error(options.title, error)
  
  toast({
    title: options.title,
    description: error instanceof Error ? error.message : options.defaultMessage,
    variant: options.variant ?? "destructive"
  })
}

export function handleSuccess(title: string, description: string) {
  toast({
    title,
    description,
    variant: "default"
  })
} 