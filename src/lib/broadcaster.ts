import { uuid } from "./utils";
import { BroadcastWorkerMessage, MessageData } from "../types";

type Inbox = {
    callback: Function;
    disconnected?: boolean;
    uid: string;
};

const VERSION = "REPLACE_WITH_VERISON";

export default class Broadcaster {
    private worker: Worker;
    private inboxes: Array<Inbox>;
    private messageQueue: Array<BroadcastWorkerMessage>;
    private state: {
        allowMessaging: boolean;
    };

    constructor() {
        this.worker;
        this.setupBroadcastWorker();
        this.inboxes = [];
        this.messageQueue = [];
        this.state = {
            allowMessaging: false,
        };

        window.addEventListener("unload", () => {
            const workerMessage = {
                recipient: "broadcast-worker",
                data: {
                    type: "unload",
                },
            };
            this.worker.postMessage(workerMessage);
        });
    }

    private async setupBroadcastWorker() {
        let request = await fetch(`https://cdn.jsdelivr.net/npm/wwibs@${VERSION}/wwibs-worker.min.js`);
        let url;
        if (request.ok) {
            const response = await request.blob();
            url = URL.createObjectURL(response);
        } else {
            request = await fetch("/wwibs-worker.min.js");
            if (request.ok) {
                const response = await request.blob();
                url = URL.createObjectURL(response);
            } else {
                console.error(`Failed to fetch the Inbox Worker from the CDN and ${location.origin}.`);
            }
        }
        if (url) {
            this.worker = new Worker(url);
            this.worker.onmessage = this.handleWorkerMessage.bind(this);
        }
    }

    /**
     * Set the broadcasters `workerReady` state to `true` and flush any queued messages.
     */
    private flushMessageQueue(): void {
        this.state.allowMessaging = true;
        if (this.messageQueue.length) {
            for (let i = 0; i < this.messageQueue.length; i++) {
                this.worker.postMessage(this.messageQueue[i]);
            }
        }
        this.messageQueue = [];
    }

    private sendDataToInboxes(inboxIndexes: Array<number>, data: MessageData): void {
        for (let i = 0; i < inboxIndexes.length; i++) {
            try {
                this.inboxes[inboxIndexes[i]].callback(data);
            } catch (error) {
                this.disconnectInbox(this.inboxes[inboxIndexes[i]], inboxIndexes[i]);
            }
        }
    }

    /**
     * Broadcaster received a message from the Inbox worker.
     * This method is an alias of `this.worker.onmessage`
     */
    private handleWorkerMessage(e: MessageEvent): void {
        const data = e.data;
        if (data.recipient?.trim().toLowerCase() === "broadcaster") {
            this.inbox(data.data);
        } else {
            this.sendDataToInboxes(data.inboxIndexes, data.data);
        }
    }

    private sendUserDeviceInformation(): void {
        // @ts-ignore
        const deviceMemory = window.navigator?.deviceMemory ?? 8;
        const isSafari = navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0;
        const workerMessage: BroadcastWorkerMessage = {
            senderId: null,
            recipient: "broadcast-worker",
            messageId: null,
            maxAttempts: 1,
            data: {
                type: "init",
                memory: deviceMemory,
                isSafari: isSafari,
            },
        };
        this.postMessageToWorker(workerMessage);
    }

    /**
     * The broadcaster's personal inbox.
     */
    private inbox(data: MessageData): void {
        const { type } = data;
        switch (type) {
            case "worker-ready":
                this.flushMessageQueue();
                this.sendUserDeviceInformation();
                break;
            case "cleanup-complete":
                this.state.allowMessaging = true;
                this.flushMessageQueue();
                break;
            case "cleanup":
                this.cleanup();
                break;
            case "ping":
                break;
            default:
                console.warn(`Unknown broadcaster message type: ${data.type}`);
                break;
        }
    }

