'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  className?: string;
  ringClassName?: string;
}

/** Avatar that falls back to initials if the image fails */
export default function Avatar({
  src,
  name,
  size = 40,
  className,
  ringClassName = 'ring-paper-100 dark:ring-ink-900',
}: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <span
      className={clsx(
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-moss-200 text-moss-800 ring-2 dark:bg-moss-800 dark:text-moss-100',
        ringClassName,
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
      title={name}
    >
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="font-display font-bold leading-none">{initials}</span>
      )}
    </span>
  );
}
