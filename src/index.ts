/**
 * The type for a full list of messages organized by code and template string.
 * @since v0.8.0
 */
export type RuntimeReporterMessages = Record<string, string>;

/**
 * The type for the supported values of a placeholder token
 * @since v0.1.0
 */
export type RuntimeReporterToken = string | number | boolean | Error | null | undefined;

/**
 * The type for a record of placeholder token names and their values
 * @since v0.2.0
 */
export type RuntimeReporterTokens = Record<string, RuntimeReporterToken>;

/**
 * Trims spaces, tabs, and newlines from both ends of a string literal.
 * @private
 */
type Trim<S extends string> = S extends ` ${infer Rest}`
    ? Trim<Rest>
    : S extends `${infer Rest} `
      ? Trim<Rest>
      : S extends `\n${infer Rest}`
        ? Trim<Rest>
        : S extends `${infer Rest}\n`
          ? Trim<Rest>
          : S extends `\t${infer Rest}`
            ? Trim<Rest>
            : S extends `${infer Rest}\t`
              ? Trim<Rest>
              : S;

/**
 * Extracts all token names declared in `{{ tokenName }}` placeholders within a template string.
 * @private
 */
type TemplateTokens<S extends string> = S extends `${string}{{${infer Token}}}${infer Rest}`
    ? Trim<Token> | TemplateTokens<Rest>
    : never;

/**
 * Resolves the token record type for a specific template string.
 * @private
 */
type ReporterTokens<S extends string> = [TemplateTokens<S>] extends [never]
    ? never
    : Record<TemplateTokens<S>, RuntimeReporterToken>;

/**
 * Determines the second argument tuple for a specific template string.
 * @private
 */
type TokensArg<S extends string> = [TemplateTokens<S>] extends [never]
    ? []
    : [tokens: ReporterTokens<S>];

/**
 * Return type for message(); displays the template + code in default format on hover.
 * The runtime value is the resolved string (tokens substituted); the type is for DX only.
 * @private
 */
type MessageReturnType<
    M extends RuntimeReporterMessages,
    K extends keyof M & string,
> = M[K] extends string ? `${M[K]} (${K})` : string;

/**
 * The runtime report object with all of it's associated methods;
 * the result of the primary export: `createReporter`
 * @since v0.7.0
 */
export interface RuntimeReporter<M extends RuntimeReporterMessages> {
    /**
     * Clears the internal warnOnce cache for this reporter instance
     */
    clearWarnings(): void;

    /**
     * Logs an error to the console with the full text of the targeted message
     *
     * _Note: This method will only log when the message associated with the code is found;
     * meaning it will not be called in production if the `createReporter` function
     * is provided an empty message set._
     * @param code A direct reference to the unique code for the targeted message
     * @param args A record containing the placeholder token values for the message
     */
    error<K extends keyof M & string>(code: K, ...args: TokensArg<M[K]>): void;

    /**
     * Throws an error with the full text of the targeted message in all environments
     *
     * _Note: When the `createReporter` function is called in production with an empty
     * message set, this method will use the "defaultTemplate" option in this format: "&lt;defaultTemplate> (&lt;code>)"_
     * @param code A direct reference to the unique code for the targeted message
     * @param args A record containing the placeholder token values for the message
     */
    fail<K extends keyof M & string>(code: K, ...args: TokensArg<M[K]>): never;

    /**
     * Logs a message to the console with the full text of the targeted message
     *
     * _Note: This method will only log when the message associated with the code is found;
     * meaning it will not be called in production if the `createReporter` function
     * is provided an empty message set._
     * @param code A direct reference to the unique code for the targeted message
     * @param args A record containing the placeholder token values for the message
     */
    log<K extends keyof M & string>(code: K, ...args: TokensArg<M[K]>): void;

    /**
     * Retrieves the full text of the targeted message
     *
     * _Note: As a convenience, the return type will attempt to show the literal type of the template
     * pattern and code suffix (in the default format) for the message on hover; the actual output may
     * vary based on the tokens provided and the `formatMessage` option._
     *
     * _Tip: This method is particularly useful in the test environment; allowing you
     * to make precise assertions without having to duplicate any of the raw message text._
     * @param code A direct reference to the unique code for the targeted message
     * @param args The remaining optional argument for the function; a record containing the placeholder token values
     */
    message<K extends keyof M & string>(code: K, ...args: TokensArg<M[K]>): MessageReturnType<M, K>;

    /**
     * Logs a warning to the console with the full text of the targeted message
     *
     * _Note: This method will only log when the message associated with the code is found;
     * meaning it will not be called in production if the `createReporter` function
     * is provided an empty message set._
     * @param code A direct reference to the unique code for the targeted message
     * @param args A record containing the placeholder token values for the message
     */
    warn<K extends keyof M & string>(code: K, ...args: TokensArg<M[K]>): void;

    /**
     * Logs a warning to the console the first time a code is reported
     *
     * _Note: This method deduplicates by code per reporter instance and will only log
     * when the message associated with the code is found; meaning it will not be called
     * in production if the `createReporter` function is provided an empty message set._
     * @param code A direct reference to the unique code for the targeted message
     * @param args A record containing the placeholder token values for the message
     */
    warnOnce<K extends keyof M & string>(code: K, ...args: TokensArg<M[K]>): void;
}

