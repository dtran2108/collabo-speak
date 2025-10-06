# Error Handling Implementation

This document describes the comprehensive error handling system implemented for the chat/[sessionId]/page.tsx and the entire application, with special focus on mobile device error catching in production.

## Overview

The error handling system consists of multiple layers:

1. **React Error Boundaries** - Catch React component errors
2. **Global Error Handler** - Catch unhandled JavaScript errors and promise rejections
3. **Mobile-Specific Error UI** - Provide mobile-optimized error messages and recovery actions
4. **Error Logging Service** - Log errors for production monitoring
5. **Next.js Error Pages** - Handle route-level errors

## Components

### 1. ErrorBoundary (`src/components/ErrorBoundary.tsx`)

A React class component that catches JavaScript errors anywhere in the child component tree.

**Features:**
- Catches component errors and displays fallback UI
- Logs errors to console in development
- Sends errors to logging service in production
- Provides retry and reload functionality
- Extracts user and session context for better debugging

**Usage:**
```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Custom error handling
  }}
  fallback={<CustomErrorUI />}
>
  <YourComponent />
</ErrorBoundary>
```

### 2. Global Error Handler (`src/lib/error-handler.ts`)

A singleton class that handles unhandled errors globally.

**Features:**
- Catches unhandled JavaScript errors
- Catches unhandled promise rejections
- Monitors network request failures
- Logs errors with context (user ID, session ID, device info)
- Sends errors to logging service

**Usage:**
```typescript
import { errorHandler } from '@/lib/error-handler'

// Initialize (done automatically in GlobalErrorHandler component)
errorHandler.init()

// Manually log errors
errorHandler.logError(error, { additional: 'context' })
```

### 3. Mobile Error Handler (`src/lib/mobile-error-handler.ts`)

Detects mobile devices and provides mobile-specific error handling.

**Features:**
- Detects device type (mobile, tablet, desktop)
- Identifies platform (iOS, Android, etc.)
- Provides mobile-specific error messages
- Suggests mobile-appropriate recovery actions
- Detects touch support and screen orientation

**Usage:**
```typescript
import { mobileErrorHandler } from '@/lib/mobile-error-handler'

const isMobile = mobileErrorHandler.isMobileDevice()
const errorMessage = mobileErrorHandler.getMobileSpecificErrorMessage(error)
const actions = mobileErrorHandler.getMobileSpecificRecoveryActions()
```

### 4. Mobile Error UI (`src/components/MobileErrorUI.tsx`)

A React component that displays mobile-optimized error messages.

**Features:**
- Mobile-first design with touch-friendly buttons
- Platform-specific error messages and recovery suggestions
- Device information display for debugging
- Clear cache functionality for mobile browsers
- Responsive design that works on all screen sizes

### 5. Error Logging API (`src/app/api/error-log/route.ts`)

A Next.js API route that receives and processes error logs.

**Features:**
- Validates error data
- Logs to console in development
- Can be extended to send to external services (Sentry, LogRocket, etc.)
- Stores error context for debugging

## Implementation in Chat Page

The chat/[sessionId]/page.tsx file has been enhanced with:

1. **Error Boundary Wrapping**: The entire page and conversation component are wrapped in error boundaries
2. **Enhanced Error State**: Tracks both error messages and error objects
3. **Mobile-Specific Error UI**: Shows mobile-optimized error messages on mobile devices
4. **Comprehensive Error Logging**: Logs all errors with session context
5. **Global Error Handler Initialization**: Sets up global error catching

## Mobile-Specific Features

### Error Message Customization
- **Microphone errors**: "Microphone access is required for voice chat. Please allow microphone permissions in your browser settings."
- **Network errors**: Platform-specific suggestions (Safari vs Chrome on mobile)
- **Permission errors**: Clear instructions for mobile browser settings
- **Storage errors**: Guidance on clearing browser data

### Recovery Actions
- Refresh the page
- Check internet connection
- Try different browsers
- Clear browser cache/data
- Restart device (for persistent issues)

### Device Detection
- Detects iOS, Android, and other platforms
- Identifies mobile, tablet, and desktop devices
- Checks touch support and screen orientation
- Provides device-specific troubleshooting

## Production Monitoring

### Error Data Collected
- Error message and stack trace
- User ID and session ID (when available)
- Device information (type, platform, browser)
- Screen size and touch support
- Timestamp and URL
- Additional context (component, action, etc.)

### Logging Service Integration
The system is designed to integrate with external error monitoring services:

```typescript
// In src/app/api/error-log/route.ts
if (process.env.NODE_ENV === 'production') {
  // Send to Sentry, LogRocket, Bugsnag, etc.
  await sendToErrorService(errorData)
}
```

## Testing

A test page is available at `/test-error` that allows you to:

1. Test error boundaries
2. Trigger unhandled promise rejections
3. Test network error handling
4. Test mobile error UI
5. View device information
6. Test manual error logging

## Usage Instructions

### For Development
1. Errors are logged to console
2. Error details are shown in development mode
3. Use the test page to verify error handling

### For Production
1. Errors are sent to the logging service
2. Mobile users see optimized error messages
3. Error context helps with debugging
4. Recovery actions guide users to solutions

### For Mobile Testing
1. Test on actual mobile devices
2. Test different browsers (Safari, Chrome, Firefox)
3. Test different network conditions
4. Test microphone permission scenarios
5. Test with different screen orientations

## Error Types Handled

1. **React Component Errors**: Caught by ErrorBoundary
2. **Unhandled JavaScript Errors**: Caught by global error handler
3. **Unhandled Promise Rejections**: Caught by global error handler
4. **Network Request Failures**: Monitored by fetch wrapper
5. **API Errors**: Handled in individual components
6. **Route-Level Errors**: Handled by Next.js error pages

## Best Practices

1. **Always wrap components in ErrorBoundary** for critical features
2. **Use mobile-specific error messages** for better user experience
3. **Log errors with context** for easier debugging
4. **Provide clear recovery actions** for users
5. **Test on actual mobile devices** for accurate mobile experience
6. **Monitor error logs** in production for proactive issue resolution

## Future Enhancements

1. **Real-time Error Monitoring**: Integrate with services like Sentry
2. **Error Analytics**: Track error patterns and user impact
3. **Automatic Error Recovery**: Retry failed operations automatically
4. **User Feedback**: Allow users to report issues directly
5. **Error Prevention**: Proactive checks for common mobile issues
