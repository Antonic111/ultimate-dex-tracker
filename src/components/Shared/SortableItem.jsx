import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    maxWidth: '100%',
    overflow: 'hidden',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners)} {/* <-- pass listeners to children */}
    </div>
  );
}
