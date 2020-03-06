type MessageData = {
    type: string;
    replyID?: string;
    // eslint-disable-next-line
    [key: string]: any;
};

type Message = {
    replyID?: string;
    recipient?: string;
    data: MessageData;
};

interface BroadcastWorkerMessage extends Message {
    senderID?: string;
    messageId: string;
    maxAttempts: number;
    attempts?: number;
}

interface InboxHookupMessage extends MessageData {
    name: string;
    inboxAddress: number;
    uid: string;
}

interface InboxDisconnectMessage extends MessageData {
    inboxAddress: number;
}

interface InboxUpdateMessage extends MessageData {
    addresses: Array<{ oldAddressIndex: number; newAddressIndex: number }>;
}

interface UserDeviceInfoMessage extends MessageData {
    memory: number;
    isSafari: boolean;
}
