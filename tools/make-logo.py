"""
Extracts the white "Marlen Sweets" letters from design/logo-light.png into a
transparent PNG (assets/logo-mask.png). The site recolours it with CSS masks,
so one file serves every colour and animation.

Pure Python (no Pillow needed). Run:  python tools/make-logo.py
"""
import struct
import zlib
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "design" / "logo-light.png"
OUT_DIR = ROOT / "assets"
TARGET_W = 1000  # final logo width in px (plenty for retina hero)


def read_png(path):
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "not a PNG"
    pos, idat = 8, b""
    while pos < len(data):
        length, ctype = struct.unpack(">I4s", data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + length]
        if ctype == b"IHDR":
            w, h, depth, color, _, _, interlace = struct.unpack(">IIBBBBB", body)
        elif ctype == b"IDAT":
            idat += body
        pos += 12 + length
    assert depth == 8 and interlace == 0, "unsupported PNG"
    channels = {0: 1, 2: 3, 4: 2, 6: 4}[color]
    raw = zlib.decompress(idat)
    stride = w * channels
    rows, prev = [], bytearray(stride)
    i = 0
    for _ in range(h):
        ftype = raw[i]
        line = bytearray(raw[i + 1:i + 1 + stride])
        i += 1 + stride
        for x in range(stride):
            a = line[x - channels] if x >= channels else 0
            b = prev[x]
            c = prev[x - channels] if x >= channels else 0
            if ftype == 1:
                line[x] = (line[x] + a) & 255
            elif ftype == 2:
                line[x] = (line[x] + b) & 255
            elif ftype == 3:
                line[x] = (line[x] + ((a + b) >> 1)) & 255
            elif ftype == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pred = a if pa <= pb and pa <= pc else (b if pb <= pc else c)
                line[x] = (line[x] + pred) & 255
        rows.append(line)
        prev = line
    # luminance per pixel
    lum = []
    for line in rows:
        if channels >= 3:
            lum.append([(line[x] * 299 + line[x + 1] * 587 + line[x + 2] * 114) // 1000
                        for x in range(0, stride, channels)])
        else:
            lum.append([line[x] for x in range(0, stride, channels)])
    return w, h, lum


def write_png(path, w, h, rgba_rows):
    def chunk(t, body):
        return struct.pack(">I", len(body)) + t + body + struct.pack(">I", zlib.crc32(t + body) & 0xFFFFFFFF)
    raw = b"".join(b"\x00" + bytes(r) for r in rgba_rows)
    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(raw, 9))
           + chunk(b"IEND", b""))
    path.write_bytes(png)


def main():
    w, h, lum = read_png(SRC)
    print("source", w, h)

    # 1) background = near-white pixels connected to the image border
    WHITE = 238
    bg = [bytearray(w) for _ in range(h)]
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        if bg[y][x] or lum[y][x] < WHITE:
            continue
        bg[y][x] = 1
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))

    # 2) letter cores = bright pixels that are NOT background
    core = [bytearray(w) for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if not bg[y][x] and lum[y][x] >= 240:
                core[y][x] = 1

    # 3) alpha: full inside cores, soft ramp on a 2px band around them (anti-aliasing)
    alpha = [bytearray(w) for _ in range(h)]
    LO, HI = 170, 240
    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                continue
            if core[y][x]:
                alpha[y][x] = 255
                continue
            near = False
            for dy in (-2, -1, 0, 1, 2):
                yy = y + dy
                if 0 <= yy < h:
                    row = core[yy]
                    for dx in (-2, -1, 0, 1, 2):
                        xx = x + dx
                        if 0 <= xx < w and row[xx]:
                            near = True
                            break
                if near:
                    break
            if near:
                v = (lum[y][x] - LO) * 255 // (HI - LO)
                alpha[y][x] = max(0, min(255, v))

    # 4) crop to content
    ys = [y for y in range(h) if any(alpha[y])]
    xs = [x for x in range(w) if any(alpha[y][x] for y in ys)]
    x0, x1, y0, y1 = min(xs), max(xs) + 1, min(ys), max(ys) + 1
    pad = 4
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(w, x1 + pad), min(h, y1 + pad)
    cw, ch = x1 - x0, y1 - y0
    print("crop", cw, ch)

    # 5) downscale with box filter
    scale = cw / TARGET_W
    ow, oh = TARGET_W, round(ch / scale)
    rows = []
    for oy in range(oh):
        sy0, sy1 = int(oy * scale) + y0, max(int(oy * scale) + 1, int((oy + 1) * scale)) + y0
        out = bytearray()
        for ox in range(ow):
            sx0, sx1 = int(ox * scale) + x0, max(int(ox * scale) + 1, int((ox + 1) * scale)) + x0
            tot = n = 0
            for yy in range(sy0, min(sy1, y1)):
                r = alpha[yy]
                for xx in range(sx0, min(sx1, x1)):
                    tot += r[xx]; n += 1
            a = tot // n if n else 0
            out += bytes((255, 255, 255, a))
        rows.append(out)

    OUT_DIR.mkdir(exist_ok=True)
    write_png(OUT_DIR / "logo-mask.png", ow, oh, rows)
    print("wrote assets/logo-mask.png", ow, oh)

    # brown version for places where CSS masks are not used (social preview etc.)
    brown = [bytearray(b for i in range(0, len(r), 4) for b in (74, 47, 34, r[i + 3])) for r in rows]
    write_png(OUT_DIR / "logo-brown.png", ow, oh, brown)
    print("wrote assets/logo-brown.png")


if __name__ == "__main__":
    main()


def make_og():
    """1200x630 social preview: brown logo centred on cream."""
    import importlib
    src = OUT_DIR / "logo-mask.png"
    data = src.read_bytes()
    # reuse the reader on our own RGBA output: alpha is what we need
    w, h, _ = read_png(src)
    raw = zlib.decompress(b"".join(
        data[p + 8:p + 8 + struct.unpack(">I", data[p:p + 4])[0]]
        for p in _chunks(data, b"IDAT")))
    stride = w * 4
    alpha = [raw[y * (stride + 1) + 1 + 3: (y + 1) * (stride + 1): 4] for y in range(h)]  # filter 0 rows
    W, H = 1200, 630
    bg, fg = (251, 247, 242), (74, 47, 34)
    lw = 760
    s = w / lw
    lh = round(h / s)
    ox, oy = (W - lw) // 2, (H - lh) // 2
    rows = []
    for y in range(H):
        row = bytearray()
        for x in range(W):
            a = 0
            if ox <= x < ox + lw and oy <= y < oy + lh:
                a = alpha[min(h - 1, int((y - oy) * s))][min(w - 1, int((x - ox) * s))]
            row += bytes(round(bg[i] + (fg[i] - bg[i]) * a / 255) for i in range(3)) + b"\xff"
        rows.append(row)
    write_png(OUT_DIR / "og.png", W, H, rows)
    print("wrote assets/og.png")


def _chunks(data, ctype):
    pos = 8
    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        if data[pos + 4:pos + 8] == ctype:
            yield pos
        pos += 12 + length


if __name__ == "__main__":
    make_og()
