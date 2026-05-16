# Runtime Reporter

A framework-agnostic, type-safe reporting library that standardizes how clients handle errors and logs.

```ts
// ./src/my-reporter.ts
import { createReporter } from "runtime-reporter";

export default createReporter({
    ERR01: "Something went wrong",
});

// ./src/MyComponent.ts
import myReporter from "./my-reporter";

export function MyComponent() {
    useEffect(() => {
        myReporter.error("ERR01");
    }, []);
}
```

## Why?

Runtime Reporter solves these problems:

- duplicated log messages
- inconsistent error wording
- fragile test assertions
- accidental exposure of sensitive data

by introducing these features:

- centralized and standardized error messaging
- stable error codes for debugging and error tracking
- test assertions without string duplication
- safer production output (no sensitive data exposure)

## Who is this for?

- Front-end frameworks and libraries
- Projects that need stable error codes
- Teams replacing custom logging systems
- Projects that want safer production output

## Installation

```bash
npm install runtime-reporter
```

## Quick start

A full, copy-and-paste example of how to use Runtime Reporter in your project:

```ts
import { createReporter } from "runtime-reporter";

const messages = {
    ERR01: "{{ componentName }} failed to mount",
    ERR02: "Failed to load configuration",
    ERR03: "Failed to fetch {{ resource }} from {{ url }}",
} as const;

/** The runtime reporter for <project-name> */
const reporter = createReporter(
    process.env.NODE_ENV === "production" ? ({} as typeof messages) : messages
);

export default reporter;
```

## Features

If you are new to Runtime Reporter, take a moment to explore its core features.

### 1. Code-based messaging

Replace inline strings with centralized, code-based identifiers.

```ts
// Without runtime-reporter
console.log("Something went wrong");
// ❌ Logs: "Something went wrong"

// With runtime-reporter
reporter.log("ERR02");
// ✅ Logs: "Something went wrong (ERR02)"
```

### 2. Dynamic messages

Inject runtime data into your messages via message templates and tokenized variables.

```ts
const reporter = createReporter({
    ERR01: "{{ componentName }} failed to mount",
} as const);

reporter.error("ERR01", { componentName: "MyComponent" });
// ✅ Logs: "MyComponent failed to mount (ERR01)"
```

### 3. Production-ready

Pass an empty object to the `createReporter` function in production environments for better security and a smaller bundle size.

```ts
const reporter = createReporter(
    process.env.NODE_ENV === "production" ? ({} as typeof messages) : messages
);
```

Development environments get detailed messaging, while production environments get as little as possible.

```ts
reporter.error("ERR02");
// ✅ In development, it logs: "Failed to load configuration (ERR02)"
// ✅ In production, it does not log

reporter.fail("ERR02");
// ✅ In development, it throws: "Failed to load configuration (ERR02)"
// ✅ In production, it throws: "An error occurred (ERR02)"
```

### 4. Type safety

Define your messages as an `as const` record to get autocomplete and compile-time validation for message codes.

> Note: Token names are inferred directly from the template strings. Whitespace inside placeholders is trimmed, so `{{ name }}` and `{{   name   }}` infer the same token key.

```ts
const messages = {
    // ✅ Autocomplete
    ERR01: "{{ componentName }} failed to mount",
    ERR02: "Failed to load configuration",
} as const; // 👈 The "as const" is required

const reporter = createReporter(messages);

// ✅ Autocomplete
reporter.error("ERR01", { componentName: "MyComponent" });

// ✅ No second argument needed when the message has no tokens
reporter.error("ERR02");

// ❌ TypeScript Error: "componentName" token is required
reporter.error("ERR01");

// ❌ TypeScript Error: token-less messages reject a second argument
reporter.error("ERR02", {});

// ❌ TypeScript Error: "ERR03" is not a valid message code
reporter.error("ERR03", { componentName: "MyComponent" });
```

### 5. Test friendly

Assert against resolved messages without duplicating message text in your test environment.

```ts
it("should log error if component fails to mount", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<MyComponent />);

    expect(console.error).toHaveBeenCalledWith(
        reporter.message("ERR01", { componentName: "MyComponent" })
        // ✅ Asserts: "MyComponent failed to mount (ERR01)"
    );
});
```

### 6. Custom side effects

Leverage the `onReport` hook to perform custom actions (e.g., logging to remote services) when a report is made.

```ts
const reporter = createReporter(messages, {
    onReport: (payload) => {
        fetch("/api/reports", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
});

reporter.error("ERR01", { componentName: "MyComponent" });
// ✅ Sends a POST request with the following payload:
// {
//     code: "ERR01",
//     message: "MyComponent failed to mount",
//     level: "error",
// }
```

## API

### `createReporter(messages, options?: RuntimeReporterOptions): RuntimeReporter`

Takes a record of message templates, an optional set of configuration options, and returns a reporter object. Token requirements are inferred from `{{ tokenName }}` placeholders in each template.

### `RuntimeReporter`

