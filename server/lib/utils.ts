export function parseUrlSubdomain(hostname: string, {
  domains = [],
  protectedSubdomains = [],
  minimumCharacter = 4,
}: {
  domains?: string[];
  protectedSubdomains?: string[];
  minimumCharacter?: number;
} = {}) {
  const matched = new URLPattern({ hostname: `*.(${domains.join("|")})` })
    .exec({ hostname })
    ?.hostname
    .groups;
  if (!matched) return undefined;
  const subdomain = matched[0], domain = matched[1];
  if (subdomain.length < minimumCharacter) return undefined;
  if (protectedSubdomains.some((i) => subdomain.endsWith(i))) return undefined;

  return { domain, subdomain };
}
