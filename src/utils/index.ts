export { logger, morganStream } from './logger';

export function isPublicIPv4(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Regex);
  
  if (!match) {
    return false;
  }

  const octets = match.slice(1).map(Number);
  if (octets.some(octet => octet < 0 || octet > 255)) {
    return false;
  }

  const [a, b, c, d] = octets as [number, number, number, number];

  // Private address ranges (RFC 1918)
  if (a === 10) return false; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return false; // 172.16.0.0/12
  if (a === 192 && b === 168) return false; // 192.168.0.0/16

  // Loopback (RFC 1122)
  if (a === 127) return false; // 127.0.0.0/8

  // Link-local (RFC 3927)
  if (a === 169 && b === 254) return false; // 169.254.0.0/16

  // Multicast (RFC 5771)
  if (a >= 224 && a <= 239) return false; // 224.0.0.0/4

  // Reserved/Broadcast (RFC 6890)
  if (a >= 240) return false; // 240.0.0.0/4 and above

  // Broadcast address
  if (a === 255 && b === 255 && c === 255 && d === 255) return false;

  // Special addresses
  if (a === 0) return false; // 0.0.0.0/8 (current network)
  if (a === 100 && b >= 64 && b <= 127) return false; // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 192 && b === 0 && c === 0) return false; // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && c === 2) return false; // 192.0.2.0/24 (TEST-NET-1)
  if (a === 198 && b >= 18 && b <= 19) return false; // 198.18.0.0/15 (Network benchmark tests)
  if (a === 198 && b === 51 && c === 100) return false; // 198.51.100.0/24 (TEST-NET-2)
  if (a === 203 && b === 0 && c === 113) return false; // 203.0.113.0/24 (TEST-NET-3)

  return true;
}
