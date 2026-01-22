'use client';

/**
 * TagSelect Component
 *
 * Multi-select dropdown for choosing client tags.
 * Fetches available tags from the API and displays them with their colors.
 * Supports creating new tags on-the-fly.
 *
 * @module features/clients/components/TagSelect/TagSelect
 */

import { useState } from 'react';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CheckIcon, XIcon, PlusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserTag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectProps {
  /** Currently selected tag names */
  value: string[];
  /** Callback when tags change */
  onValueChange: (tags: string[]) => void;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Fetch user tags
 */
async function fetchUserTags(): Promise<UserTag[]> {
  const response = await fetch('/api/user-tags');
  if (!response.ok) {
    throw new Error('Failed to fetch user tags');
  }
  return response.json();
}

/**
 * Create a new user tag
 */
async function createUserTag(name: string, color: string): Promise<UserTag> {
  const response = await fetch('/api/user-tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create tag');
  }
  return response.json();
}

/**
 * TagSelect allows users to select multiple tags and create new ones
 */
export const TagSelect: React.FC<TagSelectProps> = ({
  value = [],
  onValueChange,
  disabled = false,
  placeholder = 'Select tags',
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const queryClient = useQueryClient();

  const { data: tags } = useSuspenseQuery({
    queryKey: ['user-tags'],
    queryFn: fetchUserTags,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createTagMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      createUserTag(name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tags'] });
    },
  });

  const handleToggleTag = (tagName: string) => {
    const newValue = value.includes(tagName)
      ? value.filter((t) => t !== tagName)
      : [...value, tagName];
    onValueChange(newValue);
  };

  const handleRemoveTag = (tagName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(value.filter((t) => t !== tagName));
  };

  const handleCreateTag = async () => {
    if (!searchValue.trim()) return;

    // Check if tag already exists
    const exists = tags.some(
      (tag) => tag.name.toLowerCase() === searchValue.toLowerCase()
    );
    if (exists) return;

    try {
      // Create with default color (first color in palette)
      const newTag = await createTagMutation.mutateAsync({
        name: searchValue.trim(),
        color: '#6B7280', // gray default
      });

      // Add to selection
      onValueChange([...value, newTag.name]);
      setSearchValue('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const selectedTags = tags.filter((tag) => value.includes(tag.name));
  const canCreateNew = searchValue.trim() && !tags.some(
    (tag) => tag.name.toLowerCase() === searchValue.toLowerCase()
  );

  return (
    <div className="space-y-2">
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span>{tag.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemoveTag(tag.name, e)}
                  className="ml-1 rounded-sm hover:bg-muted p-0.5"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              selectedTags.length === 0 && 'text-muted-foreground'
            )}
          >
            {selectedTags.length === 0 ? placeholder : `${selectedTags.length} tag(s) selected`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or create tags..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {canCreateNew ? (
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleCreateTag}
                      disabled={createTagMutation.isPending}
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Create "{searchValue}"
                    </Button>
                  </div>
                ) : (
                  'No tags found'
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredTags.map((tag) => {
                  const isSelected = value.includes(tag.name);
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleToggleTag(tag.name)}
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <CheckIcon className="h-3 w-3" />
                      </div>
                      <div
                        className="mr-2 h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {canCreateNew && filteredTags.length > 0 && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateTag}
                    className="text-primary"
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create "{searchValue}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TagSelect;
