import { useContext } from "react"
// Make sure ToastContext is exported from './toast', or import the correct context
import { ToastContext } from "./toast"
// If only default export exists, use:
// import ToastContext from "./toast"

export const useToast = () => {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  return context
}
