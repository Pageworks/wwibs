# WWIBS

WWIBS is an Actor Model implementation for the web.

## Installation

Install the npm packages:

```sh
npm i -S wwibs
```

Import the functions:

```javascript
import { hookup, disconnect, message, reply, replyAll } from "wwibs";
```

Or use the CDN version:

```html
<script src="https://cdn.jsdelivr.net/npm/wwibs@0.2.0/wwibs.min.js">
```

```javascript
import { hookup, disconnect, message, reply, replyAll } from "https://cdn.jsdelivr.net/npm/wwibs@0.2.0/wwibs.min.mjs";
```

**Note:** If you don't use the `<script>` version of this library you will need to use the global functions instead:

```javascript
globalHookup();
globalDisconnect();
globalReply();
globalReplyAll();
```
