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
/**
 * Extract the speakable text of one finalized assistant message.
 * @param snapshot - current Chat snapshot of the viewed Session.
 * @param messageId - durable identity of the target assistant message.
 * @returns the message's text blocks joined in order, or undefined when the
 * message is not in the loaded window.
 */
export function speakableTextFor(snapshot, messageId) {
    const matches = [];
    for (const node of snapshot.nodes.values()) {
        if (node.kind !== 'assistant-step')
            continue;
        // One narrowing cast: the store's rows are the kind-payload pairs the
        // ui-chat contract declares, keyed exactly as this check reads them.
        const candidate = node;
        const data = candidate.data;
        const blocks = data.finalNode?.blocks ?? data.blocks;
        if (data.finalNode?.messageId !== messageId)
            continue;
        const text = blocks
            .filter(block => block.kind === 'text')
            .map(block => block.text)
            .join('\n')
            .trim();
        matches.push({ anchorSeq: candidate.anchorSeq, visibility: candidate.visibility, text });
    }
    if (matches.length === 0)
        return undefined;
    // Prefer the visible rendering of the message; hidden duplicates (folded
    // process views) carry the same words.
    const preferred = matches.find(match => match.visibility === 'visible') ?? matches[0];
    return preferred.text;
}
//# sourceMappingURL=chat-text.js.map