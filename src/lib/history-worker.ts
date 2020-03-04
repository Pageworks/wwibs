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

        if (e.data?.type === "unload" && this.db) {
            indexedDB.deleteDatabase(`${dbUid}`);
            return;
        }

        if (data?.recipient) {
            switch (data.recipient) {
                default:
                    break;
            }
        }
    }
}
