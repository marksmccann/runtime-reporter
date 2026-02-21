import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    createRuntimeReporter,
    type RuntimeReporterMessage,
    type RuntimeReporterMessages,
} from "./index.js";

type TestMessages = Array<
    | {
          code: "ERR01";
          template: "{{ name }} failed";
          tokens: ["name"];
      }
    | {
          code: "WARN02";
          template: "Deprecated: {{ option }}";
          tokens: ["option"];
      }
    | {
          code: "INFO03";
          template: "Ready";
          tokens?: undefined;
      }
>;

const messages: RuntimeReporterMessages<TestMessages> = {
    ERR01: "{{ name }} failed",
    WARN02: "Deprecated: {{ option }}",
    INFO03: "Ready",
};

describe("createRuntimeReporter", () => {
    describe("message()", () => {
        it("returns formatted message with token substitution and code suffix", () => {
            const reporter = createRuntimeReporter(messages);

            expect(reporter.message("ERR01", { name: "Module" })).toBe("Module failed (ERR01)");
        });

        it("returns message without tokens when template has none", () => {
            const reporter = createRuntimeReporter(messages);

            expect(reporter.message("INFO03")).toBe("Ready (INFO03)");
        });

        it("substitutes multiple tokens", () => {
            const reporter = createRuntimeReporter(messages);

            expect(reporter.message("WARN02", { option: "legacyMode" })).toBe(
                "Deprecated: legacyMode (WARN02)"
            );
        });

        it("uses custom formatMessage when provided", () => {
            const reporter = createRuntimeReporter(messages, {
                formatMessage: (msg, code) => `[${code}] ${msg}`,
            });

            expect(reporter.message("INFO03")).toBe("[INFO03] Ready");
        });
    });

    describe("error(), warn(), log()", () => {
        beforeEach(() => {
            vi.clearAllMocks();
            vi.spyOn(console, "error").mockImplementation(() => {});
            vi.spyOn(console, "warn").mockImplementation(() => {});
            vi.spyOn(console, "log").mockImplementation(() => {});
        });

        it("error() logs when code exists in messages", () => {
            const reporter = createRuntimeReporter(messages);
            reporter.error("ERR01", { name: "X" });

            expect(console.error).toHaveBeenCalledWith("X failed (ERR01)");
        });

        it("error() does not log when code is missing (empty messages)", () => {
            const emptyMessages = {} as Record<string, string>;
            const reporter = createRuntimeReporter(
                emptyMessages as RuntimeReporterMessages<TestMessages>
            );
            reporter.error("ERR01", { name: "X" });

            expect(console.error).not.toHaveBeenCalled();
        });

        it("warn() logs when code exists in messages", () => {
            const reporter = createRuntimeReporter(messages);
            reporter.warn("WARN02", { option: "old" });

            expect(console.warn).toHaveBeenCalledWith("Deprecated: old (WARN02)");
        });

        it("log() logs when code exists in messages", () => {
            const reporter = createRuntimeReporter(messages);
            reporter.log("INFO03");

            expect(console.log).toHaveBeenCalledWith("Ready (INFO03)");
        });
    });

    describe("fail()", () => {
        it("throws Error with formatted message", () => {
            const reporter = createRuntimeReporter(messages);

            expect(() => reporter.fail("ERR01", { name: "Config" })).toThrow(
                new Error("Config failed (ERR01)")
            );
        });

        it("uses defaultTemplate when code is not in messages", () => {
            const reporter = createRuntimeReporter({} as RuntimeReporterMessages<TestMessages>, {
                defaultTemplate: "Something went wrong",
            });

            // @ts-expect-error - This is a test case for the defaultTemplate
            expect(() => reporter.fail("MISSING")).toThrow(
                new Error("Something went wrong (MISSING)")
            );
        });

        it("uses default defaultTemplate when code missing and no option", () => {
            const reporter = createRuntimeReporter({} as RuntimeReporterMessages<TestMessages>);

            // @ts-expect-error - This is a test case for the defaultTemplate
            expect(() => reporter.fail("X")).toThrow(new Error("An error occurred (X)"));
        });
    });
});