| Method  | Type                                             | Description                                                                                                                              |
| ------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| message | `(code: string, tokens?: RuntimeReporterTokens)` | Returns the resolved message without logging. This is especially useful in tests.                                                        |
| warn    | `(code: string, tokens?: RuntimeReporterTokens)` | Logs via `console.warn` **only if** the template exists in `messages`.                                                                   |
| error   | `(code: string, tokens?: RuntimeReporterTokens)` | Logs via `console.error` **only if** the template exists in `messages`.                                                                  |
| log     | `(code: string, tokens?: RuntimeReporterTokens)` | Logs via `console.log` **only if** the template exists in `messages`.                                                                    |
| fail    | `(code: string, tokens?: RuntimeReporterTokens)` | Throws `new Error(formattedMessage)` in **all** environments. Uses the `defaultTemplate` when the template does not exist in `messages`. |

### `RuntimeReporterOptions`

| Property        | Type                                              | Required | Description                                                                                                                                                                                      |
| --------------- | ------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| formatMessage   | `(message: string, code: string) => string`       | No       | Customize the final output of every message. By default, messages are in the format: `"<message> (<code>)"`. This option does not affect the message provided to the `onReport` hook.            |
| defaultTemplate | `string`                                          | No       | Fallback message text used when the code does not exist in `messages`. Defaults to `"An error occurred"`. This is mostly relevant for `fail()` in production when you pass an empty message set. |
| onReport        | `(payload: RuntimeReporterReportPayload) => void` | No       | A hook to perform custom actions when a report is made via `error`, `warn`, `log`, or `fail`.                                                                                                    |

### `RuntimeReporterTokens`

| Property | Type                   | Description                                                                                                                  |
| -------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `string` | `RuntimeReporterToken` | A record of token names along with their replacement value. Supported types include: `string`, `number`, `boolean`, `Error`. |

### `RuntimeReporterMessages`

`RuntimeReporterMessages` is the record-oriented helper type used by `createReporter`.

```ts
type RuntimeReporterMessages = Record<string, string>;
```

### `RuntimeReporterReportPayload`

| Property  | Type                                   | Description                                                                                                                                        |
| --------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code`    | `string`                               | The unique code associated with the message.                                                                                                       |
| `message` | `string`                               | The resolved message text; the placeholders have been replaced by their token values but, it has not been formatted by the `formatMessage` option. |
| `level`   | `"error" \| "warn" \| "log" \| "fail"` | The severity level of the report.                                                                                                                  |

## Examples

### Custom formatting

You can customize the format of the message by providing a custom `formatMessage` function.

```ts
const reporter = createReporter(messages, {
    formatMessage: (message, code) => `[${code}] ${message}`,
});

reporter.message("ERR01", { componentName: "MyComponent" });
// "[ERR01] MyComponent failed to mount"
```

### Calling `fail()` in production

When the `createReporter` function provided an empty message set in production, the `fail` method will use the customizable `defaultTemplate` option which defaults to "An error occurred". This message is intended to be generic so that it does not reveal sensitive information about the system, while still providing a code for debugging purposes.

```ts
const reporter = createReporter(
    process.env.NODE_ENV === "production" ? ({} as typeof messages) : messages
);

reporter.fail("ERR02");
// throws: "An error occurred (ERR02)"
```

### Using `message()` in tests

The `message` method returns the resolved string without side effects, allowing you to validate precise messaging without duplicating text.

```ts
it("should log error if component fails to mount", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<MyComponent />);

    expect(console.error).toHaveBeenCalledWith(
        reporter.message("ERR01", { componentName: "MyComponent" })
    );
});
```

### Messages without tokens

If a template does not contain any `{{ token }}` placeholders, do not pass a second argument.

```ts
const messages = {
    ERR01: "{{ componentName }} failed to mount",
    INFO01: "Ready",
} as const;

const reporter = createReporter(messages);

reporter.message("INFO01");
reporter.log("INFO01");
```

### Using `onReport` and `formatMessage` together

By combining the `onReport` and `formatMessage` options, you can have granular control over the message output and reporting behavior. For example, you could log an opaque message to users while still sending the full payload to a remote service in production environments. At the same time, you can log the full message in non-production environments for debugging purposes.

```ts
const reporter = createReporter(messages, {
    formatMessage: (message, code) => {
        if (process.env.NODE_ENV === "production") {
            return "Opaque error message ...";
        } else {
            return `${message} (${code})`;
        }
    },
    onReport: (payload) => {
        if (process.env.NODE_ENV === "production") {
            fetch("/api/reports", {
                method: "POST",
                body: JSON.stringify(payload),
            });
        }
    },
});

reporter.error("ERR01", { componentName: "MyComponent" });
// ✅ In production, users get am opaque message AND remote service gets the full message
// ✅ In non-production, developers get the full message
```

### Type safety without TypeScript

You can still preserve literal template inference in JavaScript by using a const assertion style JSDoc annotation.

```js
const messages = /** @type {const} */ ({
    ERR01: "{{ componentName }} failed to mount",
    ERR02: "Failed to load configuration",
    ERR03: "Failed to fetch {{ resource }} from {{ url }}",
});

const reporter = createReporter(messages);
```

### CommonJS support

If needed, Common JS imports are also available.

```js
const { createReporter } = require("runtime-reporter");
```
