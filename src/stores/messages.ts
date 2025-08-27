import { createSignal } from "solid-js";

export type Message = {
  id: string;
  key: string;
  message: string;
  args: unknown[];
  timestamp: number;
};

const [messages, setMessages] = createSignal<Message[]>([]);

export const getMessages = messages;

export function addMessage(key: string, message: string, ...args: unknown[]) {
  const entry: Message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    key,
    message,
    args,
    timestamp: Date.now(),
  };
  setMessages((prev) => [entry, ...prev].slice(0, 200));
}

export function clearMessages() {
  setMessages([]);
}

export function removeMessage(id: string) {
  setMessages((prev) => prev.filter((m) => m.id !== id));
}
