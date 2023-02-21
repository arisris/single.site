export function parseUrlSubdomain(url: string | URL, {
  domains = [],
  protectedSubdomains = [],
}: {
  domains?: string[];
  protectedSubdomains?: string[];
  minimumCharacter?: number;
} = {}) {
  let { hostname: domain, protocol } = new URL(url);
  const pattern = new RegExp(
    `^(?!${protectedSubdomains.join("|")})(.+\\.)?(?:${
      domains.map((h) => h.replace(/\./g, "\\.")).join("|")
    })$`,
  );

  const match = domain.match(pattern);
  if (!match) return null;
  protocol = protocol.replace(":", "");
  return {
    domain,
    protocol,
    subdomain: match[1],
  };
}
