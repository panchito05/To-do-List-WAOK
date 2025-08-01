import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, MoveVertical } from 'lucide-react';

interface MoveMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentIndex: number;
  totalItems: number;
  onMove: (toIndex: number) => void;
  itemType: 'feature' | 'step';
  anchorRef?: React.RefObject<HTMLElement>;
}

function MoveMenu({ 
  isOpen, 
  onClose, 
  currentIndex, 
  totalItems, 
  onMove, 
  itemType,
  anchorRef 
}: MoveMenuProps) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          anchorRef?.current && !anchorRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  // Generate available positions (all except current position)
  const availablePositions = Array.from({ length: totalItems }, (_, i) => i)
    .filter(i => i !== currentIndex);

  // Calculate menu position
  const getMenuPosition = () => {
    if (!anchorRef?.current) return {};
    
    const rect = anchorRef.current.getBoundingClientRect();
    const menuHeight = 200; // Approximate max height
    const spaceBelow = window.innerHeight - rect.bottom;
    
    if (spaceBelow < menuHeight) {
      // Show above
      return {
        bottom: `${window.innerHeight - rect.top + 5}px`,
        left: `${rect.left}px`
      };
    } else {
      // Show below
      return {
        top: `${rect.bottom + 5}px`,
        left: `${rect.left}px`
      };
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[rgb(var(--bg-primary))] rounded-lg shadow-xl border border-[rgb(var(--border-primary))] py-2 min-w-[200px] max-h-[300px] overflow-y-auto"
      style={getMenuPosition()}
    >
      <div className="px-3 py-2 text-sm font-semibold text-[rgb(var(--text-secondary))] border-b border-[rgb(var(--border-primary))] flex items-center gap-2">
        <MoveVertical size={16} />
        {t('actions.moveBelow')}
      </div>
      
      {/* Option to move to the beginning */}
      <button
        onClick={() => {
          onMove(0);
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-[rgb(var(--bg-secondary))] transition-colors flex items-center gap-2"
      >
        <span className="text-[rgb(var(--primary-600))] font-medium">
          {t('actions.moveToStart')}
        </span>
      </button>
      
      {availablePositions.map((position) => (
        <button
          key={position}
          onClick={() => {
            onMove(position < currentIndex ? position + 1 : position);
            onClose();
          }}
          className="w-full px-4 py-2 text-left hover:bg-[rgb(var(--bg-secondary))] transition-colors flex items-center gap-2"
        >
          <span className="text-[rgb(var(--text-secondary))]">
            {t('actions.moveAfter')}
          </span>
          <span className="text-[rgb(var(--primary-600))] font-medium">
            #{position + 1}
          </span>
        </button>
      ))}
    </div>
  );
}

export default MoveMenu;