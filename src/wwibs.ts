import Broadcaster from "./lib/broadcaster";

let script = document.head.querySelector("script#broadcaster") || null;
if (!script) {
    script = document.createElement("script");
    script.id = "broadcaster";
    script.innerHTML =
        "window.globalManager = null;window.globalMessage = null;window.globalHookup = null;window.globalDisconnect = null;window.globalReply = null;window.globalReplyAll = null;";
    document.head.appendChild(script);
    // @ts-ignore
    globalManager = new Broadcaster();
}

// @ts-ignore
globalMessage = globalManager.message.bind(globalManager);

/**
 * Sends a message to an inbox.
 */
// @ts-ignore
export const message: (settings: { recipient: string; type: string; data: { [key: string]: any }; maxAttempts?: number; senderId?: string }) => void = globalMessage;

// @ts-ignore
globalHookup = globalManager.hookup.bind(globalManager);

/**
 * Register and hookup an inbox.
 * @param name - the name of the inbox
 * @param inbox - the function that will handle the inboxes incoming messages
 * @returns inbox UID
 */
// @ts-ignore
export const hookup: (name: string, inbox: Function) => string = globalHookup;

// @ts-ignore
globalDisconnect = globalManager.disconnect.bind(globalManager);

/**
 * Disconnect an inbox.
 * @param inboxId - the UID of the inbox
 */
// @ts-ignore
export const disconnect: (inboxId: string) => void = globalDisconnect;

// @ts-ignore
globalReply = globalManager.reply.bind(globalManager);

/**
 * Send a reply message.
 */
// @ts-ignore
export const reply: (settings: { replyId: string; type: string; data: { [key: string]: any }; maxAttempts?: number; senderId?: string }) => void = globalReply;

// @ts-ignore
globalReplyAll = globalManager.replyAll.bind(globalManager);

/**
 * Send a reply to the sender and all original recipients.
 */
// @ts-ignore
export const replyAll: (settings: { replyId: string; type: string; data: { [key: string]: any }; maxAttempts?: number; senderId?: string }) => void = globalReplyAll;