/**
 * The payload for the onReport hook
 * @since v0.1.0
 */
export type RuntimeReporterReportPayload = {
    /**
     * The unique code associated with the message
     */
    code: string;

    /**
     * The resolved message text; the placeholders have been replaced by their token values
     * but, it has not been formatted by the `formatMessage` option.
     */
    message: string;

    /**
     * The severity level of the report
     */
    level: "error" | "warn" | "log" | "fail";
};

type RuntimeReporterLevel = RuntimeReporterReportPayload["level"];

/**
 * The configuration options for createReporter()
 * @since v0.1.0
 */
export interface RuntimeReporterOptions {
    /**
     * A hook to format the message text that is logged to the console. By default, it
     * outputs the message in the following format: "&lt;message> (&lt;code>)".
     *
     * _Note: This option does not affect the message provided to the `onReport` hook._
     * @param message The resolved message text; the placeholders have been replaced by their token values
     * @param code The unique code associated with the message
     * @returns The final, fully formatted message
     */
    formatMessage?: (message: string, code: string) => string;

    /**
     * The default template to fallback on when a provided code does not
     * have an associated message. Defaults to "An error occurred"
     */
    defaultTemplate?: string;

    /**
     * A hook to perform custom actions when any of the report methods (minus the
     * `message` method) are called. This is useful for logging to a remote service,
     * or for performing other actions based on the report.
     * @param payload The payload for the report
     */
    onReport?: (payload: RuntimeReporterReportPayload) => void;
}

/**
 * Resolves the message text via the message template and the associated tokens
 * @param template The template string for the reported message
 * @param tokens The token names and values for the instance
 * @returns The resolved message text; returns an empty string if the template is falsy
 * @private
 */
const resolveTemplate = function resolveTemplate(
    template: string,
    tokens?: Record<string, RuntimeReporterToken>
): string {
    let message = template;

    if (message) {
        Object.entries(tokens || {}).forEach((entry) => {
            const [token, value] = entry;
            const replace = value instanceof Error ? value.message : String(value ?? "");
            const sanitized = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            message = message.replace(new RegExp(`\\{\\{\\s*${sanitized}\\s*\\}\\}`, "g"), replace);
        });
    }

    return message;
};

/**
 * Creates a new runtime reporter object with all of it's associated methods
 * @param messages The messages record organized by code and template
 * @param options Optional configuration options
 * @returns A runtime report object
 * @since v0.1.0
 */
export function createReporter<const M extends RuntimeReporterMessages>(
    messages: M,
    options: RuntimeReporterOptions = {}
): RuntimeReporter<M> {
    const {
        formatMessage = (message, code) => `${message} (${code})`,
        defaultTemplate = "An error occurred",
        onReport,
    } = options;
    const messagesByCode = messages as Record<string, string>;
    const warnedCodes = new Set<string>();

    /**
     * Retrieves the resolved message text for a given code and its associated tokens
     * @param code The unique code associated with the message
     * @param args The record containing the placeholder token values
     * @returns The fully resolved message
     */
    const resolveMessage = function getMessage(
        code: string,
        ...args: Array<Record<string, RuntimeReporterToken>>
    ): string {
        const template = messagesByCode[code] || defaultTemplate;
        const tokens = args[0];
        return resolveTemplate(template, tokens);
    };

    /**
     * Resolves the formatted console-facing string and triggers the report hook
     * @param level The severity level of the report
     * @param code The unique code associated with the message
     * @param args The record containing the placeholder token values
     * @returns The resolved and formatted message pair
     */
    const prepareReport = function prepareReport(
        level: RuntimeReporterLevel,
        code: string,
        ...args: Array<Record<string, RuntimeReporterToken>>
    ): { message: string; formattedMessage: string } {
        const message = resolveMessage(code, ...args);
        const formattedMessage = formatMessage(message, code);
        if (onReport) onReport({ code, message, level });
        return { message, formattedMessage };
    };

    return {
        clearWarnings: () => {
            warnedCodes.clear();
        },
        error: (code, ...args) => {
            const { formattedMessage } = prepareReport("error", code, ...args);
            if (messagesByCode[code]) console.error(formattedMessage);
        },
        fail: (code, ...args) => {
            const { formattedMessage } = prepareReport("fail", code, ...args);
            throw new Error(formattedMessage);
        },
        log: (code, ...args) => {
            const { formattedMessage } = prepareReport("log", code, ...args);
            if (messagesByCode[code]) console.log(formattedMessage);
        },
        message: (code, ...args) => {
            const message = resolveMessage(code, ...args);
            const formattedMessage = formatMessage(message, code);
            return formattedMessage as MessageReturnType<M, typeof code & keyof M & string>;
        },
        warn: (code, ...args) => {
            const { formattedMessage } = prepareReport("warn", code, ...args);
            if (messagesByCode[code]) console.warn(formattedMessage);
        },
        warnOnce: (code, ...args) => {
            if (warnedCodes.has(code)) return;

            warnedCodes.add(code);

            const { formattedMessage } = prepareReport("warn", code, ...args);
            if (messagesByCode[code]) console.warn(formattedMessage);
        },
    };
}
