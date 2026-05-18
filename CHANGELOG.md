# Changelog

## [0.10.0](https://github.com/marksmccann/runtime-reporter/compare/v0.9.4...v0.10.0) (2026-05-18)

### Features

* add warnOnce cache controls ([3bbf437](https://github.com/marksmccann/runtime-reporter/commit/3bbf4373f8f4d2d0c9cc11e19aaf087ea25fa049))

## [0.9.4](https://github.com/marksmccann/runtime-reporter/compare/v0.9.3...v0.9.4) (2026-05-17)

## [0.9.3](https://github.com/marksmccann/runtime-reporter/compare/v0.9.2...v0.9.3) (2026-05-16)

## [0.9.2](https://github.com/marksmccann/runtime-reporter/compare/v0.9.1...v0.9.2) (2026-05-16)

## [0.9.1](https://github.com/marksmccann/runtime-reporter/compare/v0.9.0...v0.9.1) (2026-05-16)

## [0.9.0](https://github.com/marksmccann/runtime-reporter/compare/v0.7.0...v0.9.0) (2026-05-16)

### ⚠ BREAKING CHANGES

- **types:** createReporter typing now infers tokens from template strings and no longer uses
  the old metadata-based RuntimeReporterMessages<T> pattern.

### Features

- harden ReporterTokensArgs type + add llms.txt file ([1f904f0](https://github.com/marksmccann/runtime-reporter/commit/1f904f01a3d8720c0953d9a45586b6e8bd20d291))

### Bug Fixes

- **types:** infer reporter tokens from message templates ([cc5c5c8](https://github.com/marksmccann/runtime-reporter/commit/cc5c5c87e73645043d11abe8125439e2864447d6))

## [0.7.0](https://github.com/marksmccann/runtime-reporter/compare/v0.6.0...v0.7.0) (2026-05-14)

### Features

- export ReporterTokensArgs and RuntimeReporter types + update description ([e7c047a](https://github.com/marksmccann/runtime-reporter/commit/e7c047afedd9696ec9f38474a73488abc61a76db))

## [0.6.0](https://github.com/marksmccann/runtime-reporter/compare/v0.5.1...v0.6.0) (2026-04-29)

### ⚠ BREAKING CHANGES

- The message text passed to the "onReport" payload is no longer pre-formatted. The
  placeholder tokens are still replaced but, it is not passed to the "formatMessage" hook.

### Bug Fixes

- prevent the "onReport" payload message from being formatted via "formatMessage" ([a2f0caf](https://github.com/marksmccann/runtime-reporter/commit/a2f0caff628a3f779a53b43d9e4d1226c598fe69))

## [0.5.1](https://github.com/marksmccann/runtime-reporter/compare/v0.5.0...v0.5.1) (2026-04-22)

## [0.5.0](https://github.com/marksmccann/runtime-reporter/compare/v0.4.8...v0.5.0) (2026-03-03)

### Features

- add "onReport" reporter option ([b938d30](https://github.com/marksmccann/runtime-reporter/commit/b938d30d61d95d37baa27eef22fe7fc4ab784d56))

## [0.4.8](https://github.com/marksmccann/runtime-reporter/compare/v0.4.7...v0.4.8) (2026-02-25)

### Bug Fixes

- correct return type for the fail method ([2eb63d7](https://github.com/marksmccann/runtime-reporter/commit/2eb63d7ee24523a34b157c02c4783245c83684d1))

## [0.4.7](https://github.com/marksmccann/runtime-reporter/compare/v0.4.6...v0.4.7) (2026-02-23)

## [0.4.6](https://github.com/marksmccann/runtime-reporter/compare/v0.4.5...v0.4.6) (2026-02-23)

## [0.4.5](https://github.com/marksmccann/runtime-reporter/compare/v0.4.4...v0.4.5) (2026-02-23)

## [0.4.4](https://github.com/marksmccann/runtime-reporter/compare/v0.4.3...v0.4.4) (2026-02-23)

## [0.4.3](https://github.com/marksmccann/runtime-reporter/compare/v0.4.2...v0.4.3) (2026-02-23)

### Bug Fixes

- add missing type annotation tags to some exports ([7314283](https://github.com/marksmccann/runtime-reporter/commit/7314283e231ed01d2d6fe5cace0bcb3ec01e57d6))

## [0.4.2](https://github.com/marksmccann/runtime-reporter/compare/v0.4.1...v0.4.2) (2026-02-23)

## [0.4.1](https://github.com/marksmccann/runtime-reporter/compare/v0.4.0...v0.4.1) (2026-02-22)

## [0.4.0](https://github.com/marksmccann/runtime-reporter/compare/v0.3.0...v0.4.0) (2026-02-22)

### Features

- converted tokens type from tuple to union + improved return type of message() ([a9584a6](https://github.com/marksmccann/runtime-reporter/commit/a9584a67b755d209469aa7f27186b320fef9ef3a))

## [0.3.0](https://github.com/marksmccann/runtime-reporter/compare/v0.2.0...v0.3.0) (2026-02-22)

### Features

- simplify expected messages type from array to simple union ([dc9e151](https://github.com/marksmccann/runtime-reporter/commit/dc9e151b8a34896e7cccc7004ca8a1e43527736f))

## [0.2.0](https://github.com/marksmccann/runtime-reporter/compare/v0.1.0...v0.2.0) (2026-02-21)

### Features

- add RuntimeReporterTokens type + update README ([1a28859](https://github.com/marksmccann/runtime-reporter/commit/1a288590ba5bb927f3757ca5ad39da5042313929))
- rename "createRuntimeReporter" to "createReporter" ([e0aa6ec](https://github.com/marksmccann/runtime-reporter/commit/e0aa6ec30ade057a2da310123aaf523ad3811292))

## 0.1.0 (2026-02-21)

### Features

- project setup + add core features ([d92d2ff](https://github.com/marksmccann/runtime-reporter/commit/d92d2ffb7980041859ebeca6ff0d4dfbb169d778))
