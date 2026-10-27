import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";
import { ValidationError } from "./errors.js";

export type DnsResolver = (hostname: string) => Promise<string[]>;

const resolveHost: DnsResolver = async (hostname) => {
  const records = await dnsLookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
};

function isBlockedIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return true;
  const [a, b] = octets as [number, number, number, number];
  return a === 0 || a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}

function isBlockedIp(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isBlockedIpv4(address);
  if (family !== 6) return true;

  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  const mappedV4 = normalized.match(/(?:^|:)ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mappedV4?.[1] ? isBlockedIpv4(mappedV4[1]) : false;
}

/** Validates every resolved address so DNS rebinding cannot select a private target. */
export async function assertSafeUrl(input: string, resolver: DnsResolver = resolveHost): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new ValidationError("A valid URL is required");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ValidationError("Only http and https URLs are allowed");
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!hostname || hostname.toLowerCase() === "localhost") {
    throw new ValidationError("Local addresses are not allowed");
  }

  let addresses: string[];
  try {
    addresses = isIP(hostname) ? [hostname] : await resolver(hostname);
  } catch {
    throw new ValidationError("URL hostname could not be resolved");
  }
  if (addresses.length === 0 || addresses.some(isBlockedIp)) {
    throw new ValidationError("URL resolves to a blocked network address");
  }
  return parsed;
}
