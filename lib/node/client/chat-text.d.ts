/**
 * Locate one finalized assistant message's speakable text in the Chat snapshot.
 *
 * The `conversation.chat.assistant-actions` seat receives only the durable
 * `messageId`, so the entry derives the words it speaks from the current
 * Conversation binding: the settled assistant node carrying that message id
 * supplies its text blocks. Reasoning and tool-call blocks are never spoken —
 * the message's prose is what the action row belongs to.
 * @module dsh-mimotts/client/chat-text
 */
import type { ChatSnapshot } from '@deepseek-ai/dsh-client-ui-chat/client';
import type { MessageId } from '@deepseek-ai/dsh-api-remotes/client';
/**
 * Extract the speakable text of one finalized assistant message.
 * @param snapshot - current Chat snapshot of the viewed Session.
 * @param messageId - durable identity of the target assistant message.
 * @returns the message's text blocks joined in order, or undefined when the
 * message is not in the loaded window.
 */
export declare function speakableTextFor(snapshot: ChatSnapshot, messageId: MessageId): string | undefined;
