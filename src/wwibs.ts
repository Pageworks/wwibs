import Broadcaster from "./lib/broadcaster";

let script = document.head.querySelector("script#broadcaster") || null;
if (!script) {
    script = document.createElement("script");
    script.id = "broadcaster";
    script.innerHTML = "window.globalManager = null;window.globalMessage = null;window.globalHookup = null;window.globalDisconnect = null;";
    document.head.appendChild(script);
}

// @ts-ignore
globalManager = new Broadcaster();

// @ts-ignore
globalMessage = globalManager.message.bind(globalManager);

/**
 * Sends a message to an inbox.
 * @param recipient - the name of the inboxes you want to send a message to
 * @param data - the `MessageData` object that will be sent to the inboxes
 * @param maxAttempts - the maximum number of attempts before the message is dropped, can be set to `Infinity`
 */
// @ts-ignore
export const message: (recipient: string, data: { type: string; [key: string]: any }, maxAttempts?: number) => void = globalMessage;

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
