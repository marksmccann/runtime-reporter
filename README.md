# Runtime Reporter

Structured runtime reporting that is type-safe, centralized, and production-ready — for frameworks and applications

## Why Runtime Reporter?

Most projects eventually accumulate:

- duplicated log messages
- inconsistent error wording
- fragile test assertions
- accidental exposure of sensitive data

Runtime Reporter replaces ad-hoc logging with structured, code-based messaging.

## Who is Runtime Reporter for?

Use Runtime Reporter if:

- you're building a framework or library
- you want to avoid exposing sensitive information in production
- you want stable error codes for debugging and tracing runtime behavior
- you want to avoid bloat from verbose console messages
- you want a lightweight tool (~2 KB minified) that is easy to use
- you want to avoid duplicating message text in tests

## Features

If you are new to Runtime Reporter, take a moment to explore the its core features.

### Basic usage

Getting started is easy. Create a reporter instance with your messages and start logging.

```ts
import { createReporter } from "runtime-reporter";

const reporter = createReporter({
    ERR01: "MyComponent failed at mount",
});

reporter.error("ERR01");
```

### Code-based messaging

Replace inline strings with centralized, code-based identifiers.

```ts
// Without runtime-reporter (logs "MyComponent failed at mount")
console.error("MyComponent failed at mount");

// With runtime-reporter (logs "MyComponent failed at mount (ERR01)")
reporter.error("ERR01");
```

### Dynamic messages

Inject runtime data into your messages via message templates and tokenized variables.

```ts
const reporter = createReporter({
    ERR01: "{{ componentName }} failed at {{ phase }}",
});

reporter.error("ERR01", { componentName: "MyComponent", phase: "mount" });
```

### Type safety

Annotate your messages to get autocomplete and compile-time validation for message codes and token names.

```ts
const messages: RuntimeReporterMessages<{
    code: "ERR01";
    template: "{{ componentName }} failed at {{ phase }}";
    tokens: "componentName" | "phase";
}> = {
    ERR01: "{{ componentName }} failed at {{ phase }}",
};

const reporter = createReporter(messages);

reporter.error("ERR01", { componentName: "MyComponent", phase: "mount" }); // ✅ Autocomplete
reporter.error("ERR01", { componentName: "MyComponent" }); // ❌ TypeScript Error: "phase" is required
reporter.error("ERR02", { componentName: "MyComponent", phase: "mount" }); // ❌ TypeScript Error: "ERR02" is not a valid message code
```

### Production builds

Pass an empty object to the `createReporter` function in production for better security and a smaller bundle size.

```ts
const reporter = createReporter(
    process.env.NODE_ENV === "production" ? ({} as typeof messages) : messages
);
```

### Test friendly

Assert against resolved messages without duplicating message text in your test environment.

```ts
it("should log error if component fails to mount", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<MyComponent />);

    expect(console.error).toHaveBeenCalledWith(
        reporter.message("ERR01", { componentName: "MyComponent", phase: "mount" })
    );
});
```

## Installation

```bash
npm install runtime-reporter
```

## Quick start

A copy-and-paste example of how to use Runtime Reporter in your project.

```ts
// src/runtime-reporter.ts

import { createReporter, type RuntimeReporterMessages } from "runtime-reporter";

const messages: RuntimeReporterMessages<
    | {
          code: "ERR01";
          template: "{{ componentName }} failed at {{ phase }}";
          tokens: "componentName" | "phase";
      }
    | {
          code: "ERR02";
          template: "Failed to load configuration";
      }
> = {
    ERR01: "{{ componentName }} failed at {{ phase }}",
    ERR02: "Failed to load configuration",
};

/** The runtime reporter for <project-name> */
const reporter = createReporter(messages);

export default reporter;
```

Once your project's reporter is created, you can import and use it wherever you need it.

```ts
// src/my-component.ts

import { reporter } from "./runtime-reporter";

export function MyComponent() {
    useEffect(() => {
        reporter.error("ERR01", { componentName: "MyComponent", phase: "mount" });
    }, []);

    return <div>My Component</div>;
}
```

## API

