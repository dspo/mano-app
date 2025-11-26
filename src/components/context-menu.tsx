import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { cn } from '../../lib/utils';

// Context types for context menu
interface ContextMenuContextType {
  open: boolean;
  x: number;
  y: number;
  close: () => void;
  openMenu: (event: React.MouseEvent) => void;
}

// Create context with null default value
const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

/**
 * ContextMenuProvider - Provides context menu functionality to children components
 */
export const ContextMenuProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Open menu at clicked position
  const openMenu = (event: React.MouseEvent) => {
    event.preventDefault(); // Prevent default browser context menu
    setPosition({ x: event.clientX, y: event.clientY });
    setOpen(true);
  };

  // Close menu
  const close = () => {
    setOpen(false);
  };

  // Handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if click is outside the menu
      if (!event.target || !(event.target as Element).closest('[data-context-menu]')) {
        close();
      }
    };

    // Handle Escape key to close menu
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const value = {
    open,
    x: position.x,
    y: position.y,
    close,
    openMenu,
  };

  return (
    <ContextMenuContext.Provider value={value}>
      {children}
    </ContextMenuContext.Provider>
  );
};

/**
 * useContextMenu - Hook to access context menu functionality
 */
export const useContextMenu = () => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }
  return context;
};

/**
 * ContextMenu - Core context menu component
 */
export const ContextMenu: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const { open, x, y } = useContextMenu();
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle positioning to ensure menu stays within viewport
  useEffect(() => {
    if (menuRef.current && open) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust position if menu goes out of viewport
      let adjustedX = x;
      let adjustedY = y;

      // Check right boundary
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width;
      }

      // Check bottom boundary
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height;
      }

      // Apply adjustments
      if (adjustedX !== x || adjustedY !== y) {
        menu.style.left = `${adjustedX}px`;
        menu.style.top = `${adjustedY}px`;
      }
    }
  }, [open, x, y]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      data-context-menu
      className={cn(
        'fixed z-50 w-56 rounded-md border border-gray-200 bg-white shadow-lg outline-none',
        'dark:border-gray-700 dark:bg-gray-800',
        className
      )}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
};

/**
 * ContextMenuItem - Menu item component for context menu
 */
export const ContextMenuItem: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}> = ({ children, onClick, className, icon, disabled = false }) => {
  const { close } = useContextMenu();

  const handleClick = () => {
    if (!disabled) {
      onClick();
      close();
    }
  };

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 focus-visible:ring-offset-1',
        'hover:bg-gray-100 focus:bg-gray-100',
        'dark:hover:bg-gray-700 dark:focus:bg-gray-700 dark:focus-visible:ring-gray-600 dark:focus-visible:ring-offset-gray-800',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      onClick={handleClick}
      disabled={disabled}
    >
      {icon && (
        <span className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </button>
  );
};

/**
 * ContextMenuSeparator - Separator component for context menu
 */
export const ContextMenuSeparator: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div className={cn('h-px bg-gray-200 dark:bg-gray-700', className)} />
  );
};