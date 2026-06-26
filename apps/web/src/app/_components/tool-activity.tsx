import { Badge, Spinner } from '@jasonruesch/react';
import { Check, Search, Wrench } from 'lucide-react';
import type { ToolActivity } from '~/lib/chat-types';

const TOOL_LABEL: Record<string, string> = {
  search_knowledge_base: 'Searching knowledge base',
  get_current_time: 'Getting the time',
};

function iconFor(name: string) {
  if (name === 'search_knowledge_base') return Search;
  return Wrench;
}

/** Inline indicators for the tools the assistant invoked during a turn. */
export function ToolActivityList({ tools }: { tools: ToolActivity[] }) {
  if (tools.length === 0) return null;

  return (
    <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Tool activity">
      {tools.map((tool) => {
        const Icon = iconFor(tool.name);
        const label = TOOL_LABEL[tool.name] ?? tool.name;
        return (
          <li key={tool.id}>
            <Badge variant="outline" className="flex items-center gap-1.5">
              <Icon size={12} aria-hidden />
              {label}
              {tool.done ? (
                <Check size={12} aria-hidden className="text-success-fg" />
              ) : (
                <Spinner size="sm" className="size-3" aria-hidden />
              )}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
