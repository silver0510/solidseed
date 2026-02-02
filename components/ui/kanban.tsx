'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface KanbanColumn<T> {
  id: string;
  title: string;
  items: T[];
  count?: number;
  subtitle?: string;
  icon?: React.ReactNode;
  headerClassName?: string;
  columnClassName?: string;
}

export interface KanbanBoardProps<T extends { id: string }> {
  columns: KanbanColumn<T>[];
  onDragEnd: (itemId: string, sourceColumnId: string, targetColumnId: string) => void;
  renderCard: (item: T, isDragging?: boolean) => React.ReactNode;
  renderOverlay?: (item: T) => React.ReactNode;
  onItemClick?: (item: T) => void;
  className?: string;
  columnClassName?: string;
  cardClassName?: string;
  emptyMessage?: string;
  showMobileAccordion?: boolean;
  mobileAccordionRenderCard?: (item: T, columnId: string) => React.ReactNode;
}

export interface KanbanColumnProps<T extends { id: string }> {
  column: KanbanColumn<T>;
  renderCard: (item: T, isDragging?: boolean) => React.ReactNode;
  onItemClick?: (item: T) => void;
  className?: string;
  cardClassName?: string;
  emptyMessage?: string;
}

export interface KanbanCardProps {
  id: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  showDragHandle?: boolean;
}

// =============================================================================
// KANBAN CARD COMPONENT
// =============================================================================

export function KanbanCard({
  id,
  children,
  onClick,
  className,
  showDragHandle = false,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click when dragging
    if (isDragging) return;
    onClick?.();
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab p-3 transition-all hover:shadow-md active:cursor-grabbing',
        isDragging && 'z-50 opacity-50 shadow-2xl',
        className
      )}
      onClick={handleClick}
    >
      {showDragHandle ? (
        <div className="flex items-start gap-2">
          <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      ) : (
        children
      )}
    </Card>
  );
}

// =============================================================================
// KANBAN COLUMN COMPONENT
// =============================================================================

function KanbanColumnInternal<T extends { id: string }>({
  column,
  renderCard,
  onItemClick,
  className,
  cardClassName,
  emptyMessage = 'No items',
}: KanbanColumnProps<T>) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className={cn('flex min-w-column flex-col md:min-w-column-md', className)}>
      {/* Column Header */}
      <div className={cn('mb-3 flex items-center justify-between', column.headerClassName)}>
        <div className="flex items-center gap-2">
          {column.icon}
          <h3 className="font-semibold text-foreground">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {column.count ?? column.items.length}
          </Badge>
        </div>
        {column.subtitle && (
          <p className="text-sm font-medium text-muted-foreground">
            {column.subtitle}
          </p>
        )}
      </div>

      {/* Droppable Area */}
      <Card
        ref={setNodeRef}
        className={cn(
          'flex-1 border-2 border-dashed bg-muted/20 p-3 transition-colors',
          isOver && 'border-primary bg-primary/5',
          column.columnClassName
        )}
      >
        <ScrollArea className="h-[calc(100vh-240px)]">
          <SortableContext
            items={column.items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 pr-4">
              {column.items.length === 0 ? (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                </div>
              ) : (
                column.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onItemClick?.(item)}
                    className={cn('cursor-pointer', cardClassName)}
                  >
                    {renderCard(item, false)}
                  </div>
                ))
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </Card>
    </div>
  );
}

// Export memoized version
export const KanbanColumnComponent = React.memo(KanbanColumnInternal) as typeof KanbanColumnInternal;

// =============================================================================
// KANBAN BOARD COMPONENT
// =============================================================================

