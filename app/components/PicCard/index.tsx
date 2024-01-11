import { Progress, UploadFile } from "antd";
import type { FC } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

export interface CardProps {
  originNode: React.ReactElement<
    any,
    string | React.JSXElementConstructor<any>
  >;
  file: UploadFile<any>;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export const PicCard: FC<CardProps> = ({ originNode, file }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: file.uid,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "move",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "is-dragging" : ""}
      {...attributes}
      {...listeners}
    >
      {originNode}
    </div>
  );
};