### `createReporter(RuntimeReporterMessages, options?: RuntimeReporterOptions): RuntimeReporter`

Takes a list of messages, an optional set of configuration options, and returns a reporter object.

### `RuntimeReporter`

| Method  | Type                                                       | Description                                                                                                                             |
| ------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| message | `(code: string, tokens:? RuntimeReporterTokens) => string` | Returns the resolved message (no logging); useful for testing environments.                                                             |
| warn    | `(code: string, tokens:? RuntimeReporterTokens) => void`   | Logs via `console.warn` **only if** the template exists in `messages`.                                                                  |
| error   | `(code: string, tokens:? RuntimeReporterTokens) => void`   | Logs via `console.error` **only if** the template exists in `messages`.                                                                 |
| log     | `(code: string, tokens:? RuntimeReporterTokens) => void`   | Logs via `console.log` **only if** the template exists in `messages`.                                                                   |
| fail    | `(code: string, tokens:? RuntimeReporterTokens) => never`  | Throws `new Error(resolvedMessage)` in **all** environments. Uses the `defaultTemplate` when the template does not exist in `messages`. |

### `RuntimeReporterOptions`

| Property        | Type                                        | Required | Description                                                                                                                                                                                      |
| --------------- | ------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| formatMessage   | `(message: string, code: string) => string` | No       | Customize the final output of every message. By default, messages are in the format: `"<message> (<code>)"`.                                                                                     |
| defaultTemplate | `string`                                    | No       | Fallback message text used when the code does not exist in `messages`. Defaults to `"An error occurred"`. This is mostly relevant for `fail()` in production when you pass an empty message set. |

### `RuntimeReporterTokens`

| Property | Type                   | Description                                                                                                                  |
| -------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `string` | `RuntimeReporterToken` | A record of token names along with their replacement value. Supported types include: `string`, `number`, `boolean`, `Error`. |

## Examples

### Custom formatting

You can customize the format of the message by providing a custom `formatMessage` function.

```ts
const reporter = createReporter(messages, {
    formatMessage: (msg, code) => `[${code}] ${msg}`,
});

reporter.message("INFO01");
// "[INFO01] Ready"
```

### Using the reporter in production

When the `createReporter` function is called in production with an empty message set, the `fail` method will use the customizable `defaultTemplate` option which defaults to "An error occurred". This message is intended to be generic so that it does not reveal sensitive information about the system, while still providing a code for debugging purposes.

```ts
const reporter = createReporter(
    // Pass an empty object in production for better security and a smaller bundle size
    process.env.NODE_ENV === "production" ? ({} as typeof messages) : messages
);

reporter.fail("ERR01", { componentName: "Router", phase: "mount" });
// throws: "An error occurred (ERR01)"
```

The remaining reporter methods will not log anything in production when the code is missing from the message set.

```ts
const reporter = createReporter(
    // Pass an empty object in production for better security and a smaller bundle size
    process.env.NODE_ENV === "production" ? ({} as typeof messages) : messages
);

reporter.error("ERR01", { componentName: "Router", phase: "mount" });
// does not log anything
```

### Using `message()` in tests

The `message` method returns the resolved string without side effects, allowing you to validate precise messaging without duplicating text.

```ts
it("should log error if component fails to mount", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<MyComponent />);

    expect(console.error).toHaveBeenCalledWith(
        reporter.message("ERR01", { componentName: "MyComponent", phase: "mount" })
    );
});
```

### Type safety without TypeScript

You can still get the same benefits as TypeScript by using JSDoc-style type annotations.

```js
/**
 * @type {import("runtime-reporter").RuntimeReporterMessages<{
 *     code: "ERR01";
 *     template: "{{ componentName }} failed at {{ phase }}";
 *     tokens: "componentName" | "phase";
 * } | {
 *     code: "INFO01";
 *     template: "Ready";
 * }>}
 */
const messages = {
    ERR01: "{{ componentName }} failed at {{ phase }}",
    INFO01: "Ready",
};
```

### CommonJS support

If needed, Common JS imports are also available.

```js
const { createReporter } = require("runtime-reporter");
```
