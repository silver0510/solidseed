/**
 * ClientList Component Exports
 *
 * Barrel export for ClientList and ClientCard components.
 *
 * @module features/clients/components/ClientList
 */

export { ClientCard } from './ClientCard';
export type { ClientCardProps } from './ClientCard';

export { ClientList } from './ClientList';
export type { ClientListProps } from './ClientList';

// Default export for lazy loading
export { ClientList as default } from './ClientList';
