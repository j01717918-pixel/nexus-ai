import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { 
  Bot, 
  MessageSquare, 
  Plus, 
  Search, 
  Settings, 
  LogOut,
  MoreVertical,
  Trash2,
  Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useListConversations, 
  useCreateConversation, 
  useDeleteConversation,
  useUpdateConversation,
  getListConversationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SidebarProps {
  currentConversationId?: number;
}

export function Sidebar({ currentConversationId }: SidebarProps) {
  const [, setLocation] = useLocation();
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: conversations, isLoading } = useListConversations({
    query: {
      queryKey: getListConversationsQueryKey(),
      enabled: !!isSignedIn,
    },
  });
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const updateConversation = useUpdateConversation();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleNewChat = () => {
    createConversation.mutate(
      { data: { title: "New Conversation" } },
      {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setLocation(`/chat/${newConv.id}`);
        }
      }
    );
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          if (currentConversationId === id) {
            setLocation("/chat");
          }
        }
      }
    );
  };

  const handleStartEdit = (conv: any, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = (id: number) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    
    updateConversation.mutate(
      { id, data: { title: editTitle } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setEditingId(null);
        }
      }
    );
  };

  const filteredConversations = Array.isArray(conversations) ? conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())) : [];
  const userAvatar = user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || "U";

  return (
    <div className="w-full md:w-[280px] shrink-0 border-r border-border/60 bg-sidebar/50 backdrop-blur-xl flex flex-col h-[100dvh] text-sidebar-foreground transition-all duration-300">
      
      {/* Header section */}
      <div className="p-4 flex flex-col gap-5">
        <Link href="/" className="flex items-center gap-3 font-semibold px-2 hover:opacity-80 transition-opacity">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <span className="text-lg tracking-tight">Nexus AI</span>
        </Link>
        
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search chats..." 
              className="pl-9 bg-background/60 border-border/40 h-10 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/30 shadow-sm transition-all" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleNewChat} 
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground shadow-sm hover:scale-105 transition-transform" 
            disabled={createConversation.isPending}
            title="New Chat"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </Button>
        </div>
      </div>
      
      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        <div className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-3 pb-2 pt-2">
          Recent
        </div>
        
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center p-3 rounded-xl bg-sidebar-accent/30 animate-pulse">
              <Skeleton className="h-4 w-4 mr-3 bg-muted/50 rounded-md" />
              <Skeleton className="h-3 w-32 bg-muted/50 rounded-md" />
            </div>
          ))
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center flex flex-col items-center gap-3 opacity-60">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">
              {searchQuery ? "No matching chats" : "No conversations yet"}
            </span>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = currentConversationId === conv.id;
            return (
              <div 
                key={conv.id}
                className={cn(
                  "group relative flex items-center justify-between rounded-xl p-3 cursor-pointer transition-all duration-200 text-sm border",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-border/50 shadow-sm" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground border-transparent"
                )}
                onClick={() => {
                  if (editingId !== conv.id) {
                    setLocation(`/chat/${conv.id}`);
                  }
                }}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
                
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <MessageSquare className={cn(
                    "h-4 w-4 shrink-0 transition-colors", 
                    isActive ? "text-primary" : "opacity-50 group-hover:opacity-80"
                  )} />
                  
                  {editingId === conv.id ? (
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleSaveEdit(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(conv.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 bg-background/50 border border-primary/40 rounded-md px-2 py-0.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate pr-2">{conv.title}</span>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "h-7 w-7 rounded-lg shrink-0 transition-opacity",
                        isActive ? "opacity-100 hover:bg-background/80" : "opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent"
                      )} 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border/50">
                    <DropdownMenuItem onClick={(e) => handleStartEdit(conv, e as any)} className="gap-2 cursor-pointer rounded-lg focus:bg-accent focus:text-accent-foreground">
                      <Edit2 className="h-4 w-4" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <Dialog>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl" onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                          <DialogTitle>Delete conversation</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">"{conv.title}"</span>? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4">
                          <Button variant="outline" className="rounded-xl">Cancel</Button>
                          <Button variant="destructive" className="rounded-xl" onClick={(e) => handleDelete(conv.id, e as any)}>
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>
      
      {/* User Profile */}
      <div className="p-4 border-t border-border/40 mt-auto bg-background/30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full h-14 justify-start px-3 rounded-xl hover:bg-sidebar-accent/80 border border-transparent hover:border-border/50 transition-all group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mr-3 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-xs font-bold text-primary">
                  {userAvatar}
                </span>
              </div>
              <div className="flex flex-col items-start flex-1 overflow-hidden">
                <span className="truncate w-full font-medium text-sm">
                  {user?.firstName || "Nexus User"}
                </span>
                <span className="truncate w-full text-xs text-muted-foreground">
                  {user?.emailAddresses[0]?.emailAddress || "user@example.com"}
                </span>
              </div>
              <Settings className="h-4 w-4 opacity-40 shrink-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" sideOffset={10} className="w-60 rounded-xl shadow-xl border-border/60">
            <div className="px-2 py-2.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                <span className="text-sm font-bold text-primary">{userAvatar}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{user?.firstName || "Nexus User"}</span>
                <span className="text-xs text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</span>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem onClick={() => setLocation("/settings")} className="gap-2 cursor-pointer py-2.5 rounded-lg focus:bg-accent">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" })} className="gap-2 cursor-pointer py-2.5 rounded-lg focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
