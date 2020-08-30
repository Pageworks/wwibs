# Sending Messages

WWIBS uses a modified version of the [Actor Model](https://en.wikipedia.org/wiki/Actor_model). The key difference is that not all controllers within the system are Actors. Developers will choose what controllers will become actors by registering an inbox. However, any controller within the system can send messages to Actors by using the Broadcaster class.

## Message

**Message Settings**

```typescript
type settings = {
    recipient: string;
    type: string;
    data: {
        [key: string]: any;
    };
    senderId?: string;
    maxAttempts?: number;
};
```

**Example**

```javascript
import { message } from "wwibs";

message({
    recipient: "inbox-alias",
    type: "message",
    data: {
        message: "This is an example",
    },
});
```

## Reply

If a sender provides a `senderId` value the `data` object sent to the inbox will contain a `replyId` value. You can use this value to respond directly to the sender using `reply()` or you can reply to the sender and all the other recipients using `replyAll()`

**Reply Settings**

```typescript
type settings = {
    replyId: string;
    type: string;
    data: {
        [key: string]: any;
    };
    senderId?: string;
    maxAttempts?: number;
};
```

**Example**

```javascript
import { reply } from "wwibs";

inbox(data){
    switch (data.type){
        case "message":
            console.log(data.message);
            reply({
                replyId: data.replyId,
                type: 'message',
                data: {
                    message: 'This is an example response'
                }
            });
            break;
        default:
            console.warn(`Undefined message type: ${data.type}`);
            break;
    }
}
```
