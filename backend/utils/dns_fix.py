import os
import socket
from typing import Iterable, List, Tuple

import dns.resolver
from utils.logging import log


def _parse_nameservers(value: str) -> List[str]:
    return [part.strip() for part in value.split(",") if part.strip()]


class DNSResolver:
    def __init__(self, nameservers: Iterable[str]) -> None:
        self.resolver = dns.resolver.Resolver()
        self.resolver.nameservers = list(nameservers) or ["8.8.8.8", "1.1.1.1"]
        self.resolver.timeout = 3
        self.resolver.lifetime = 3

    def resolve(self, host: str, rdtype: str) -> List[str]:
        try:
            answer = self.resolver.resolve(host, rdtype)
            return [str(rdata) for rdata in answer]
        except Exception:
            return []


def apply_dns_patch() -> None:
    nameserver_env = os.getenv("DNS_NAMESERVERS", "8.8.8.8,1.1.1.1")
    nameservers = _parse_nameservers(nameserver_env)
    resolver = DNSResolver(nameservers)
    original_getaddrinfo = socket.getaddrinfo

    def patched_getaddrinfo(
        host: str,
        port: int,
        family: int = 0,
        type: int = 0,
        proto: int = 0,
        flags: int = 0,
    ) -> List[Tuple[int, int, int, str, Tuple[str, int]]]:
        try:
            return original_getaddrinfo(host, port, family, type, proto, flags)
        except socket.gaierror as exc:
            log(f"[Trendova Hub] DNS patch: fallback resolution for {host} ({exc})")
            result = []
            for rdtype in ("A", "AAAA"):
                for ip in resolver.resolve(host, rdtype):
                    addr_family = socket.AF_INET6 if rdtype == "AAAA" else socket.AF_INET
                    sockaddr = (ip, port)
                    result.append((addr_family, socket.SOCK_STREAM, proto, "", sockaddr))
            if result:
                return result
            raise

    socket.getaddrinfo = patched_getaddrinfo
