import { uuid } from "./utils";

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
            senderID: null,
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
     * @param recipient - the name of the inboxes you want to send a message to
     * @param senderID - the unique inbox ID provided by the `hookup()` method
     * @param data - the `MessageData` object that will be sent to the inboxes
     * @param maxAttempts - the maximum number of attempts before the message is dropped, can be set to `Infinity`
     */
    public message(recipient: string, data: MessageData, senderID = null, maxAttempts = 1): void {
        let attempts = maxAttempts;
        if (isNaN(attempts)) {
            attempts = 1;
        } else if (attempts < 1) {
            attempts = 1;
        }
        const workerMessage: BroadcastWorkerMessage = {
            senderID: senderID,
            recipient: recipient,
            data: data,
            messageId: uuid(),
            maxAttempts: attempts,
        };
        this.postMessageToWorker(workerMessage);
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
            senderID: newInbox.uid,
            recipient: "broadcast-worker",
            messageId: null,
            maxAttempts: 1,
            data: {
                type: "hookup",
                name: name,
                inboxAddress: address,
            },
        };
        this.postMessageToWorker(workerMessage);
        return newInbox.uid;
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
            senderID: null,
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

    private disconnectInbox(inbox: Inbox, index: number): void {
        inbox.disconnected = true;
        inbox.callback = () => {};
        const workerMessage: BroadcastWorkerMessage = {
            senderID: null,
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
}
