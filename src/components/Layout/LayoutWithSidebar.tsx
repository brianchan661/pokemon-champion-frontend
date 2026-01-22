import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdContainer } from '@/components/Ads';

interface LayoutWithSidebarProps {
  children: ReactNode;
  /** Hide sidebar on specific pages */
  hideSidebar?: boolean;
}

/**
 * Layout component with right sidebar containing AdSense ads
 * Similar to pokecabook.com layout structure.
 * Updated to use fixed size ad containers.
 */
export const LayoutWithSidebar = ({ children, hideSidebar = false }: LayoutWithSidebarProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8 py-8">
            {/* Main Content Area */}
            <div className="flex-1">
              {children}
            </div>

            {/* Right Sidebar with Ads - pokecabook.com style */}
            {!hideSidebar && (
              <div className="w-full lg:w-96 xl:w-80 flex-shrink-0">
                <div className="sticky top-4">
                  <div className="space-y-8">
                    <ErrorBoundary>
                      <AdContainer
                        placement="sidebar-top"
                        className="w-full adsense-sidebar-container"
                      />
                    </ErrorBoundary>

                    {/* Middle Sidebar Ad */}
                    <ErrorBoundary>
                      <AdContainer
                        placement="sidebar-middle"
                        className="w-full adsense-sidebar-container"
                      />
                    </ErrorBoundary>

                    {/* Bottom Sidebar Ad */}
                    <ErrorBoundary>
                      <AdContainer
                        placement="sidebar-bottom"
                        className="w-full adsense-sidebar-container"
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};