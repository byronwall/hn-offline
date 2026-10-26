import { createSignal } from "solid-js";

export type Message = {
  id: string;
  key: string;
  message: string;
  args: unknown[];
  timestamp: number;
};

export type AddMessage = (
  key: string,
  message: string,
  ...args: unknown[]
) => void;

export function createMessagesStore() {
  const [messages, setMessages] = createSignal<Message[]>([]);

  // The feed only shows in the dev StatusBar, so skip the work in production.
  const addMessage: AddMessage = (key, message, ...args) => {
    if (!import.meta.env.DEV) {
      return;
    }

    const entry: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      key,
      message,
      args,
      timestamp: Date.now(),
    };

    setMessages((prev) => [entry, ...prev].slice(0, 200));
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return {
    messages,
    addMessage,
    clearMessages,
    removeMessage,
  };
}
