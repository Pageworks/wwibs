interface IDBEventTarget extends EventTarget {
    result: any;
}
interface IDBEvent extends Event {
    target: IDBEventTarget;
}

type Reply = {
    uid: string;
    senderID: number;
    recipientIDs: Array<number>;
};

const dbUid = Date.now();

class HistoryWorker {
    private db: IDBDatabase;
    private fallbackReplies: Array<Reply>;

    constructor() {
        self.onmessage = this.inbox.bind(this);
        this.db = null;
        this.fallbackReplies = [];

        const request = indexedDB.open(`${dbUid}`, 1);
        request.onsuccess = (e: IDBEvent) => {
            // @ts-ignore
            self.postMessage({
                recipient: "broadcaster",
                data: {
                    type: "history-worker-ready",
                },
            });
        };
        request.onupgradeneeded = (e: Event) => {
            const response = e.target as IDBOpenDBRequest;
            this.db = response.result;

            const historyStore = this.db.createObjectStore("history", { autoIncrement: true });
            historyStore.createIndex("messageUid", "messageUid", { unique: true });
            historyStore.createIndex("recipient", "recipient", { unique: false });
            historyStore.createIndex("data", "data", { unique: false });

            const replyStore = this.db.createObjectStore("reply", { autoIncrement: true });
            replyStore.createIndex("messageUid", "messageUid", { unique: true });
            replyStore.createIndex("senderID", "senderID", { unique: false });
            replyStore.createIndex("recipientIDs", "recipientIDs", { unique: false });
        };
    }

    /**
     * Worker received a message from the Broadcaster.
     * This method is an alias of `self.onmessage`
     * */
    private inbox(e: MessageEvent) {
        const data = e.data;

        /** Handle window unload event */
        if (e.data?.type === "unload" && this.db) {
            indexedDB.deleteDatabase(`${dbUid}`);
            return;
        }

        /** If we have a DB and a message was posted log it in the History table */
        if (data?.recipient && this.db) {
            this.makeHistory(data.recipient, data.data, data.messageId);
            return;
        }

        /** Log the message for future reply requests */
        if (data?.senderID || data?.recipientIDs) {
            // TODO: store data in DB or array
            return;
        }
    }

    /**
     * Creates a transaction with indexedDB to store the message within the History table.
     */
    private makeHistory(recipient: string, data: MessageData, messageId: string): void {
        new Promise((resolve, reject) => {
            const transaction = this.db.transaction("history", "readwrite");
            const store = transaction.objectStore("history");
            const transactionData = {
                messageUid: messageId,
                recipient: recipient,
                data: data,
            };
            store.add(transactionData);
            transaction.oncomplete = resolve;
            transaction.onerror = reject;
        })
            .then(() => {})
            .catch(error => {
                console.error(`Failed to write to the History table:`, error);
            });
    }
}
new HistoryWorker();
