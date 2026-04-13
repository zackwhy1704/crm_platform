"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export type KanbanCard = {
  id: string;
  stage: string;
  name: string;
  subtitle: string;
  value: string;
  initials: string;
  age: string;
  score?: number;
  won?: boolean;
};

export type KanbanColumn = {
  stage: string;
  label: string;
  count: number;
};

const stageClass: Record<string, { label: string; bar: string }> = {
  new: { label: "text-slate-500", bar: "bg-slate-300" },
  qualified: { label: "text-accent", bar: "bg-accent" },
  proposal: { label: "text-amber", bar: "bg-amber" },
  negotiation: { label: "text-purple", bar: "bg-purple" },
  won: { label: "text-green", bar: "bg-green" },
};

function DraggableCard({ card, isOverlay }: { card: KanbanCard; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      {...(isOverlay ? {} : { ...attributes, ...listeners })}
      className={cn(
        "bg-surface border border-border1 rounded px-2.5 py-2.5 cursor-grab shadow-sm transition-all select-none",
        card.won && "border-green/30 bg-green-light/40",
        isDragging && "opacity-30",
        isOverlay && "shadow-lg ring-2 ring-accent/30 rotate-2 cursor-grabbing",
      )}
    >
      <div className="text-xs font-semibold mb-0.5">{card.name}</div>
      <div className="text-[10.5px] text-ink-3 mb-2">{card.subtitle}</div>
      <div className={cn("font-mono text-[11px] font-medium", card.won ? "text-green" : "text-accent")}>
        {card.value}
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8.5px] font-bold bg-accent-light text-accent">
            {card.initials}
          </div>
          {card.score !== undefined && card.score > 0 && (
            <span className="text-[9px] font-mono text-ink-3">{card.score}</span>
          )}
        </div>
        <span className="text-[10px] text-ink-3 font-mono">{card.age}</span>
      </div>
    </div>
  );
}

function DroppableColumn({
  column,
  cards,
  isOver,
}: {
  column: KanbanColumn;
  cards: KanbanCard[];
  isOver: boolean;
}) {
  const cls = stageClass[column.stage] ?? stageClass.new;
  const { setNodeRef } = useDroppable({ id: column.stage });

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-52 flex flex-col gap-1.5 min-h-[200px]">
      <div className="pb-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className={cn("text-[10.5px] font-bold uppercase tracking-wider", cls.label)}>
            {column.label}
          </span>
          <span className="text-[10px] font-mono bg-surface2 text-ink-3 px-1.5 py-px rounded-full">
            {cards.length}
          </span>
        </div>
        <div className={cn("h-[3px] rounded w-full", cls.bar)} />
      </div>
      <div
        className={cn(
          "flex-1 flex flex-col gap-1.5 rounded-lg p-1 -m-1 transition-colors min-h-[100px]",
          isOver && "bg-accent/5 ring-1 ring-accent/20 ring-dashed",
        )}
      >
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} />
        ))}
        {cards.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-[10px] text-ink-3/50 border border-dashed border-border1 rounded min-h-[60px]">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  columns,
  cards: initialCards,
  onMoveCard,
}: {
  columns: KanbanColumn[];
  cards: KanbanCard[];
  onMoveCard?: (cardId: string, newStage: string) => void;
}) {
  const [cards, setCards] = useState(initialCards);
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveCard(event.active.data.current?.card ?? null);
  }

  function handleDragOver(event: any) {
    const over = event.over;
    if (over) {
      // over.id could be a column stage or another card id
      const colStage = columns.find((c) => c.stage === over.id)
        ? (over.id as string)
        : cards.find((c) => c.id === over.id)?.stage ?? null;
      setOverColumn(colStage);
    } else {
      setOverColumn(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);
    setOverColumn(null);

    if (!over) return;

    const cardId = active.id as string;
    // Determine target column
    let targetStage = columns.find((c) => c.stage === over.id)
      ? (over.id as string)
      : cards.find((c) => c.id === over.id)?.stage;

    if (!targetStage) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.stage === targetStage) return;

    // Update local state
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, stage: targetStage!, won: targetStage === "won" } : c)),
    );

    // Callback to persist
    onMoveCard?.(cardId, targetStage);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 p-4 overflow-x-auto">
        {columns.map((col) => (
          <DroppableColumn
            key={col.stage}
            column={col}
            cards={cards.filter((c) => c.stage === col.stage)}
            isOver={overColumn === col.stage}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? <DraggableCard card={activeCard} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
