# AdSense Components

This directory contains components for Google AdSense integration with proper error handling, loading states, and responsive design.

## Components

### AdSense
Core AdSense component with validation, error handling, and loading states.

```tsx
import { AdSense } from '@/components/Ads';

<AdSense 
  adSlot="1234567890"
  adFormat="auto"
  fullWidthResponsive={true}
  className="my-4"
/>
```

### AdContainer
High-level component that handles placement-specific logic and responsive ad slot selection.

```tsx
import { AdContainer } from '@/components/Ads';

<AdContainer placement="header" className="mb-4" />
<AdContainer placement="sidebar" />
<AdContainer placement="content" className="my-8" />
<AdContainer placement="footer" className="mt-4" />
```

## Configuration

### Environment Variables
Add to your `.env.local`:
```bash
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-1234567890123456
```

### Ad Slots Configuration
Update `src/config/adsense.ts` with your actual AdSense ad slot IDs:

```typescript
export const AD_SLOTS = {
  HEADER_BANNER: 'your-header-slot-id',
  SIDEBAR_RECTANGLE: 'your-sidebar-slot-id', 
  CONTENT_INLINE: 'your-content-slot-id',
  FOOTER_BANNER: 'your-footer-slot-id',
  MOBILE_BANNER: 'your-mobile-slot-id',
} as const;
```

## Features

- ✅ **Type Safety**: Full TypeScript support with proper type definitions
- ✅ **Error Handling**: Graceful error handling with development-only error display
- ✅ **Loading States**: Loading indicators while ads are being loaded
- ✅ **Ad Blocker Detection**: Detects ad blockers and shows friendly message to users
- ✅ **Responsive Design**: Automatic mobile/desktop ad slot selection
- ✅ **Performance**: Memoized components and optimized re-renders
- ✅ **Accessibility**: Proper ARIA labels and semantic HTML
- ✅ **Security**: Client ID validation and XSS protection
- ✅ **Environment Aware**: Only shows ads in production with valid configuration

## Usage Examples

### Basic Ad Placement
```tsx
import { AdSense } from '@/components/Ads';

export function MyPage() {
  return (
    <div>
      <h1>My Content</h1>
      <AdSense adSlot="1234567890" />
      <p>More content...</p>
    </div>
  );
}
```

### Responsive Ad Container
```tsx
import { AdContainer } from '@/components/Ads';

export function Layout({ children }) {
  return (
    <div>
      <header>
        <AdContainer placement="header" />
      </header>
      
      <main className="flex">
        <div className="content">
          {children}
          <AdContainer placement="content" className="my-8" />
        </div>
        
        <aside className="sidebar">
          <AdContainer placement="sidebar" />
        </aside>
      </main>
      
      <footer>
        <AdContainer placement="footer" />
      </footer>
    </div>
  );
}
```

### Custom Hook Usage
```tsx
import { useAdSense } from '@/hooks/useAdSense';

export function CustomAdComponent() {
  const { isLoading, error, isReady } = useAdSense('1234567890', 'ca-pub-1234567890123456');

  if (error) return <div>Ad failed to load</div>;
  if (isLoading) return <div>Loading ad...</div>;

  return <div>Ad is ready!</div>;
}
```

### Ad Blocker Detection
The AdSense component automatically detects ad blockers and displays a user-friendly message encouraging users to support the site. The detection works by:

1. Checking if the AdSense script loaded successfully
2. Monitoring for blocked ad elements
3. Displaying a polite message with a "Buy Me a Coffee" support option

```tsx
// Ad blocker detection is automatic in AdSense component
<AdSense adSlot="1234567890" />

// When ad blocker is detected, shows:
// "We noticed you're using an ad blocker. Ads help us keep the site free.
//  Consider supporting us on Buy Me a Coffee!"
```

The ad blocker message includes:
- Friendly explanation of why ads are needed
- Link to Buy Me a Coffee for alternative support
- Non-intrusive design that doesn't block content

## Development

### Testing
- Ads only show in production environment
- Development shows placeholder with error messages
- Use browser dev tools to test responsive behavior

### Debugging
- Check browser console for AdSense errors
- Verify environment variables are set correctly
- Ensure AdSense script is loaded in `_document.tsx`

### Performance
- Components are memoized to prevent unnecessary re-renders
- Ad loading is debounced to prevent rapid API calls
- Responsive ad slots reduce unnecessary network requests