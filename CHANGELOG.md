# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2020-04-28

### Fixed

-   bugs with the new message & reply format
-   missing worker version variable

## [0.1.0] - 2020-04-28

### Fixed

-   fixed infinite message bug
-   updates NPM packages

### Reworked

-   `message()` and `reply()` and `replyAll()` methods require a settings object

**Message**

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

**Reply**

```typescript
type settings = {
    replyId: string;
    data: {
        [key: string]: any;
    };
    senderId?: string;
    maxAttempts?: number;
};
```

## [0.0.9] - 2020-03-13

### Fixed

-   updated TypeScript declaration files

## [0.0.8] - 2020-03-13

### Fixed

-   added missing TypeScript declaration files

## [0.0.7] - 2020-03-13

### Fixed

-   incorrect CND version

## [0.0.6] - 2020-03-11

### Added

-   History indexedDB table [#8](https://github.com/Pageworks/wwibs/issues/8)
-   Reply indexedDB table
-   Reply table fallback for incognito users
-   `reply()` method [#9](https://github.com/Pageworks/wwibs/issues/9)
-   `replyAll()` method [#9](https://github.com/Pageworks/wwibs/issues/9)

### Changed

-   `broadcast-worker.ts` renamed to `wwibs-worker.ts`

### Updated

-   npm packages

## [0.0.5] - 2020-02-02

### Fixed

-   `globalManager` is no longer being overridden every time the script is imported

## [0.0.4] - 2020-02-02

### Added

-   broadcaster is now globally accessible allowing messaging in and out of IIFE functions

## [0.0.1] - 2020-01-30

### Added

-   registered package name
-   initial broadcaster class
-   broadcast worker attempts to fetch local version
-   broadcast worker falls back to fetching CDN version
-   prerelease script to prepare broadcaster worker script for CDN
-   broadcaster export declarations

[unreleased]: https://github.com/Pageworks/wwibs/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/Pageworks/wwibs/releases/tag/v0.1.1...v0.1.0
[0.1.0]: https://github.com/Pageworks/wwibs/releases/tag/v0.1.0...v0.0.9
[0.0.9]: https://github.com/Pageworks/wwibs/releases/tag/v0.0.9...v0.0.8
[0.0.8]: https://github.com/Pageworks/wwibs/releases/tag/v0.0.8...v0.0.7
[0.0.7]: https://github.com/Pageworks/wwibs/releases/tag/v0.0.7...v0.0.6
[0.0.6]: https://github.com/Pageworks/wwibs/releases/tag/v0.0.6...v0.0.5
[0.0.5]: https://github.com/Pageworks/wwibs/releases/tag/v0.0.5...v0.0.4
[0.0.4]: https://github.com/Pageworks/wwibs/releases/tag/v0.0.4...v0.0.1
[0.0.1]: https://github.com/Pageworks/wwibs/releases/tag/v0.0.1
