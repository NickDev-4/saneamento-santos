import type { MouseEvent, PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

interface Gesture {
  pointerId: number;
  origin: HTMLElement;
  startY: number;
  startHeight: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  height: number;
  moved: boolean;
  collapsed: number;
  expanded: number;
}

export function useBottomSheet(expanded: boolean, onExpandedChange: (expanded: boolean) => void) {
  const sheet = useRef<HTMLElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClickUntil = useRef(0);
  const [height, setHeight] = useState<number | null>(null);
  function clearGesture() {
    const current = gesture.current;
    gesture.current = null;
    if (current?.origin.hasPointerCapture(current.pointerId)) {
      current.origin.releasePointerCapture(current.pointerId);
    }
    setHeight(null);
  }
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767.98px)');
    const resize = () => clearGesture();
    media.addEventListener('change', resize);
    window.addEventListener('resize', resize);
    return () => {
      media.removeEventListener('change', resize);
      window.removeEventListener('resize', resize);
    };
  }, []);
  function start(event: PointerEvent<HTMLElement>) {
    if (
      !window.matchMedia('(max-width: 767.98px)').matches ||
      !event.isPrimary ||
      event.button !== 0 ||
      gesture.current
    )
      return;
    const target = event.target as HTMLElement;
    const origin = target.closest<HTMLElement>('[data-sheet-drag-area]');
    if (!origin) return;
    if (target.closest('a, button, input, select, textarea') && !target.closest('.sheet-handle'))
      return;
    const panel = sheet.current;
    if (!panel?.parentElement) return;

    const workspaceHeight = panel.parentElement.getBoundingClientRect().height;
    const maxHeight = Math.max(0, workspaceHeight - 78);
    const minHeight = Math.min(maxHeight, Math.min(275, Math.max(200, workspaceHeight * 0.48)));
    const startHeight = panel.getBoundingClientRect().height;
    gesture.current = {
      pointerId: event.pointerId,
      origin,
      startY: event.clientY,
      startHeight,
      height: startHeight,
      lastY: event.clientY,
      lastTime: performance.now(),
      velocity: 0,
      moved: false,
      collapsed: minHeight,
      expanded: maxHeight,
    };
    origin.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const distance = current.startY - event.clientY;
    if (Math.abs(distance) > 4) current.moved = true;
    if (!current.moved) return;

    const time = performance.now();
    const elapsed = time - current.lastTime;
    if (elapsed > 0) current.velocity = (current.lastY - event.clientY) / elapsed;
    current.lastTime = time;
    current.lastY = event.clientY;
    current.height = Math.min(
      current.expanded,
      Math.max(current.collapsed, current.startHeight + distance),
    );
    setHeight(current.height);
  }
  function finish(event: PointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (current.moved) {
      const recentVelocity = performance.now() - current.lastTime < 120 ? current.velocity : 0;
      const projectedHeight = current.height + recentVelocity * 120;
      onExpandedChange(projectedHeight >= (current.collapsed + current.expanded) / 2);
      suppressClickUntil.current = performance.now() + 400;
    }
    clearGesture();
  }
  function click(event: MouseEvent<HTMLButtonElement>) {
    // Pointer release can synthesize a click after a drag. Keyboard clicks still work.
    if (event.detail > 0 && performance.now() < suppressClickUntil.current) return;
    onExpandedChange(!expanded);
  }
  return { sheet, gesture, height, clearGesture, start, move, finish, click };
}

export type BottomSheetController = ReturnType<typeof useBottomSheet>;
