import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTeamSlotProps {
    id: string;
    children: React.ReactNode;
    disabled?: boolean;
}

export function SortableTeamSlot({ id, children, disabled }: SortableTeamSlotProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 'auto',
        position: 'relative' as const,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`h-full rounded-lg ${isOver && !isDragging ? 'ring-2 ring-primary-400 dark:ring-primary-500 ring-offset-2 dark:ring-offset-dark-bg-primary' : ''}`}
        >
            {children}
        </div>
    );
}
