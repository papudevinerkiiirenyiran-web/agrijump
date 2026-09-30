'use client';

import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';

/**
 * Draggable bottom sheet with a native-app feel
 * - Collapsed: about 42 units visible, the map owns the top half
 * - Expanded: takes 86 units
 *
 * Heights are unitless numbers resolved in CSS so we can layer fallbacks
 * (dvh → JS-provided --vh → plain vh) for iOS Safari.
 */
const SHEET_UNITS = 86;
const COLLAPSE_OFFSET_UNITS = SHEET_UNITS - 42;

/** Drag distance (px) past which the sheet snaps to the opposite state. */
const SNAP_THRESHOLD = 28;

export default function BottomSheet({
  children,
  defaultExpanded = false,
}: {
  children: (expanded: boolean) => ReactNode;
  /** Start fully expanded (used on the empty-state welcome). */
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);
  const startExpanded = useRef<boolean>(false);
  const moved = useRef(false);

  /** How far the user can drag past either anchor before we clamp. */
  const clamp = (v: number) =>
    startExpanded.current
      ? Math.max(-50, Math.min(70, v))
      : Math.max(-70, Math.min(40, v));

  const onDown = (e: React.PointerEvent) => {
    // Ignore right-clicks etc.
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startY.current = e.clientY;
    startExpanded.current = expanded;
    moved.current = false;
    // Capture on the listener's element (the handle) — not on e.target,
    // which can be a child. Without this iOS Safari can drop pointermove
    // when the finger drifts slightly outside the original element.
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* setPointerCapture may throw if the pointer was already released */
    }
  };

  const onMove = (e: React.PointerEvent) => {
    if (startY.current == null) return;
    const delta = e.clientY - startY.current;
    if (Math.abs(delta) > 4) moved.current = true;
    setDrag(clamp(delta));
  };

  const onUp = (e: React.PointerEvent) => {
    if (startY.current == null) return;
    const total = e.clientY - startY.current;
    if (total < -SNAP_THRESHOLD) setExpanded(true);
    else if (total > SNAP_THRESHOLD) setExpanded(false);
    // No movement at all → a tap → handled by onClick
    startY.current = null;
    setDrag(0);
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onCancel = () => {
    startY.current = null;
    setDrag(0);
  };

  const offset = expanded ? 0 : COLLAPSE_OFFSET_UNITS;

  const vars = {
    '--sheet-h': SHEET_UNITS,
    '--sheet-offset': offset,
    '--sheet-drag': `${drag}px`,
  } as CSSProperties;

  const onClick = (e: React.MouseEvent) => {
    // If a drag actually happened, don't treat the release as a tap
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setExpanded((v) => !v);
  };

  return (
    <section
      className={clsx(
        'aj-sheet absolute inset-x-0 bottom-0 z-[600] flex flex-col rounded-t-sheet bg-paper-100 shadow-soft-lg dark:bg-ink-800',
        !expanded && drag === 0 && 'aj-sheet--animated'
      )}
      style={vars}
    >
      {/* Drag handle — generous hit area + visible chevron so users know
          they can swipe. The handle is the only place that listens for
          pointer drag; tapping anywhere on it (without movement) toggles. */}
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={expanded ? 'Collapse drop list' : 'Expand drop list'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        className="aj-grab flex shrink-0 select-none flex-col items-center justify-center gap-1.5 pb-3 pt-2.5 active:bg-black/[0.04] dark:active:bg-white/[0.05]"
      >
        <div className="h-1.5 w-11 rounded-full bg-ink-400/35 dark:bg-paper-100/25" />
        <span
          aria-hidden
          className={clsx(
            'aj-chev text-[10px] font-extrabold leading-none text-ink-400 dark:text-paper-300/60',
            expanded && 'is-up'
          )}
        >
          ▲
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">{children(expanded)}</div>
    </section>
  );
}