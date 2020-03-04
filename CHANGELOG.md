# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

-   History Worker web worker
-   History indexedDB table
-   Reply indexedDB table
-   Reply table fallback for incognito users

### Changed

-   `worker` variable has been renamed to `inboxWorker` in `Broadcaster`
-   `broadcast-worker.ts` renamed to `inbox-worker.ts`

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

[unreleased]: https://github.com/Pageworks/wwibs/compare/v0.0.5...HEAD
[0.0.5]: https://github.com/Pageworks/wwibs/releases/tag/v0.0.5...v0.0.4
[0.0.4]: https://github.com/Pageworks/wwibs/releases/tag/v0.0.4...v0.0.1
[0.0.1]: https://github.com/Pageworks/wwibs/releases/tag/v0.0.1
