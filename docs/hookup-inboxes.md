## Hookup

The `hookup()` method is used to hookup an inbox to the messaging system. It requires an inbox alias and the inbox function.

```javascript
import { hookup } from "wwibs";

function inbox(data) {
    const { type } = data;
    switch (type) {
        default:
            return;
    }
}

const inboxUid = hookup("example", this.inbox.bind(this));
```

In the example above an inbox with the alias **example** is registered with the messaging system.

> Note: An inbox alias is not unique. Any message sent to the **example** inbox will be delivered to all inboxes labeled as **example**.