export function KanbanBoard<T extends { id: string }>({
  columns,
  onDragEnd,
  renderCard,
  renderOverlay,
  onItemClick,
  className,
  columnClassName,
  cardClassName,
  emptyMessage = 'No items',
  showMobileAccordion = true,
  mobileAccordionRenderCard,
}: KanbanBoardProps<T>) {
  const [activeItem, setActiveItem] = React.useState<T | null>(null);

  // DnD sensors with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  // Find item by ID across all columns
  const findItemById = React.useCallback(
    (id: UniqueIdentifier): { item: T; columnId: string } | null => {
      for (const column of columns) {
        const item = column.items.find((item) => item.id === id);
        if (item) {
          return { item, columnId: column.id };
        }
      }
      return null;
    },
    [columns]
  );

  // Handle drag start
  const handleDragStart = React.useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const found = findItemById(active.id);
      if (found) {
        setActiveItem(found.item);
      }
    },
    [findItemById]
  );

  // Handle drag end
  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveItem(null);

      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // Find the source column
      const sourceFound = findItemById(activeId);
      if (!sourceFound) return;

      const sourceColumnId = sourceFound.columnId;

      // Determine target column (could be a column id or an item id)
      let targetColumnId = overId;

      // Check if overId is a column
      const isColumn = columns.some((col) => col.id === overId);

      if (!isColumn) {
        // overId is an item, find its column
        const targetFound = findItemById(overId);
        if (targetFound) {
          targetColumnId = targetFound.columnId;
        }
      }

      // Only trigger if actually moving to a different column
      if (sourceColumnId !== targetColumnId) {
        onDragEnd(activeId, sourceColumnId, targetColumnId);
      }
    },
    [columns, findItemById, onDragEnd]
  );

  // Check if there are any items across all columns
  const totalItems = columns.reduce((sum, col) => sum + col.items.length, 0);

  if (totalItems === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">{emptyMessage}</div>
    );
  }

  return (
    <>
      {/* Desktop View: Horizontal Columns */}
      <div className={cn('hidden md:block', className)}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((column) => (
              <KanbanColumnComponent
                key={column.id}
                column={column}
                renderCard={renderCard}
                onItemClick={onItemClick}
                className={columnClassName}
                cardClassName={cardClassName}
                emptyMessage={emptyMessage}
              />
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeItem ? (
              renderOverlay ? (
                renderOverlay(activeItem)
              ) : (
                renderCard(activeItem, true)
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Mobile View: Accordion */}
      {showMobileAccordion && (
        <div className="md:hidden">
          <Accordion type="single" collapsible className="space-y-2">
            {columns.map((column) => (
              <AccordionItem
                key={column.id}
                value={column.id}
                className="rounded-lg border bg-card"
              >
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex w-full items-center justify-between pr-2">
                    <div className="flex items-center gap-2">
                      {column.icon}
                      <span className="font-semibold">{column.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {column.count ?? column.items.length}
                      </Badge>
                    </div>
                    {column.subtitle && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {column.subtitle}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3">
                    {column.items.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        {emptyMessage}
                      </p>
                    ) : (
                      column.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => onItemClick?.(item)}
                          className="cursor-pointer"
                        >
                          {mobileAccordionRenderCard
                            ? mobileAccordionRenderCard(item, column.id)
                            : renderCard(item, false)}
                        </div>
                      ))
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </>
  );
}

// =============================================================================
// SIMPLE KANBAN BOARD (without dnd-kit, uses HTML5 drag API)
// =============================================================================

export interface SimpleKanbanBoardProps<T extends { id: string }> {
  columns: KanbanColumn<T>[];
  onDragEnd: (itemId: string, sourceColumnId: string, targetColumnId: string) => void;
  renderCard: (item: T, isDragging?: boolean) => React.ReactNode;
  onItemClick?: (item: T) => void;
  className?: string;
  columnClassName?: string;
  emptyMessage?: string;
}

export function SimpleKanbanBoard<T extends { id: string }>({
  columns,
  onDragEnd,
  renderCard,
  onItemClick,
  className,
  columnClassName,
  emptyMessage = 'No items',
}: SimpleKanbanBoardProps<T>) {
  const [draggedItem, setDraggedItem] = React.useState<{
    item: T;
    columnId: string;
  } | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = React.useState<string | null>(null);

  const handleDragStart = (item: T, columnId: string) => {
    setDraggedItem({ item, columnId });
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumnId(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem.columnId !== targetColumnId) {
      onDragEnd(draggedItem.item.id, draggedItem.columnId, targetColumnId);
    }
    setDraggedItem(null);
    setDragOverColumnId(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumnId(null);
  };

  return (
    <div
      className={cn('grid grid-cols-1 gap-4 md:grid-cols-3', className)}
      onDragEnd={handleDragEnd}
    >
      {columns.map((column) => (
        <div
          key={column.id}
          className={cn(
            'flex min-h-[500px] flex-col rounded-lg p-3 transition-all duration-200',
            column.columnClassName,
            dragOverColumnId === column.id && 'ring-2 ring-primary ring-offset-2',
            columnClassName
          )}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          {/* Column Header */}
          <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-2">
            <div className="flex items-center gap-2">
              {column.icon}
              <h3 className="text-sm font-semibold">{column.title}</h3>
            </div>
            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {column.count ?? column.items.length}
            </span>
          </div>

          {/* Items */}
          <div className="flex-1">
            {column.items.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <div className="space-y-2">
                {column.items.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item, column.id)}
                    onClick={() => onItemClick?.(item)}
                    className={cn(
                      'cursor-pointer transition-all duration-200',
                      draggedItem?.item.id === item.id && 'scale-95 opacity-40'
                    )}
                  >
                    {renderCard(item, draggedItem?.item.id === item.id)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default KanbanBoard;
