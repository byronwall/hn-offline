import { createSignal } from "solid-js";

export type Message = {
  id: string;
  text: string;
  level?: "info" | "warn" | "error";
  timestamp: number;
};

const [messages, setMessages] = createSignal<Message[]>([]);

export const getMessages = messages;

export function addMessage(text: string, level: Message["level"] = "info") {
  const message: Message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    level,
    timestamp: Date.now(),
  };
  setMessages((prev) => [message, ...prev].slice(0, 200));
}

export function clearMessages() {
  setMessages([]);
}

export function removeMessage(id: string) {
  setMessages((prev) => prev.filter((m) => m.id !== id));
}
