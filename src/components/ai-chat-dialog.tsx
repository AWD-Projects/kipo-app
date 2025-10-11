"use client";

import { useState, useRef, useEffect } from "react";
import { Slide } from "@mui/material";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Loader2,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  data?: any;
  suggestedActions?: any[];
}

const SUGGESTED_QUESTIONS = [
  "¿Por qué estoy gastando tanto en comida este mes?",
  "¿Cómo puedo ahorrar más?",
  "¿Cuánto he gastado en transporte?",
  "¿Estoy cumpliendo mis presupuestos?",
  "Analiza mis gastos de la semana",
];

interface AIChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: "budgets" | "savings" | "general";
}

export function AIChatDialog({ open, onOpenChange, context = "general" }: AIChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Add welcome message based on context
      const welcomeMessage = getWelcomeMessage(context);
      setMessages([
        {
          role: "assistant",
          content: welcomeMessage,
          timestamp: new Date(),
        },
      ]);
    }
  }, [open, context]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getWelcomeMessage = (ctx: string) => {
    switch (ctx) {
      case "budgets":
        return "¡Hola! Soy tu asistente de presupuestos con IA. Puedo ayudarte a entender tus gastos, analizar patrones y darte recomendaciones personalizadas. ¿En qué puedo ayudarte hoy?";
      case "savings":
        return "¡Hola! Soy tu asistente de metas de ahorro con IA. Puedo ayudarte a planificar tus objetivos financieros y darte consejos para alcanzarlos. ¿En qué puedo ayudarte?";
      default:
        return "¡Hola! Soy tu asistente financiero con IA. Puedo ayudarte con presupuestos, metas de ahorro y análisis de gastos. ¿Qué necesitas?";
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/budgets/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId || undefined,
          includeRecommendations: true,
          context: context,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al procesar tu pregunta");
      }

      const data = await response.json();

      // Update session ID if new
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        data: data.data,
        suggestedActions: data.suggestedActions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error in chat:", error);
      toast.error(error.message || "Error al procesar tu pregunta");

      const errorMessage: Message = {
        role: "assistant",
        content: "Lo siento, tuve un problema al procesar tu pregunta. Por favor, intenta de nuevo.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <div className="fixed inset-x-2 sm:inset-x-4 bottom-2 sm:bottom-4 top-20 sm:top-32 z-50 bg-background flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl mx-auto border">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            size="sm"
            className="text-xs sm:text-sm"
          >
            Cancelar
          </Button>
          <h1 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Kipo Coach
          </h1>
          <div className="w-16 sm:w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2.5 sm:p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="text-xs sm:text-sm prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                      ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {message.suggestedActions && message.suggestedActions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium">Acciones sugeridas:</p>
                    {message.suggestedActions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => toast.info("Funcionalidad próximamente")}
                      >
                        {action.label || action.action || action.type || "Acción"}
                      </Button>
                    ))}
                  </div>
                )}

                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions (only show when no messages yet) */}
        {messages.length === 1 && (
          <div className="px-3 sm:px-6 pb-3 sm:pb-4 space-y-2 border-t pt-3 sm:pt-4">
            <p className="text-xs text-muted-foreground font-medium">
              Preguntas sugeridas:
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-[10px] sm:text-xs h-8 px-2 sm:px-3"
                  onClick={() => handleSendMessage(question)}
                  disabled={loading}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 sm:p-6 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="flex-1 text-sm"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              size="icon"
              className="h-10 w-10 flex-shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Slide>
  );
}
