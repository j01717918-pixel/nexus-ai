import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Bot, Sparkles, Code, Zap, FileText, Menu, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useGetConversation, 
  useListMessages,
  useSubmitFeedback,
  useCreateConversation,
  getListConversationsQueryKey,
  getGetConversationQueryKey,
  getListMessagesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { useUser, useAuth } from "@clerk/react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const SUGGESTED_PROMPTS = [
  { icon: FileText, text: "Draft a professional email" },
  { icon: Code, text: "Explain how React hooks work" },
  { icon: Zap, text: "Brainstorm startup ideas" },
  { icon: Sparkles, text: "Write a creative story" }
];

export default function Chat() {
  const params = useParams();
  const conversationId = params.id ? parseInt(params.id) : undefined;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useUser();
  
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [optimisticMessage, setOptimisticMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isSignedIn, getToken } = useAuth();

  const { data: conversation } = useGetConversation(conversationId!, { 
    query: {
      queryKey: getGetConversationQueryKey(conversationId!),
      enabled: !!conversationId && !!isSignedIn,
    } 
  });
  
  const { data: messages = [] } = useListMessages(conversationId!, {
    query: {
      queryKey: getListMessagesQueryKey(conversationId!),
      enabled: !!conversationId && !!isSignedIn,
    }
  });
  
  const createConversation = useCreateConversation();
  const submitFeedback = useSubmitFeedback();

  // Close mobile menu when conversation changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [conversationId]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, optimisticMessage, error]);

  const handleSend = async (overrideContent?: string) => {
    const contentToSend = overrideContent || input;
    if (!contentToSend.trim() || isStreaming) return;
    
    setInput("");
    setError(null);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    let targetConvId = conversationId;

    if (!targetConvId) {
      try {
        const newConv = await createConversation.mutateAsync({
          data: { title: contentToSend.slice(0, 40) + (contentToSend.length > 40 ? "..." : "") }
        });
        targetConvId = newConv.id;
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        window.history.pushState({}, "", `${import.meta.env.BASE_URL.replace(/\/$/, "")}/chat/${targetConvId}`);
      } catch (err) {
        console.error("Failed to create conversation", err);
        setError("Failed to create conversation. Please try again.");
        return;
      }
    }

    setOptimisticMessage(contentToSend);
    setIsStreaming(true);
    setStreamingContent("");

    let hasError = false;
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
      const token = await getToken();
      const response = await fetch(`${apiBase}/api/conversations/${targetConvId}/messages`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: contentToSend }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            let json: { content?: string; done?: boolean; error?: string };
            try {
              json = JSON.parse(line.slice(6));
            } catch (e) {
              console.error("Error parsing SSE JSON", e);
              continue;
            }
            if (json.error) {
              throw new Error(json.error);
            }
            if (json.done) {
              break;
            }
            if (json.content) {
              setStreamingContent(prev => prev + json.content);
            }
          }
        }
      }
    } catch (err) {
      console.error("Streaming error", err);
      hasError = true;
      setError(
        err instanceof Error && err.message !== "Failed to send message"
          ? err.message
          : "Failed to get response. Please try again.",
      );
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      
      if (!hasError) {
        setOptimisticMessage(null);
      }
      
      queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(targetConvId) });
      queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(targetConvId) });
      
      if (!conversationId && targetConvId) {
        setLocation(`/chat/${targetConvId}`);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const userAvatar = user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || "U";

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar currentConversationId={conversationId} />
      </div>
      
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur z-10 sticky top-0">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] border-r-0">
              <Sidebar currentConversationId={conversationId} />
            </SheetContent>
          </Sheet>
          <div className="font-medium text-sm truncate max-w-[200px]">
            {conversation?.title || "New Chat"}
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-36 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8">
            {!conversationId && !optimisticMessage ? (
              <div className="h-full flex flex-col items-center justify-center text-center mt-8 md:mt-20 fade-in slide-in-from-bottom-4 duration-700 animate-in">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-8 shadow-sm border border-primary/10">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">How can I help you today?</h1>
                <p className="text-muted-foreground text-lg mb-10 max-w-md">I can write code, analyze data, brainstorm ideas, and help you think.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(prompt.text)}
                      className="flex flex-col text-left p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-200 group shadow-sm hover:shadow-md"
                    >
                      <prompt.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
                      <span className="text-sm font-medium">{prompt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={msg.id} className={cn("flex gap-4 group w-full animate-in fade-in slide-in-from-bottom-2", isUser ? "flex-row-reverse" : "")}>
                      <div className={cn(
                        "w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1 shadow-sm",
                        isUser ? "bg-muted" : "bg-primary text-primary-foreground"
                      )}>
                        {!isUser ? <Bot className="h-5 w-5" /> : (
                          <span className="text-xs font-semibold uppercase">{userAvatar}</span>
                        )}
                      </div>
                      
                      <div className={cn("flex flex-col min-w-0 max-w-[85%] md:max-w-[75%]", isUser ? "items-end" : "items-start")}>
                        <div className={cn(
                          "text-foreground rounded-2xl px-5 py-3 shadow-sm",
                          isUser ? "bg-primary text-primary-foreground" : "bg-card border border-border/50"
                        )}>
                          {!isUser ? (
                            <MarkdownRenderer content={msg.content} />
                          ) : (
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {optimisticMessage && (
                  <div className="flex gap-4 group w-full flex-row-reverse animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-muted flex items-center justify-center mt-1 shadow-sm">
                       <span className="text-xs font-semibold uppercase">{userAvatar}</span>
                    </div>
                    <div className="flex flex-col min-w-0 max-w-[85%] md:max-w-[75%] items-end">
                      <div className="bg-primary text-primary-foreground rounded-2xl px-5 py-3 whitespace-pre-wrap leading-relaxed shadow-sm opacity-80">
                        {optimisticMessage}
                      </div>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="flex justify-center w-full my-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl border border-destructive/20 flex items-center gap-3 shadow-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="font-medium">{error}</span>
                    </div>
                  </div>
                )}
                
                {isStreaming && (
                  <div className="flex gap-4 group w-full animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center mt-1 shadow-sm">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col min-w-0 max-w-[85%] md:max-w-[75%] items-start">
                      <div className="text-foreground rounded-2xl py-3 px-5 bg-card border border-border/50 shadow-sm w-full min-h-[44px]">
                        {streamingContent ? (
                          <MarkdownRenderer content={streamingContent} />
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="h-2 w-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="h-2 w-2 bg-primary/80 rounded-full animate-bounce"></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            )}
          </div>
        </div>
        
        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-10 pb-6 px-4 md:px-8 z-20">
          <div className="max-w-3xl mx-auto relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md shadow-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all duration-300">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Nexus AI..."
              className="min-h-[60px] w-full resize-none border-0 bg-transparent py-4 pl-5 pr-14 focus-visible:ring-0 shadow-none text-base sm:text-[15px]"
              rows={1}
            />
            <Button 
              size="icon" 
              className={cn(
                "absolute right-3 bottom-3 h-9 w-9 rounded-xl transition-all duration-200",
                (!input.trim() || isStreaming) 
                  ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed" 
                  : "bg-primary text-primary-foreground shadow-md hover:scale-105 active:scale-95"
              )}
              disabled={!input.trim() || isStreaming}
              onClick={() => handleSend()}
            >
              <ArrowUp className="h-4 w-4 stroke-[2.5]" />
            </Button>
          </div>
          <div className="text-center mt-3">
            <span className="text-[11px] text-muted-foreground font-medium tracking-wide opacity-70">
              Nexus AI can make mistakes. Verify important information.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
