/**
 * Quick and dirty unique ID generation.
 * This method does not follow RFC 4122 and does not guarantee a universally unique ID.
 * @see https://tools.ietf.org/html/rfc4122
 */
export function uuid(): string {
    return new Array(4)
        .fill(0)
        .map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))
        .join("-");
}
