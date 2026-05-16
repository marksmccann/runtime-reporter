import { describe, it, expect, vi, beforeEach } from "vitest";
import { createReporter } from "./index.js";

const messages = {
    ERR01: "{{ name }} failed",
    WARN02: "Deprecated: {{ option }}",
    INFO03: "Ready",
    ERR04: "{{ name }} failed at {{ location }}",
    ERR05: "{{   componentName   }} broke in {{\tstage\t}}",
} as const;

const inferredReporter = createReporter(messages);

inferredReporter.message("INFO03");
// @ts-expect-error token-less templates should not accept a second argument
inferredReporter.message("INFO03", {});
// @ts-expect-error tokens should still be required when the template declares them
inferredReporter.message("ERR01");
// @ts-expect-error multiple inferred tokens should all be required
inferredReporter.message("ERR04", { name: "ConfigLoader" });
inferredReporter.message("ERR04", { name: "ConfigLoader", location: "boot" });
inferredReporter.message("ERR05", { componentName: "Button", stage: "render" });

describe("createReporter", () => {
    describe("message()", () => {
        it("returns formatted message with token substitution and code suffix", () => {
            const reporter = createReporter(messages);

            expect(reporter.message("ERR01", { name: "Module" })).toBe("Module failed (ERR01)");
        });

        it("returns message without tokens when template has none", () => {
            const reporter = createReporter(messages);

            expect(reporter.message("INFO03")).toBe("Ready (INFO03)");
        });

        it("substitutes multiple tokens", () => {
            const reporter = createReporter(messages);

            expect(reporter.message("WARN02", { option: "legacyMode" })).toBe(
                "Deprecated: legacyMode (WARN02)"
            );
        });

        it("substitutes all tokens in a message with multiple placeholders", () => {
            const reporter = createReporter(messages);

            expect(reporter.message("ERR04", { name: "ConfigLoader", location: "boot" })).toBe(
                "ConfigLoader failed at boot (ERR04)"
            );
        });

        it("trims whitespace around inferred token names", () => {
            const reporter = createReporter(messages);

            expect(reporter.message("ERR05", { componentName: "Button", stage: "render" })).toBe(
                "Button broke in render (ERR05)"
            );
        });

        it("uses custom formatMessage when provided", () => {
            const reporter = createReporter(messages, {
                formatMessage: (msg, code) => `[${code}] ${msg}`,
            });

            expect(reporter.message("INFO03")).toBe("[INFO03] Ready");
        });

        it('should not call "onReport" when provided', () => {
            const onReport = vi.fn();
            const reporter = createReporter(messages, { onReport });
            reporter.message("INFO03");

            expect(onReport).not.toHaveBeenCalled();
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
            const reporter = createReporter(messages);
            reporter.error("ERR01", { name: "X" });

            expect(console.error).toHaveBeenCalledWith("X failed (ERR01)");
        });

        it("error() does not log when code is missing (empty messages)", () => {
            const emptyMessages = {} as typeof messages;
            const reporter = createReporter(emptyMessages);
            reporter.error("ERR01", { name: "X" });

            expect(console.error).not.toHaveBeenCalled();
        });

        it("warn() logs when code exists in messages", () => {
            const reporter = createReporter(messages);
            reporter.warn("WARN02", { option: "old" });

            expect(console.warn).toHaveBeenCalledWith("Deprecated: old (WARN02)");
        });

        it("log() logs when code exists in messages", () => {
            const reporter = createReporter(messages);
            reporter.log("INFO03");

            expect(console.log).toHaveBeenCalledWith("Ready (INFO03)");
        });

        it('should call "onReport" via "log()" when provided', () => {
            const onReport = vi.fn();
            const reporter = createReporter(messages, { onReport });
            reporter.log("INFO03");

            expect(onReport).toHaveBeenCalledWith({
                code: "INFO03",
                message: "Ready",
                level: "log",
            });
        });

        it('should call "onReport" via "warn()" when provided', () => {
            const onReport = vi.fn();
            const reporter = createReporter(messages, { onReport });
            reporter.warn("WARN02", { option: "old" });

            expect(onReport).toHaveBeenCalledWith({
                code: "WARN02",
                message: "Deprecated: old",
                level: "warn",
            });
        });

        it('should call "onReport" via "error()" when provided', () => {
            const onReport = vi.fn();
            const reporter = createReporter(messages, { onReport });
            reporter.error("ERR01", { name: "X" });

            expect(onReport).toHaveBeenCalledWith({
                code: "ERR01",
                message: "X failed",
                level: "error",
            });
        });
    });

    describe("fail()", () => {
        it("throws Error with formatted message", () => {
            const reporter = createReporter(messages);

            expect(() => reporter.fail("ERR01", { name: "Config" })).toThrow(
                new Error("Config failed (ERR01)")
            );
        });

        it("uses defaultTemplate when code is not in messages", () => {
            const reporter = createReporter({} as typeof messages, {
                defaultTemplate: "Something went wrong",
            });

            // @ts-expect-error - This is a test case for the defaultTemplate
            expect(() => reporter.fail("MISSING")).toThrow(
                new Error("Something went wrong (MISSING)")
            );
        });

        it("uses default defaultTemplate when code missing and no option", () => {
            const reporter = createReporter({} as typeof messages);

            // @ts-expect-error - This is a test case for the defaultTemplate
            expect(() => reporter.fail("X")).toThrow(new Error("An error occurred (X)"));
        });

        it('should call "onReport" when provided', () => {
            const onReport = vi.fn();
            const reporter = createReporter(messages, { onReport });

            expect(() => reporter.fail("ERR01", { name: "Config" })).toThrow(
                new Error("Config failed (ERR01)")
            );

            expect(onReport).toHaveBeenCalledWith({
                code: "ERR01",
                message: "Config failed",
                level: "fail",
            });
        });
    });
});
