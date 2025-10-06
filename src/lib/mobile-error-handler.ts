interface MobileErrorData {
  isMobile: boolean
  deviceType: 'mobile' | 'tablet' | 'desktop'
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown'
  browser: string
  screenSize: {
    width: number
    height: number
  }
  touchSupport: boolean
  orientation: 'portrait' | 'landscape'
}

export class MobileErrorHandler {
  private static instance: MobileErrorHandler
  private mobileInfo: MobileErrorData | null = null

  static getInstance(): MobileErrorHandler {
    if (!MobileErrorHandler.instance) {
      MobileErrorHandler.instance = new MobileErrorHandler()
    }
    return MobileErrorHandler.instance
  }

  private constructor() {
    this.detectMobileInfo()
  }

  private detectMobileInfo(): MobileErrorData {
    if (this.mobileInfo) return this.mobileInfo

    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      // Return default values for SSR
      this.mobileInfo = {
        isMobile: false,
        deviceType: 'desktop',
        platform: 'unknown',
        browser: 'unknown',
        screenSize: {
          width: 1024,
          height: 768,
        },
        touchSupport: false,
        orientation: 'landscape',
      }
      return this.mobileInfo
    }

    const userAgent = navigator.userAgent.toLowerCase()
    const screen = window.screen

    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent)
    
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
    if (isMobile && !isTablet) deviceType = 'mobile'
    else if (isTablet) deviceType = 'tablet'

    let platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown' = 'unknown'
    if (/iphone|ipad|ipod/i.test(userAgent)) platform = 'ios'
    else if (/android/i.test(userAgent)) platform = 'android'
    else if (/windows/i.test(userAgent)) platform = 'windows'
    else if (/macintosh|mac os x/i.test(userAgent)) platform = 'macos'
    else if (/linux/i.test(userAgent)) platform = 'linux'

    const browser = this.detectBrowser(userAgent)
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const orientation = screen.width > screen.height ? 'landscape' : 'portrait'

    this.mobileInfo = {
      isMobile,
      deviceType,
      platform,
      browser,
      screenSize: {
        width: screen.width,
        height: screen.height,
      },
      touchSupport,
      orientation,
    }

    return this.mobileInfo
  }

  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('chrome')) return 'chrome'
    if (userAgent.includes('firefox')) return 'firefox'
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari'
    if (userAgent.includes('edge')) return 'edge'
    if (userAgent.includes('opera')) return 'opera'
    return 'unknown'
  }

  getMobileInfo(): MobileErrorData {
    return this.detectMobileInfo()
  }

  isMobileDevice(): boolean {
    return this.detectMobileInfo().isMobile
  }

  getMobileSpecificErrorMessage(error: Error): string {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return error.message
    }

    const mobileInfo = this.getMobileInfo()
    
    // Common mobile-specific error messages
    if (error.message.includes('getUserMedia')) {
      return 'Microphone access is required for voice chat. Please allow microphone permissions in your browser settings.'
    }
    
    if (error.message.includes('WebRTC') || error.message.includes('RTCPeerConnection')) {
      return 'Voice chat is not supported on this device. Please try using a different browser or device.'
    }
    
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      if (mobileInfo.platform === 'ios') {
        return 'Network error detected. Please check your internet connection and try again. If using Safari, try refreshing the page.'
      } else if (mobileInfo.platform === 'android') {
        return 'Network error detected. Please check your internet connection and try again. If the issue persists, try clearing your browser cache.'
      }
      return 'Network error detected. Please check your internet connection and try again.'
    }
    
    if (error.message.includes('Permission')) {
      return 'Permission denied. Please check your browser settings and allow the required permissions for this app to work properly.'
    }
    
    if (error.message.includes('Storage') || error.message.includes('localStorage')) {
      return 'Storage error detected. Please try clearing your browser data and refreshing the page.'
    }
    
    // Generic mobile-friendly error message
    if (mobileInfo.isMobile) {
      return 'An error occurred while using the app. Please try refreshing the page or restarting the app. If the problem continues, please contact support.'
    }
    
    return error.message
  }

  getMobileSpecificRecoveryActions(): string[] {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return ['Refresh the page', 'Check your internet connection', 'Try a different browser']
    }

    const mobileInfo = this.getMobileInfo()
    const actions: string[] = []
    
    if (mobileInfo.isMobile) {
      actions.push('Refresh the page')
      actions.push('Check your internet connection')
      actions.push('Try using a different browser')
      
      if (mobileInfo.platform === 'ios') {
        actions.push('Try Safari or Chrome')
        actions.push('Check if you have the latest iOS version')
      } else if (mobileInfo.platform === 'android') {
        actions.push('Try Chrome or Firefox')
        actions.push('Clear browser cache and data')
      }
      
      actions.push('Restart your device if the problem persists')
    } else {
      actions.push('Refresh the page')
      actions.push('Check your internet connection')
      actions.push('Try a different browser')
    }
    
    return actions
  }

  shouldShowMobileSpecificUI(): boolean {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return false
    }
    return this.isMobileDevice()
  }
}

export const mobileErrorHandler = MobileErrorHandler.getInstance()
