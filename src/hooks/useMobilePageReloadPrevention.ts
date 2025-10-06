import { useEffect } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'

export const useMobilePageReloadPrevention = () => {
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!isMobile) return

    // Prevent page reload on mobile when there's an active conversation
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Only prevent reload if there's an active conversation
      const hasActiveConversation = document.querySelector('[data-conversation-active="true"]')
      
      if (hasActiveConversation) {
        event.preventDefault()
        event.returnValue = 'Are you sure you want to leave? Your conversation will be lost.'
        return 'Are you sure you want to leave? Your conversation will be lost.'
      }
    }

    // Prevent page reload on mobile
    const handleUnload = (event: Event) => {
      // Clean up any active media streams
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop())
          })
          .catch(() => {
            // Ignore errors during cleanup
          })
      }
    }

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handleUnload)

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handleUnload)
    }
  }, [isMobile])
}
