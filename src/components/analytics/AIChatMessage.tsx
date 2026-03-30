import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export const AIChatMessage = ({ role, content, timestamp }: AIChatMessageProps) => {
  const isUser = role === 'user';
  
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary" : "bg-muted"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      
      <div className={cn(
        "flex flex-col gap-1 max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-lg px-4 py-2",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-foreground"
        )}>
          <div className="text-sm whitespace-pre-wrap break-words">
            {content}
          </div>
        </div>
        
        {timestamp && (
          <span className="text-xs text-muted-foreground px-2">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};
