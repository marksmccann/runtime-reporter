# AGENTS.md

## Project

`runtime-reporter` is a small TypeScript library that exports a single factory, `createReporter`, from [src/index.ts](/Users/mfamily/Sites/runtime-reporter/src/index.ts). The package description in [package.json](/Users/mfamily/Sites/runtime-reporter/package.json) is:

> A framework-agnostic, type-safe reporting library that standardizes how clients handle errors and logs.

Published outputs are generated into `dist/` as ESM, CommonJS, and declaration files via `tsup`.

## Source of Truth

- Runtime implementation: [src/index.ts](/Users/mfamily/Sites/runtime-reporter/src/index.ts)
- Behavior coverage: [src/index.test.ts](/Users/mfamily/Sites/runtime-reporter/src/index.test.ts)
- User-facing documentation: [README.md](/Users/mfamily/Sites/runtime-reporter/README.md)
- Package metadata and scripts: [package.json](/Users/mfamily/Sites/runtime-reporter/package.json)

When documenting or changing behavior, prefer the runtime code and tests over assumptions.

## Public API

The package currently exports types and one factory:

- `createReporter(messages, options?)`
- `RuntimeReporterMessage`
- `RuntimeReporterMessages`
- `RuntimeReporterToken`
- `RuntimeReporterTokens`
- `ReporterTokensArgs`
- `RuntimeReporter`
- `RuntimeReporterReportPayload`
- `RuntimeReporterOptions`

`createReporter` returns an object with these methods:

- `message(code, ...args)` returns the resolved and formatted message string.
- `warn(code, ...args)` logs with `console.warn` only if the code exists in `messages`.
- `error(code, ...args)` logs with `console.error` only if the code exists in `messages`.
- `log(code, ...args)` logs with `console.log` only if the code exists in `messages`.
- `fail(code, ...args)` always throws `new Error(formattedMessage)`.

## Runtime Behavior

The current implementation does the following:

- Replaces `{{ token }}` placeholders using a global regular expression per provided token key.
- Escapes token names before building the replacement regex.
- Converts `Error` token values to `error.message`.
- Converts `null` and `undefined` token values to empty strings.
- Uses `formatMessage(message, code)` to produce the final string shown to users; the default format is ``${message} (${code})``.
- Uses `defaultTemplate`, which defaults to `"An error occurred"`, when a code is not present in `messages`.
- Calls `onReport` for `error`, `warn`, `log`, and `fail`, but not for `message`.
- Passes the unformatted resolved message to `onReport`.

## Type Behavior

The library’s type-driven ergonomics are a major feature.

- `RuntimeReporterMessages<T>` maps a union of message descriptors into a `code -> template` object shape.
- `ReporterTokensArgs<T, U>` determines whether reporter methods take a second argument for a given code.
- If a message declares token names with `tokens: "name" | "other"`, the second argument is required and typed as a record of those keys.
- If a message has no tokens, the second argument is omitted.
- The current implementation also treats `tokens: never` the same as omitting `tokens`, to support derived/generated consumer types.
- `message()` has a DX-oriented literal return type based on the template string and code, but the runtime value is the resolved formatted string.

## Tested Cases

The current tests cover these behaviors:

- Formatted message resolution with one token and multiple tokens
- Tokenless messages
- Custom `formatMessage`
- `message()` not triggering `onReport`
- `error`, `warn`, and `log` console behavior when codes exist
- `error` not logging when the message set is empty
- `onReport` payloads for `log`, `warn`, `error`, and `fail`
- `fail()` throwing formatted errors
- `defaultTemplate` fallback behavior
- Type-level handling for a tokenized message and a `tokens: never` message

## Commands

From [package.json](/Users/mfamily/Sites/runtime-reporter/package.json):

- Build: `npm run build`
- Test: `npm test`
- Watch tests: `npm run test:watch`
- Lint: `npm run lint`
- Fix lint: `npm run lint:fix`
- Format: `npm run format`
- Check formatting: `npm run format:check`

## Editing Guidance

- Keep changes small and centered on [src/index.ts](/Users/mfamily/Sites/runtime-reporter/src/index.ts) unless the public API or docs require more.
- Update [src/index.test.ts](/Users/mfamily/Sites/runtime-reporter/src/index.test.ts) when runtime or public typing behavior changes.
- Update [README.md](/Users/mfamily/Sites/runtime-reporter/README.md) when changing the public API, documented examples, or type behavior.
- Do not claim support for behavior that is not covered by the code.
