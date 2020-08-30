## Disconnect

The `disconnect()` method is used to disconnect an inbox from the messaging system. It requires the inbox unique ID that was provided from the hookup.

```javascript
import { disconnect } from "wwibs";

class ExampleComponent extends HTMLElement {
    connectedCallback() {
        this.inboxUid = hookup("example", this.inbox.bind(this));
    }
    disconnectedCallback() {
        disconnect(this.inboxUid);
    }
}
```