    /**
     * Sends a message to an inbox.
     */
    public message(data): void {
        const message: BroadcastWorkerMessage = {
            recipient: data.recipient,
            type: data.type,
            data: data.data,
            senderId: data?.senderId ?? null,
            maxAttempts: data?.maxAttempts ?? 1,
            messageId: uuid(),
        };
        this.postMessageToWorker(message);
    }

    /**
     * Register and hookup an inbox.
     * @param name - the name of the inbox
     * @param inbox - the function that will handle the inboxes incoming messages
     * @returns inbox UID
     */
    public hookup(name: string, inbox: Function): string {
        const newInbox: Inbox = {
            callback: inbox,
            uid: uuid(),
        };
        const address = this.inboxes.length;
        this.inboxes.push(newInbox);
        const workerMessage: BroadcastWorkerMessage = {
            senderId: newInbox.uid,
            recipient: "broadcast-worker",
            messageId: null,
            maxAttempts: 1,
            data: {
                type: "hookup",
                name: name,
                inboxAddress: address,
                uid: newInbox.uid,
            },
        };
        this.postMessageToWorker(workerMessage);
        return newInbox.uid;
    }

    /**
     * Disconnect an inbox.
     * @param inboxId - the UID of the inbox
     */
    public disconnect(inboxId: string): void {
        for (let i = 0; i < this.inboxes.length; i++) {
            const inbox = this.inboxes[i];
            if (inbox.uid === inboxId) {
                this.disconnectInbox(inbox, i);
                break;
            }
        }
    }

    /**
     * Send a reply message.
     */
    public reply(data): void {
        const message: BroadcastWorkerMessage = {
            replyId: data.replyId,
            type: data.type,
            data: data.data,
            senderId: data?.senderId ?? null,
            maxAttempts: data?.maxAttempts ?? 1,
            messageId: uuid(),
        };
        this.postMessageToWorker(message);
    }

    /**
     * Send a reply to the sender and all original recipients.
     */
    public replyAll(data): void {
        const message: BroadcastWorkerMessage = {
            replyId: data.replyId,
            type: data.type,
            data: data.data,
            senderId: data?.senderId ?? null,
            maxAttempts: data?.maxAttempts ?? 1,
            messageId: uuid(),
            replyAll: true,
        };
        this.postMessageToWorker(message);
    }

    private disconnectInbox(inbox: Inbox, index: number): void {
        inbox.disconnected = true;
        inbox.callback = () => {};
        const workerMessage: BroadcastWorkerMessage = {
            senderId: null,
            recipient: "broadcast-worker",
            messageId: null,
            maxAttempts: 1,
            data: {
                type: "disconnect",
                inboxAddress: index,
            },
        };
        this.postMessageToWorker(workerMessage);
    }

    /**
     * Sends a message to the worker using `postMessage()` or queues the message if the worker isn't ready.
     * @param message - the `BroadcastWorkerMessage` object that will be sent
     */
    private postMessageToWorker(message: BroadcastWorkerMessage): void {
        if (this.state.allowMessaging) {
            this.worker.postMessage(message);
        } else {
            this.messageQueue.push(message);
        }
    }

    private cleanup(): void {
        this.state.allowMessaging = false;
        const updatedAddresses = [];
        const updatedInboxes = [];
        for (let i = 0; i < this.inboxes.length; i++) {
            const inbox = this.inboxes[i];
            if (!inbox?.disconnected) {
                const addressUpdate = {
                    oldAddressIndex: i,
                    newAddressIndex: updatedInboxes.length,
                };
                updatedInboxes.push(inbox);
                updatedAddresses.push(addressUpdate);
            }
        }
        this.inboxes = updatedInboxes;
        const workerMessage: BroadcastWorkerMessage = {
            senderId: null,
            recipient: "broadcast-worker",
            messageId: null,
            maxAttempts: 1,
            data: {
                type: "update-addresses",
                addresses: updatedAddresses,
            },
        };
        this.worker.postMessage(workerMessage);
    }
}
