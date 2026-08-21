"use client";
import React, { useState } from 'react';
import { 
  Search, 
  Settings, 
  LogOut,
  ChevronDown,
  ChevronRight,
  Terminal,
  Blocks,
  MessageSquare,
  Plus,
  Sparkles,
} from 'lucide-react';
import BrandMark from '@/components/ui/brand-mark';

export type ConversationItem = {
  id: string;
  title: string;
};

export type SkillItem = {
  name: string;
  title: string;
  description: string;
};

type NavItemData = {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: number | string;
  shortcut?: string;
  children?: NavItemData[];
};

function WorkspaceSwitcher({ selected, onSelect }: { selected?: string, onSelect?: (ws: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalSelected, setInternalSelected] = useState('Solomon');
  
  const current = selected || internalSelected;
  const handleSelect = onSelect || setInternalSelected;

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-2 py-2 mb-4 rounded-lg hover:bg-ink-deep/4 dark:hover:bg-ink-deep/6 cursor-pointer transition-colors select-none group"
      >
        <div className="flex items-center gap-3">
          <BrandMark size={32} className="rounded-[7px] shadow-sm shadow-[0_1px_3px_oklch(0.12_0_0/0.15)]" />
          <span className="text-[13px] font-medium leading-none text-foreground truncate max-w-[140px]">{current}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground/70 transition-colors shrink-0" strokeWidth={1.5} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[52px] left-0 w-full bg-card border border-border/50 rounded-lg shadow-[0_4px_20px_oklch(0.12_0_0/0.1)] z-50 py-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
            {['Solomon', 'Personal Workspace', 'Client Sandbox'].map(ws => (
              <div 
                key={ws}
                onClick={() => { handleSelect(ws); setIsOpen(false); }}
                className={`px-3 py-2 mx-1 text-[13px] rounded-md cursor-pointer transition-colors ${current === ws ? 'bg-ink-deep/8 text-foreground font-medium' : 'text-foreground/80 hover:bg-ink-deep/4 dark:hover:bg-ink-deep/6'}`}
              >
                {ws}
              </div>
            ))}
            <div className="h-px bg-border/50 my-1 mx-2" />
            <div className="px-3 py-2 mx-1 text-[13px] text-muted-foreground hover:bg-ink-deep/4 dark:hover:bg-ink-deep/6 rounded-md cursor-pointer flex items-center gap-2 transition-colors">
              <span className="text-[16px] leading-none mb-0.5">+</span> Create Workspace
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NavItem({ 
  item, 
  activeId, 
  onSelect,
  level = 0
}: { 
  item: NavItemData; 
  activeId: string; 
  onSelect: (id: string) => void;
  level?: number;
}) {
  const isActive = activeId === item.id;
  const hasChildren = !!item.children;
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      onSelect(item.id);
    }
  };

  return (
    <div className="relative flex flex-col w-full">
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full bg-ink-deep dark:bg-ink-paper" />
      )}
      <div 
        className={`group flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all duration-200 select-none
          ${isActive 
            ? 'bg-ink-deep/5 dark:bg-ink-deep/8 text-foreground font-medium' 
            : 'text-muted-foreground hover:bg-ink-deep/4 dark:hover:bg-ink-deep/6 hover:text-foreground/90'
          }
        `}
        style={{ paddingLeft: `${level * 12 + 10}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5">
          <item.icon 
            className={`w-[16px] h-[16px] transition-colors
              ${isActive ? 'text-foreground' : 'text-ink-wash group-hover:text-ink-stone'}
            `} 
            strokeWidth={1.5} 
          />
          <span className="text-[13px] tracking-wide truncate">
            {item.title}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {item.shortcut && (
             <kbd className="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium font-mono text-muted-foreground/60 bg-background/50 border border-border/50 rounded-[4px] shadow-xs">
               {item.shortcut}
             </kbd>
          )}
          {item.badge && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium rounded-full bg-ink-deep/8 text-ink-stone">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight 
              className={`w-3.5 h-3.5 text-ink-wash/60 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      {hasChildren && (
        <div 
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
            <div 
              className="absolute top-0 bottom-0 border-l border-ink-deep/8 dark:border-ink-deep/10"
              style={{ left: `${level * 12 + 17.5}px` }}
            />
            {item.children!.map(child => (
              <NavItem 
                key={child.id} 
                item={child} 
                activeId={activeId} 
                onSelect={onSelect} 
                level={level + 1} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 mb-1.5">
      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
        {children}
      </span>
      <div className="ink-brush-rule mt-1.5 opacity-60" />
    </div>
  );
}

export function SidebarNav({ 
  className = '',
  activeId,
  onSelect,
  activeWorkspace,
  onWorkspaceSelect,
  conversations = [],
}: { 
  className?: string,
  activeId?: string,
  onSelect?: (id: string) => void,
  activeWorkspace?: string,
  onWorkspaceSelect?: (ws: string) => void,
  conversations?: ConversationItem[],
}) {
  const [internalId, setInternalId] = useState('home');
  const currentId = activeId !== undefined ? activeId : internalId;
  const handleSelect = onSelect || setInternalId;

  return (
    <div className={`ink-sidebar flex flex-col w-[260px] h-full p-3 font-sans ${className}`}>
      <WorkspaceSwitcher selected={activeWorkspace} onSelect={onWorkspaceSelect} />

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-2">
        <div className="flex flex-col gap-0.5">
          <NavItem item={{ id: 'search', title: 'Search', icon: Search, shortcut: '⌘K' }} activeId={currentId} onSelect={handleSelect} />
          <NavItem item={{ id: 'home', title: 'New chat', icon: Plus }} activeId={currentId} onSelect={handleSelect} />
          <NavItem item={{ id: 'skills', title: 'Skills', icon: Sparkles }} activeId={currentId} onSelect={handleSelect} />
        </div>

        <div className="flex flex-col gap-0.5">
          <SectionHeading>History</SectionHeading>
          {conversations.length === 0 ? (
            <p className="px-2.5 py-1 text-[12px] text-muted-foreground/50">No conversations yet</p>
          ) : (
            conversations.map(c => (
              <NavItem
                key={c.id}
                item={{ id: `conv:${c.id}`, title: c.title, icon: MessageSquare }}
                activeId={currentId}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>

        <div className="flex flex-col gap-0.5">
          <SectionHeading>Developers</SectionHeading>
          <NavItem item={{ id: 'api', title: 'API Keys', icon: Terminal }} activeId={currentId} onSelect={handleSelect} />
          <NavItem item={{ id: 'webhooks', title: 'Webhooks', icon: Blocks }} activeId={currentId} onSelect={handleSelect} />
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border/50 flex flex-col gap-0.5">
        <NavItem item={{ id: 'settings', title: 'Settings', icon: Settings, shortcut: '⌘,' }} activeId={currentId} onSelect={handleSelect} />
        <NavItem item={{ id: 'logout', title: 'Log out', icon: LogOut }} activeId={currentId} onSelect={handleSelect} />
      </div>
    </div>
  );
}
