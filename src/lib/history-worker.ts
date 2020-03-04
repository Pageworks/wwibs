class HistoryWorker {
    constructor() {
        self.onmessage = this.inbox.bind(this);

        // @ts-ignore
        self.postMessage({
            recipient: "broadcaster",
            data: {
                type: "history-worker-ready",
            },
        });
    }

    /**
     * Worker received a message from another thread.
     * This method is an alias of `self.onmessage`
     * */
    private inbox(e: MessageEvent) {
        const { recipient, data } = e.data;
        console.log(recipient);
        switch (recipient) {
            default:
                break;
        }
    }
}
