import { useEffect } from 'react';
import { useReviewStore } from '../store/useReviewStore';

export function useKeyboardNavigation(enabled = true) {
  const {
    selectedFindingId,
    setStatus,
    nextFinding,
    prevFinding,
    zenMode,
    setZenMode,
    showSummaryModal,
    toggleSummaryModal,
    showShortcutsModal,
    toggleShortcutsModal,
  } = useReviewStore();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in form inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Escape key
      if (e.key === 'Escape') {
        if (showSummaryModal) toggleSummaryModal(false);
        else if (showShortcutsModal) toggleShortcutsModal(false);
        else if (zenMode) setZenMode(false);
        return;
      }

      // '?' key
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        toggleShortcutsModal();
        return;
      }

      // 'z' or 'Z' key: Zen mode
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        setZenMode(!zenMode);
        return;
      }

      // Navigation: J or ArrowDown
      if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextFinding();
        return;
      }

      // Navigation: K or ArrowUp
      if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevFinding();
        return;
      }

      // Action: 'A' or 'a' -> Accept
      if (e.key === 'a' || e.key === 'A') {
        if (!selectedFindingId) return;
        e.preventDefault();
        setStatus(selectedFindingId, 'accepted');
        return;
      }

      // Action: 'D' or 'd' -> Dismiss
      if (e.key === 'd' || e.key === 'D') {
        if (!selectedFindingId) return;
        e.preventDefault();
        setStatus(selectedFindingId, 'dismissed');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedFindingId,
    enabled,
    setStatus,
    nextFinding,
    prevFinding,
    zenMode,
    setZenMode,
    showSummaryModal,
    toggleSummaryModal,
    showShortcutsModal,
    toggleShortcutsModal,
  ]);
}
