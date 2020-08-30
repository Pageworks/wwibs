## Memory Management

The Broadcaster will purge disconnected inboxes every 5 minutes on high-end devices and every 1 minute on low-end devices. Device status is determined by the amount of available memory. To trigger a purge send a `cleanup` message to the Broadcaster.

```javascript
message("broadcaster", { type: "cleanup" });
```
