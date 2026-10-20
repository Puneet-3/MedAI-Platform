export interface ChatMessage {
  id: string;
  consultationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; role: string };
}

// Polling and live events can arrive in either order. Never drop a confirmed message.
export function mergeMessages<T extends ChatMessage>(current: T[], incoming: T[]): T[] {
  const byId = new Map(current.map(message => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  const next = [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  if (next.length === current.length && next.every((message, index) => {
    const previous = current[index];
    return message.id === previous.id && message.content === previous.content && message.sender.name === previous.sender.name;
  })) return current;
  return next;
}

export function shouldFollowMessages(firstLoad: boolean, nearBottom: boolean, sentByMe: boolean) {
  return firstLoad || nearBottom || sentByMe;
}
