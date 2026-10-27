import { describe, expect, it } from "vitest";
import { ValidationError } from "./errors.js";
import { assertSafeUrl } from "./ssrfGuard.js";

const resolvesTo = (...addresses: string[]) => async () => addresses;

describe("assertSafeUrl", () => {
  it("accepts a public HTTP URL", async () => {
    await expect(assertSafeUrl("https://example.com/a", resolvesTo("93.184.216.34"))).resolves.toMatchObject({ hostname: "example.com" });
  });

  it.each(["ftp://example.com", "file:///etc/passwd", "http://localhost", "http://127.0.0.1", "http://10.1.2.3", "http://172.16.0.1", "http://192.168.1.1", "http://169.254.1.1", "http://[::1]", "http://[fc00::1]", "http://0.0.0.0"])("rejects %s", async (url) => {
    await expect(assertSafeUrl(url, resolvesTo("93.184.216.34"))).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects a hostname with any private DNS result", async () => {
    await expect(assertSafeUrl("https://example.com", resolvesTo("93.184.216.34", "10.0.0.1"))).rejects.toBeInstanceOf(ValidationError);
  });
});
