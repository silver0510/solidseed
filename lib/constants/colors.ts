/**
 * Preset color palette for statuses and tags
 */
export const PRESET_COLORS = [
  { name: 'gray', hex: '#6B7280', label: 'Gray' },
  { name: 'red', hex: '#EF4444', label: 'Red' },
  { name: 'orange', hex: '#F97316', label: 'Orange' },
  { name: 'amber', hex: '#F59E0B', label: 'Amber' },
  { name: 'yellow', hex: '#EAB308', label: 'Yellow' },
  { name: 'green', hex: '#22C55E', label: 'Green' },
  { name: 'cyan', hex: '#06B6D4', label: 'Cyan' },
  { name: 'blue', hex: '#3B82F6', label: 'Blue' },
  { name: 'purple', hex: '#8B5CF6', label: 'Purple' },
  { name: 'pink', hex: '#EC4899', label: 'Pink' },
] as const;

export type PresetColorName = (typeof PRESET_COLORS)[number]['name'];

/**
 * Get hex color from preset name
 */
export function getColorHex(colorName: string): string {
  const color = PRESET_COLORS.find((c) => c.name === colorName);
  return color?.hex || PRESET_COLORS[0].hex;
}

/**
 * Get Tailwind background class from preset name
 */
export function getColorBgClass(colorName: string): string {
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    cyan: 'bg-cyan-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
  };
  return colorMap[colorName] || 'bg-gray-500';
}

/**
 * Get Tailwind text class from preset name
 */
export function getColorTextClass(colorName: string): string {
  const colorMap: Record<string, string> = {
    gray: 'text-gray-500',
    red: 'text-red-500',
    orange: 'text-orange-500',
    amber: 'text-amber-500',
    yellow: 'text-yellow-500',
    green: 'text-green-500',
    cyan: 'text-cyan-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    pink: 'text-pink-500',
  };
  return colorMap[colorName] || 'text-gray-500';
}

/**
 * Get Tailwind badge variant classes (background + text)
 */
export function getColorBadgeClasses(colorName: string): string {
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  };
  return colorMap[colorName] || colorMap.gray;
}
