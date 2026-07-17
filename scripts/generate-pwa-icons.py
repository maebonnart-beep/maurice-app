from PIL import Image, ImageDraw, ImageFont

PRIMARY = "#0e8b84"
ACCENT = "#ef6a4c"
WHITE = "#ffffff"
FONT_PATH = "C:/Windows/Fonts/arialbd.ttf"

OUT_DIR = "web/public"


def draw_m_plus(size, padding_ratio, bg, main_color, plus_color):
    img = Image.new("RGB", (size, size), bg)
    draw = ImageDraw.Draw(img)

    content = int(size * (1 - padding_ratio * 2))
    font_size = int(content * 0.62)
    font = ImageFont.truetype(FONT_PATH, font_size)
    plus_font = ImageFont.truetype(FONT_PATH, int(font_size * 0.55))

    m_text = "M"
    plus_text = "+"

    m_bbox = draw.textbbox((0, 0), m_text, font=font)
    m_w, m_h = m_bbox[2] - m_bbox[0], m_bbox[3] - m_bbox[1]
    plus_bbox = draw.textbbox((0, 0), plus_text, font=plus_font)
    plus_w, plus_h = plus_bbox[2] - plus_bbox[0], plus_bbox[3] - plus_bbox[1]

    gap = size * 0.01
    total_w = m_w + gap + plus_w
    start_x = (size - total_w) / 2

    m_x = start_x - m_bbox[0]
    m_y = (size - m_h) / 2 - m_bbox[1] - size * 0.03
    draw.text((m_x, m_y), m_text, font=font, fill=main_color)

    plus_x = start_x + m_w + gap - plus_bbox[0]
    plus_y = m_y + (m_h - plus_h) - size * 0.10
    draw.text((plus_x, plus_y), plus_text, font=plus_font, fill=plus_color)

    return img


# Standard icons (purpose "any") — content fills most of the canvas
icon_192 = draw_m_plus(192, 0.14, PRIMARY, WHITE, ACCENT)
icon_192.save(f"{OUT_DIR}/icon-192.png")

icon_512 = draw_m_plus(512, 0.14, PRIMARY, WHITE, ACCENT)
icon_512.save(f"{OUT_DIR}/icon-512.png")

# Maskable icon — extra padding so Android's circular/rounded mask doesn't clip the logo
icon_512_maskable = draw_m_plus(512, 0.24, PRIMARY, WHITE, ACCENT)
icon_512_maskable.save(f"{OUT_DIR}/icon-512-maskable.png")

# Apple touch icon — written directly to app/ (Next's apple-icon file convention)
apple_icon = draw_m_plus(180, 0.16, PRIMARY, WHITE, ACCENT)
apple_icon.save("web/app/apple-icon.png")

# Favicon as PNG via Next's `icon` file convention — avoids the ICO decoder entirely
favicon_icon = draw_m_plus(32, 0.08, PRIMARY, WHITE, ACCENT).convert("RGBA")
favicon_icon.save("web/app/icon.png")

print("Icons generated.")
