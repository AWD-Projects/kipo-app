"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        role: "assistant",
        content: "¡Hola! Soy tu asistente de presupuestos con IA. Puedo ayudarte a entender tus gastos, analizar patrones y darte recomendaciones personalizadas. ¿En qué puedo ayudarte hoy?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <div className="kipo-dashboard-layout">
      <div className="kipo-stack-lg h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/sobres">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="kipo-page-title">Asistente de Presupuestos</h1>
            <p className="kipo-page-description">
              Pregunta sobre tus finanzas en lenguaje natural
            </p>
          </div>
          <Badge variant="outline" className="hidden sm:flex">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Conversación
            </CardTitle>
            <CardDescription>
              Haz preguntas sobre tus presupuestos y gastos
            </CardDescription>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {message.data && (
                    <div className="mt-3 p-2 bg-background/10 rounded text-xs">
                      <pre className="overflow-x-auto">
                        {JSON.stringify(message.data, null, 2)}
                      </pre>
                    </div>
                  )}

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
                          {action.type}
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
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Suggested Questions (only show when no messages yet) */}
          {messages.length === 1 && (
            <div className="px-4 pb-4 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                Preguntas sugeridas:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs"
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
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Escribe tu pregunta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                size="icon"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Help Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Tip:</strong> Puedes preguntar cosas como "¿Por qué gasté tanto este mes?",
                "¿Cómo puedo ahorrar en comida?", o "Analiza mis gastos de transporte"
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
