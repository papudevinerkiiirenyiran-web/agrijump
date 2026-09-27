'use client';

import { useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';

/**
 * Draggable bottom sheet with a native-app feel
 * - Collapsed: about 42vh visible, the map owns the top half
 * - Expanded: takes 86vh
 */
const SHEET_VH = 86;
const COLLAPSE_OFFSET_VH = SHEET_VH - 42;

export default function BottomSheet({
  children,
}: {
  children: (expanded: boolean) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);

  const clamp = (v: number) =>
    expanded ? Math.max(-40, Math.min(80, v)) : Math.max(-70, Math.min(40, v));

  const onDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (startY.current == null) return;
    setDrag(clamp(e.clientY - startY.current));
  };

  const onUp = () => {
    if (startY.current == null) return;
    if (drag < -48) setExpanded(true);
    else if (drag > 48) setExpanded(false);
    startY.current = null;
    setDrag(0);
  };

  const offset = expanded ? 0 : COLLAPSE_OFFSET_VH;

  return (
    <section
      className={clsx(
        'absolute inset-x-0 bottom-0 z-[600] flex flex-col rounded-t-sheet bg-paper-100 shadow-soft-lg dark:bg-ink-800',
        !expanded && 'transition-transform duration-300'
      )}
      style={{
        height: `${SHEET_VH}vh`,
        transform: `translate3d(0, calc(${offset}vh + ${drag}px), 0)`,
        transitionTimingFunction: 'cubic-bezier(.22,1,.36,1)',
      }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={() => setExpanded((v) => !v)}
        className="shrink-0 cursor-grab touch-none px-4 pb-1 pt-3 active:cursor-grabbing"
      >
        <div className="mx-auto h-1.5 w-11 rounded-full bg-ink-400/35 dark:bg-paper-100/25" />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">{children(expanded)}</div>
    </section>
  );
}
