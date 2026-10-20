"use client";

import { useLayoutEffect, useRef, type UIEvent } from "react";
import { shouldFollowMessages } from "@/lib/chat-messages";

export function useChatScroll(lastMessageId: string | undefined, sentByMe: boolean) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const lastSeen = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    const container = messagesRef.current;
    if (!container || !lastMessageId || lastMessageId === lastSeen.current) return;
    if (shouldFollowMessages(!lastSeen.current, nearBottom.current, sentByMe)) {
      // Scroll the message panel only; scrollIntoView also moves the entire page.
      container.scrollTop = container.scrollHeight;
      nearBottom.current = true;
    }
    lastSeen.current = lastMessageId;
  }, [lastMessageId, sentByMe]);

  const onMessagesScroll = (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    nearBottom.current = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
  };

  return { messagesRef, onMessagesScroll };
}
