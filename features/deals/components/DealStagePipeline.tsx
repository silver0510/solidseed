/**
 * DealStagePipeline Component
 *
 * A horizontal stepper-style pipeline that shows deal progression through stages.
 * Features:
 * - Visual stepper with circles connected by lines
 * - Completed stages show checkmarks
 * - Current stage is highlighted with pulse animation
 * - Future stages are grayed out
 * - Progress bar with percentage
 * - Mobile responsive with horizontal scroll
 */

'use client';

import { cn } from '@/lib/utils';
import type { PipelineStage } from '../types';
import { CheckIcon } from 'lucide-react';

export interface DealStagePipelineProps {
  stages: PipelineStage[];
  currentStage: string;
  dealTypeColor?: string;
}

export function DealStagePipeline({
  stages,
  currentStage,
  dealTypeColor = '#3b82f6',
}: DealStagePipelineProps) {
  // Filter out terminal 'lost' stage from the main pipeline display
  const mainStages = stages.filter((s) => s.code !== 'lost');
  const currentMainIndex = mainStages.findIndex((s) => s.code === currentStage);

  return (
    <div>
      {/* Stepper Pipeline */}
      <div className="relative">
        {/* Mobile: Horizontal scroll container - extra padding for pulse animation */}
        <div className="overflow-x-auto pt-3 pb-2 -mx-2 px-2 -mt-3">
          <div className="flex items-start min-w-max">
            {mainStages.map((stage, index) => {
              const isCompleted = index < currentMainIndex;
              const isCurrent = index === currentMainIndex;
              const isFuture = index > currentMainIndex;

              return (
                <div key={stage.code} className="flex items-start">
                  {/* Stage Item */}
                  <div className="flex flex-col items-center">
                    {/* Circle with pulse */}
                    <div className="relative h-10 w-10">
                      {/* Pulse animation ring */}
                      {isCurrent && (
                        <span
                          className="absolute -inset-1 animate-pulse rounded-full opacity-40"
                          style={{
                            backgroundColor: dealTypeColor,
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }}
                        />
                      )}
                      <div
                        className={cn(
                          'absolute inset-0 flex items-center justify-center rounded-full border-2 transition-all duration-300',
                          isCompleted && 'border-transparent',
                          isCurrent && 'border-transparent',
                          isFuture && 'border-muted-foreground/30 bg-background'
                        )}
                        style={{
                          backgroundColor: isCompleted
                            ? dealTypeColor
                            : isCurrent
                              ? dealTypeColor
                              : undefined,
                          boxShadow: isCurrent
                            ? `0 0 0 4px ${dealTypeColor}25`
                            : undefined,
                        }}
                      >
                        {isCompleted ? (
                          <CheckIcon className="h-5 w-5 text-white" />
                        ) : isCurrent ? (
                          <span className="h-3 w-3 rounded-full bg-white" />
                        ) : (
                          <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />
                        )}
                      </div>
                    </div>

                    {/* Stage Name */}
                    <div className="mt-3 flex flex-col items-center">
                      <span
                        className={cn(
                          'text-xs font-medium text-center max-w-[80px] leading-tight',
                          isCompleted && 'text-foreground',
                          isCurrent && 'text-foreground font-semibold',
                          isFuture && 'text-muted-foreground'
                        )}
                        style={{
                          color: isCurrent ? dealTypeColor : undefined,
                        }}
                      >
                        {stage.name}
                      </span>
                      {isCurrent && (
                        <span
                          className="mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${dealTypeColor}15`,
                            color: dealTypeColor,
                          }}
                        >
                          Current
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < mainStages.length - 1 && (
                    <div className="flex items-center h-10 mx-1">
                      <div
                        className={cn(
                          'h-0.5 w-8 sm:w-12 md:w-16 transition-all duration-300',
                          index < currentMainIndex
                            ? 'bg-current'
                            : 'bg-muted-foreground/20'
                        )}
                        style={{
                          backgroundColor:
                            index < currentMainIndex ? dealTypeColor : undefined,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
