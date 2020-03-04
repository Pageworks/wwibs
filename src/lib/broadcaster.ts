import { uuid } from "./utils";

type Inbox = {
    callback: Function;
    disconnected?: boolean;
    uid: string;
};

const VERSION = "REPLACE_WITH_VERISON";

export default class Broadcaster {
    private inboxWorker: Worker;
    private historyWorker: Worker;
    private inboxes: Array<Inbox>;
    private messageQueue: Array<BroadcastWorkerMessage>;
    private state: {
        allowMessaging: boolean;
        historyWorkerReady: boolean;
        inboxWorkerReady: boolean;
    };

    constructor() {
        this.inboxWorker;
        this.historyWorker;
        this.setupBroadcastWorker();
        this.setupHistoryWorker();
        this.inboxes = [];
        this.messageQueue = [];
        this.state = {
            allowMessaging: false,
            historyWorkerReady: false,
            inboxWorkerReady: false,
        };
    }

    private async setupHistoryWorker() {
        let request = await fetch(`https://cdn.jsdelivr.net/npm/wwibs@${VERSION}/history-worker.min.js`);
        let url;
        if (request.ok) {
            const response = await request.blob();
            url = URL.createObjectURL(response);
        } else {
            request = await fetch("/history-worker.min.js");
            if (request.ok) {
                const response = await request.blob();
                url = URL.createObjectURL(response);
            } else {
                console.error(`Failed to fetch the History Worker from the CDN and ${location.origin}.`);
            }
        }
        if (url) {
            this.historyWorker = new Worker(url);
            this.historyWorker.onmessage = this.handleHistoryWorkerMessage.bind(this);
        }
    }

    private async setupBroadcastWorker() {
        let request = await fetch(`https://cdn.jsdelivr.net/npm/wwibs@${VERSION}/inbox-worker.min.js`);
        let url;
        if (request.ok) {
            const response = await request.blob();
            url = URL.createObjectURL(response);
        } else {
            request = await fetch("/inbox-worker.min.js");
            if (request.ok) {
                const response = await request.blob();
                url = URL.createObjectURL(response);
            } else {
                console.error(`Failed to fetch the Inbox Worker from the CDN and ${location.origin}.`);
            }
        }
        if (url) {
            this.inboxWorker = new Worker(url);
            this.inboxWorker.onmessage = this.handleInboxWorkerMessage.bind(this);
        }
    }

    /**
     * Set the broadcasters `workerReady` state to `true` and flush any queued messages.
     */
    private flushMessageQueue(): void {
        this.state.allowMessaging = true;
        if (this.messageQueue.length) {
            for (let i = 0; i < this.messageQueue.length; i++) {
                this.inboxWorker.postMessage(this.messageQueue[i]);
                this.historyWorker.postMessage(this.messageQueue[i]);
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
    private handleInboxWorkerMessage(e: MessageEvent): void {
        const data = e.data;
        if (data.recipient?.trim().toLowerCase() === "broadcaster") {
            this.inbox(data.data);
        } else {
            this.sendDataToInboxes(data.inboxIndexes, data.data);
        }
    }

    /**
     * Broadcaster received a message from the History worker.
     * This method is an alias of `this.worker.onmessage`
     */
    private handleHistoryWorkerMessage(e: MessageEvent): void {
        const data = e.data;
        this.inbox(data);
    }

    private sendUserDeviceInformation(): void {
        // @ts-ignore
        const deviceMemory = window.navigator?.deviceMemory ?? 8;
        const isSafari = navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0;
        const workerMessage: BroadcastWorkerMessage = {
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
            case "inbox-worker-ready":
                this.state.inboxWorkerReady = true;
                this.checkWorkerStatuses();
                break;
            case "history-worker-ready":
                this.state.historyWorkerReady = true;
                this.checkWorkerStatuses();
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

    private checkWorkerStatuses() {
        if (this.state.historyWorkerReady && this.state.inboxWorkerReady) {
            this.flushMessageQueue();
            this.sendUserDeviceInformation();
        }
    }

    /**
     * Sends a message to an inbox.
     * @param recipient - the name of the inboxes you want to send a message to
     * @param data - the `MessageData` object that will be sent to the inboxes
     * @param maxAttempts - the maximum number of attempts before the message is dropped, can be set to `Infinity`
     */
    public message(recipient: string, data: MessageData, maxAttempts = 1): void {
        let attempts = maxAttempts;
        if (isNaN(attempts)) {
            attempts = 1;
        } else if (attempts < 1) {
            attempts = 1;
        }
        const workerMessage: BroadcastWorkerMessage = {
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
            this.inboxWorker.postMessage(message);
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
            recipient: "broadcast-worker",
            messageId: null,
            maxAttempts: 1,
            data: {
                type: "update-addresses",
                addresses: updatedAddresses,
            },
        };
        this.inboxWorker.postMessage(workerMessage);
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
