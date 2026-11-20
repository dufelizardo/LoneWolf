"""Anuncia o nome do ambiente na rede local por mDNS (ADR-0169).

Responde às perguntas pelo nome em MDNS_NOME com o IP em MDNS_IP, para qualquer aparelho do Wi-Fi abrir o sistema sem mexer
no próprio arquivo hosts nem no modem. Só a biblioteca padrão: nada para instalar, e vários ambientes dividem a porta 5353.
"""
import os
import socket
import struct

GRUPO = "224.0.0.251"
PORTA = 5353
TTL = 120
TIPO_A = 1
TIPO_QUALQUER = 255
CLASSE_IN = 1
CACHE_FLUSH = 0x8000
FLAGS_RESPOSTA = 0x8400
FLAG_QR = 0x8000


def codificar_nome(nome):
    partes = b"".join(bytes([len(p)]) + p.encode("ascii") for p in nome.split("."))
    return partes + b"\x00"


def ler_nome(dados, pos):
    """Lê um nome do pacote, seguindo a compressão. Devolve o nome e a posição depois dele."""
    partes = []
    fim = None
    saltos = 0
    while True:
        tamanho = dados[pos]
        if tamanho & 0xC0 == 0xC0:
            if fim is None:
                fim = pos + 2
            pos = ((tamanho & 0x3F) << 8) | dados[pos + 1]
            saltos += 1
            if saltos > 16:
                raise ValueError("compressão em laço")
        elif tamanho == 0:
            return ".".join(partes), fim if fim is not None else pos + 1
        else:
            partes.append(dados[pos + 1:pos + 1 + tamanho].decode("ascii", "replace"))
            pos += 1 + tamanho


def perguntas(dados):
    """As perguntas do pacote como (nome, tipo). Resposta de outro aparelho não tem pergunta para nós."""
    _, flags, total = struct.unpack("!HHH", dados[:6])
    if flags & FLAG_QR:
        return []
    lista = []
    pos = 12
    for _ in range(total):
        nome, pos = ler_nome(dados, pos)
        tipo, _ = struct.unpack("!HH", dados[pos:pos + 4])
        pos += 4
        lista.append((nome.lower(), tipo))
    return lista


def registro(nome, ip, classe):
    return codificar_nome(nome) + struct.pack("!HHIH", TIPO_A, classe, TTL, 4) + socket.inet_aton(ip)


def resposta_multicast(nome, ip):
    cabecalho = struct.pack("!HHHHHH", 0, FLAGS_RESPOSTA, 0, 1, 0, 0)
    return cabecalho + registro(nome, ip, CLASSE_IN | CACHE_FLUSH)


def resposta_unicast(id_pergunta, nome, ip):
    """Quem pergunta de outra porta não escuta o grupo: leva a resposta direta, com o id e a pergunta (RFC 6762, 6.7)."""
    cabecalho = struct.pack("!HHHHHH", id_pergunta, FLAGS_RESPOSTA, 1, 1, 0, 0)
    pergunta = codificar_nome(nome) + struct.pack("!HH", TIPO_A, CLASSE_IN)
    return cabecalho + pergunta + registro(nome, ip, CLASSE_IN)


def abrir_socket(ip_interface):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    if hasattr(socket, "SO_REUSEPORT"):
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
    s.bind(("", PORTA))
    interface = socket.inet_aton(ip_interface)
    s.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, socket.inet_aton(GRUPO) + interface)
    s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_IF, interface)
    s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 255)
    return s


def atender(dados, origem, nome, ip, enviar):
    try:
        procurado = any(n == nome and t in (TIPO_A, TIPO_QUALQUER) for n, t in perguntas(dados))
    except (IndexError, ValueError, struct.error):
        return
    if not procurado:
        return
    if origem[1] == PORTA:
        enviar(resposta_multicast(nome, ip), (GRUPO, PORTA))
    else:
        id_pergunta = struct.unpack("!H", dados[:2])[0]
        enviar(resposta_unicast(id_pergunta, nome, ip), origem)


def main():
    nome = os.environ["MDNS_NOME"].strip().lower()
    ip = os.environ["MDNS_IP"].strip()
    interface = os.environ["MDNS_INTERFACE_IP"].strip()
    s = abrir_socket(interface)
    s.sendto(resposta_multicast(nome, ip), (GRUPO, PORTA))
    print(f"Anunciando {nome} -> {ip} pela interface {interface}", flush=True)
    while True:
        dados, origem = s.recvfrom(9000)
        atender(dados, origem, nome, ip, s.sendto)


if __name__ == "__main__":
    main()
