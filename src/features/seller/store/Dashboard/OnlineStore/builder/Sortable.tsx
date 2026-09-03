import type { ReactNode } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

/** Generic drag-to-reorder list — array index IS the order (matches the backend's embedded-array model), so `onReorder` just receives the whole reordered array to persist. Identity for drag tracking always comes from `keyFor`, never a hardcoded field — `_id` was never actually read anywhere in this file; the old `T extends { _id?: string }` constraint was vestigial and tripped TypeScript's "weak type" check for any item shape that doesn't itself declare an `_id` field (e.g. `MenuItem`, keyed by its own `id`). */
export function SortableList<T>({
  items, keyFor, onReorder, children,
}: {
  items: T[];
  keyFor: (item: T, index: number) => string;
  onReorder: (next: T[]) => void;
  children: (item: T, index: number) => ReactNode;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ids = items.map((item, i) => keyFor(item, i));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <SortableRow key={ids[i]} id={ids[i]}>
              {children(item, i)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1">
      <button {...attributes} {...listeners} type="button" aria-label="Drag to reorder"
        className="mt-3 shrink-0 w-6 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing bg-transparent border-none text-slate hover:text-charcoal">
        <GripVertical size={15} />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
