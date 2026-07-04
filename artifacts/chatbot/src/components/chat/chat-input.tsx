import { useEffect, useRef, useCallback } from "react";
import { ArrowUp, Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSpeechToText } from "@/hooks/use-speech-to-text";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Message Nexus AI...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const committedRef = useRef("");
  const interimRef = useRef("");

  const handleTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        const separator =
          committedRef.current && !committedRef.current.endsWith(" ") ? " " : "";
        committedRef.current = committedRef.current + separator + text.trim();
        interimRef.current = "";
        onChange(committedRef.current);
      } else {
        interimRef.current = text;
        const separator =
          committedRef.current && !committedRef.current.endsWith(" ") ? " " : "";
        onChange(committedRef.current + separator + text);
      }
    },
    [onChange],
  );

  const { isListening, isSupported, toggle, stop } = useSpeechToText({
    onTranscript: handleTranscript,
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  useEffect(() => {
    if (!isListening) {
      committedRef.current = value;
      interimRef.current = "";
    }
  }, [isListening, value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isListening) stop();
      onSend();
    }
  };

  const handleSend = () => {
    if (isListening) stop();
    onSend();
  };

  const handleMicToggle = () => {
    if (!isListening) {
      committedRef.current = value;
      interimRef.current = "";
    }
    toggle();
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="max-w-3xl mx-auto">
        <div
          className={cn(
            "relative rounded-2xl border bg-card/90 backdrop-blur-xl shadow-lg transition-all duration-300",
            isListening
              ? "border-red-400/60 ring-2 ring-red-400/20 shadow-red-500/10"
              : "border-border/60 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15",
          )}
        >
          {isListening && (
            <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden rounded-t-2xl">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-red-400 to-transparent animate-pulse" />
            </div>
          )}

          <div className="flex items-end gap-1 p-2 pl-3">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                committedRef.current = e.target.value;
                interimRef.current = "";
                onChange(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : placeholder}
              disabled={disabled}
              aria-label="Chat message"
              className={cn(
                "min-h-[52px] max-h-[200px] flex-1 resize-none border-0 bg-transparent py-3 pl-1 pr-1",
                "focus-visible:ring-0 shadow-none text-base sm:text-[15px] leading-relaxed",
                "placeholder:text-muted-foreground/70",
              )}
              rows={1}
            />

            <div className="flex items-center gap-1 pb-1.5 pr-1 shrink-0">
              {isSupported && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={disabled}
                      onClick={handleMicToggle}
                      aria-label={isListening ? "Stop listening" : "Start voice input"}
                      aria-pressed={isListening}
                      className={cn(
                        "h-9 w-9 rounded-xl transition-all duration-200",
                        isListening
                          ? "bg-red-500/15 text-red-500 hover:bg-red-500/25 hover:text-red-600 animate-pulse"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
                      )}
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {isListening ? "Stop listening" : "Voice input"}
                  </TooltipContent>
                </Tooltip>
              )}

              <Button
                type="button"
                size="icon"
                disabled={!canSend}
                onClick={handleSend}
                aria-label="Send message"
                className={cn(
                  "h-9 w-9 rounded-xl transition-all duration-200",
                  canSend
                    ? "bg-primary text-primary-foreground shadow-md hover:scale-105 active:scale-95"
                    : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed",
                )}
              >
                {disabled ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2.5 px-1">
          <span className="text-[11px] text-muted-foreground/60 hidden sm:block">
            Enter to send · Shift+Enter for new line
            {isSupported && " · Mic for voice input"}
          </span>
          {isListening && (
            <span
              role="status"
              aria-live="polite"
              className="text-[11px] font-medium text-red-500/80 flex items-center gap-1.5 sm:ml-auto"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              Listening...
            </span>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
