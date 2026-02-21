# Runtime Reporter

Runtime messaging that is convenient in development and secure in production
A lightweight runtime messaging solution that's helpful in dev, secure in production

### Usage

1. Define your messages

```ts
import { RuntimeReporterMessages } from "runtime-reporter";

type RuntimeMessages = Array<{
    code: "ERR01";
    template: "{{ componentName }} An error occured ...";
    tokens: ["componentName"];
}>;

const messages: RuntimeReporterMessages<RuntimeMessages> = {
    ERR01: "{{ componentName }} An error occured ...",
};
```

2. Create the reporter

Create a reporter instance by passing your messages object and optional configuration. In production builds, pass an empty array to enable tree-shaking and remove all message text from your bundle. The optional `scope` parameter prefixes message codes for easier identification (e.g., `MyApp(ERR01)` instead of `(ERR01)`).

```ts
import { createRuntimeReporter } = 'runtime-reporter';

const reporter = createRuntimeReporter(
    process.env.NODE_ENV !== 'production' ? messages : ([] as RuntimeMessages)
);

export default reporter;
```

3. Call the reporter methods in your project

```js
import reporter from "../my-runtime-reporter";

reporter.error("ERR01", { componentName: "MyComponent" });
```
