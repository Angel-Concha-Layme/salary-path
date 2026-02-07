'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const ANIMATION_MS = 180;

export function Modal({ isOpen, title, closeLabel, onClose, children, size = 'md' }: ModalProps) {
  const titleId = useId();
  const [isRendered, setIsRendered] = useState(isOpen);
  const [animationState, setAnimationState] = useState<'open' | 'closing'>('open');
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setMountNode(document.body);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setIsRendered(true);
      setAnimationState('open');
      return;
    }

    if (isRendered) {
      setAnimationState('closing');
      closeTimeoutRef.current = window.setTimeout(() => {
        setIsRendered(false);
      }, ANIMATION_MS);
    }

    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [isOpen, isRendered]);

  useEffect(() => {
    if (!isRendered) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isRendered, onClose]);

  if (!isRendered || !mountNode) {
    return null;
  }

  return createPortal(
    <div className="modal-root" data-state={animationState}>
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label={closeLabel} />
      <dialog
        className={`modal-dialog modal-size-${size}`}
        aria-modal="true"
        aria-labelledby={titleId}
        open
      >
        <div className="modal-panel" role="document">
          <header className="modal-header">
            <h3 id={titleId} className="modal-title">{title}</h3>
            <button type="button" className="modal-close" onClick={onClose}>
              {closeLabel}
            </button>
          </header>
          <div className="modal-body">{children}</div>
        </div>
      </dialog>
    </div>
  , mountNode);
}
