import { describe, expect, it } from "vitest";
import {
  MAX_DOC_BYTES,
  validateDocumentFile,
  validateDocumentLink,
} from "@/lib/passport-safety";

describe("validateDocumentLink", () => {
  it("accepts an empty value because the link is optional", () => {
    expect(validateDocumentLink("").ok).toBe(true);
    expect(validateDocumentLink("   ").ok).toBe(true);
  });

  it("accepts https links to allowed document types", () => {
    expect(validateDocumentLink("https://files.example.com/lab.pdf").ok).toBe(true);
    expect(validateDocumentLink("https://files.example.com/scan.JPG").ok).toBe(true);
  });

  it("rejects non-https schemes", () => {
    expect(validateDocumentLink("http://files.example.com/lab.pdf").ok).toBe(false);
    expect(validateDocumentLink("javascript:alert(1)").ok).toBe(false);
    expect(validateDocumentLink("data:text/html;base64,PHA+").ok).toBe(false);
  });

  it("rejects unsupported or missing file types", () => {
    expect(validateDocumentLink("https://files.example.com/report.exe").ok).toBe(false);
    expect(validateDocumentLink("https://files.example.com/report").ok).toBe(false);
  });

  it("rejects text that is not a URL", () => {
    expect(validateDocumentLink("my lab results").ok).toBe(false);
  });
});

describe("validateDocumentFile", () => {
  it("accepts an allowed type under the size ceiling", () => {
    expect(validateDocumentFile({ name: "lab.pdf", size: 1024 }).ok).toBe(true);
  });

  it("rejects disallowed types", () => {
    expect(validateDocumentFile({ name: "script.js", size: 10 }).ok).toBe(false);
  });

  it("rejects oversized files", () => {
    const result = validateDocumentFile({ name: "scan.png", size: MAX_DOC_BYTES + 1 });
    expect(result.ok).toBe(false);
  });
});
