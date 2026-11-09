'use client';
import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import Button from '@/components/buttons/Button';
export default function SortablePlan({
  id,
  name,
  first,
  last,
  disabled,
  onMove,
  children,
}: {
  id: string;
  name: string;
  first: boolean;
  last: boolean;
  disabled: boolean;
  onMove: (direction: number) => void;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`surface min-w-0 p-5 ${isDragging ? 'relative z-10 shadow-surface' : ''}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <Button
          variant="ghost"
          className="touch-none px-2"
          disabled={disabled}
          {...attributes}
          {...listeners}
          aria-label={`Drag ${name}`}
        >
          <GripVertical size={20} />
        </Button>
        <Button
          variant="secondary"
          className="px-2"
          disabled={disabled || first}
          onClick={() => onMove(-1)}
          aria-label={`Move ${name} up`}
        >
          <ArrowUp size={18} />
        </Button>
        <Button
          variant="secondary"
          className="px-2"
          disabled={disabled || last}
          onClick={() => onMove(1)}
          aria-label={`Move ${name} down`}
        >
          <ArrowDown size={18} />
        </Button>
      </div>
      {children}
    </article>
  );
}
