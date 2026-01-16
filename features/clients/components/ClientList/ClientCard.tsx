/**
 * ClientCard Component
 *
 * Displays individual client information in a card format with touch-friendly
 * design for mobile use. Supports click handling, keyboard navigation,
 * and accessibility features.
 *
 * @module features/clients/components/ClientList/ClientCard
 */

import React, { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import type { ClientWithTags } from '../../types';

/**
 * Props for the ClientCard component
 */
export interface ClientCardProps {
  /** Client data to display */
  client: ClientWithTags;
  /** Optional click handler - makes the card interactive */
  onClick?: (client: ClientWithTags) => void;
}

/**
 * ClientCard displays a client's information in a touch-friendly card format.
 *
 * Features:
 * - Displays name, email, phone, and tags
 * - Touch-friendly design with 44px minimum touch target
 * - Keyboard accessible (Enter/Space to activate)
 * - Email and phone as clickable links
 * - Tags displayed as chips
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <ClientCard
 *   client={clientData}
 *   onClick={(client) => navigate(`/clients/${client.id}`)}
 * />
 * ```
 */
export const ClientCard: React.FC<ClientCardProps> = ({ client, onClick }) => {
  const isClickable = !!onClick;

  const handleClick = useCallback(() => {
    onClick?.(client);
  }, [onClick, client]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if ((event.key === 'Enter' || event.key === ' ') && onClick) {
        event.preventDefault();
        onClick(client);
      }
    },
    [onClick, client]
  );

  // Stop propagation for email/phone links
  const handleLinkClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  return (
    <Card
      className={cn(
        'min-h-[44px] transition-all duration-200',
        isClickable && 'cursor-pointer hover:bg-accent hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      tabIndex={isClickable ? 0 : undefined}
      role="article"
      aria-label={`Client: ${client.name}`}
    >
      <CardContent className="p-4">
        {/* Client Name */}
        <h3 className="text-lg font-semibold text-foreground mb-1">{client.name}</h3>

        {/* Contact Info */}
        <div className="space-y-1 mb-2">
          {/* Email */}
          <div className="flex items-center text-sm text-muted-foreground">
            <svg
              className="w-4 h-4 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <a
              href={`mailto:${client.email}`}
              className="truncate hover:text-primary hover:underline focus:text-primary focus:underline focus:outline-none py-1"
              onClick={handleLinkClick}
              aria-label={`Email ${client.name} at ${client.email}`}
            >
              {client.email}
            </a>
          </div>

          {/* Phone (conditional) */}
          {client.phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <svg
                className="w-4 h-4 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <a
                href={`tel:${client.phone}`}
                className="hover:text-primary hover:underline focus:text-primary focus:underline focus:outline-none py-1"
                onClick={handleLinkClick}
                aria-label={`Call ${client.name} at ${client.phone}`}
              >
                {client.phone}
              </a>
            </div>
          )}
        </div>

        {/* Tags */}
        {client.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-border" role="list" aria-label="Client tags">
            {client.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientCard;
