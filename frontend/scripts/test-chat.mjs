import assert from "node:assert/strict";
import test from "node:test";
import { mergeMessages, shouldFollowMessages } from "../lib/chat-messages.ts";

const message = (id, second) => ({ id, consultationId: "room", senderId: "patient", content: id,
  createdAt: `2026-10-20T00:00:0${second}.000Z`, sender: { id: "patient", name: "Test patient", role: "USER" } });

test("an unchanged poll preserves message state and cannot trigger another scroll", () => {
  const current = [message("first", 1)];
  assert.equal(mergeMessages(current, structuredClone(current)), current);
});

test("a stale poll cannot erase a message received live; duplicate delivery is merged", () => {
  const first = message("first", 1);
  const second = message("second", 2);
  const current = [first, second];
  assert.equal(mergeMessages(current, [structuredClone(first)]), current);
  assert.deepEqual(mergeMessages([second], [first, second]).map(item => item.id), ["first", "second"]);
});

test("messages follow only on first load, near the bottom, or after sending", () => {
  assert.equal(shouldFollowMessages(true, false, false), true);
  assert.equal(shouldFollowMessages(false, true, false), true);
  assert.equal(shouldFollowMessages(false, false, true), true);
  assert.equal(shouldFollowMessages(false, false, false), false);
});
