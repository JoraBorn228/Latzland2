import math
import zlib
import struct

def make_png(width, height, rgba_data):
    def chunk(tag, data):
        return struct.pack("!I", len(data)) + tag + data + struct.pack("!I", zlib.crc32(tag + data) & 0xffffffff)

    header = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack("!IIBBBBB", width, height, 8, 6, 0, 0, 0))
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        raw.extend(rgba_data[y*width*4 : (y+1)*width*4])
    idat = chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    iend = chunk(b"IEND", b"")
    return header + ihdr + idat + iend

SIZE = 512
cx = cy = SIZE / 2.0
rgba = bytearray(SIZE * SIZE * 4)

# Colors
C_GOLD = (255, 179, 0, 255)       # #ffb300
C_GOLD_HI = (255, 200, 40, 255)   # #ffc828
C_WHITE = (255, 255, 255, 255)    # #ffffff
C_EMERALD_LIGHT = (14, 90, 48, 255) # #0e5a30
C_EMERALD_DEEP = (9, 58, 30, 255)   # #093a1e
C_SHADOW = (0, 0, 0, 0)

R_OUTER = 236.0
R_CENTER_OUTER = 78.0
R_CENTER_WHITE = 71.0
R_CENTER_GOLD_IN = 59.0
R_CENTER_CORE = 53.0

# 2x supersampling for ultra-crisp antialiasing
SS = 2
SS_SIZE = SIZE * SS
ss_cx = cx * SS
ss_cy = cy * SS

# Precompute petal parameters
THETA_BASE = math.radians(11.8)
THETA_TIP = math.radians(24.2)
R_INNER_BLADE = 68.0 * SS
R_OUTER_BLADE = R_OUTER * SS

def sample_point(x, y):
    dx = x - ss_cx
    dy = y - ss_cy
    r = math.hypot(dx, dy)
    if r < 1e-6:
        return C_EMERALD_LIGHT

    # 1. Check center medallion
    if r <= R_CENTER_OUTER * SS:
        # Central Medallion rings
        if r > R_CENTER_WHITE * SS:
            return C_GOLD
        elif r > R_CENTER_GOLD_IN * SS:
            return C_WHITE
        elif r > R_CENTER_CORE * SS:
            return C_GOLD
        else:
            # Emerald center core with slight radial gradient
            t = r / (R_CENTER_CORE * SS)
            r_c = int(C_EMERALD_LIGHT[0] * (1 - t*0.35))
            g_c = int(C_EMERALD_LIGHT[1] * (1 - t*0.35))
            b_c = int(C_EMERALD_LIGHT[2] * (1 - t*0.35))
            return (r_c, g_c, b_c, 255)

    # 2. Check Petals
    theta = math.atan2(dy, dx)
    # Fold into [-pi/4, pi/4]
    theta_mod = ((theta + math.pi/4) % (math.pi/2)) - math.pi/4
    abs_theta = abs(theta_mod)

    # Radial span
    if r > R_OUTER_BLADE:
        return C_SHADOW

    # Petal half-angle at this radius
    # Linearly expand from R_INNER_BLADE to R_OUTER_BLADE
    t_blade = (r - R_INNER_BLADE) / (R_OUTER_BLADE - R_INNER_BLADE)
    if t_blade < 0:
        return C_SHADOW

    half_angle = THETA_BASE + t_blade * (THETA_TIP - THETA_BASE)
    
    # Distance from edge in angular terms
    angular_diff = abs_theta - half_angle
    # Linear distance across arc approximately:
    dist_side = angular_diff * r
    dist_cap = r - R_OUTER_BLADE # <= 0 inside blade

    # We want max(dist_side, dist_cap) <= 0
    dist_outer = max(dist_side, dist_cap)
    if dist_outer > 0.0:
        return C_SHADOW

    # Inside blade, distance to nearest outer boundary:
    boundary_dist = -dist_outer

    # Multi-tier border:
    # 0 to 4.5px (in ss coords, so 0 to 9ss): Gold
    # 9 to 19ss: White
    # 19 to 26ss: Gold
    # > 26ss: Emerald green fill
    B1 = 4.2 * SS
    B2 = 9.2 * SS
    B3 = 12.8 * SS

    if boundary_dist < B1:
        return C_GOLD
    elif boundary_dist < B2:
        return C_WHITE
    elif boundary_dist < B3:
        return C_GOLD
    else:
        # Emerald fill with subtle gradient
        t_fill = max(0.0, min(1.0, (boundary_dist - B3) / (25.0 * SS)))
        r_c = int(C_EMERALD_DEEP[0] + (C_EMERALD_LIGHT[0] - C_EMERALD_DEEP[0]) * t_fill)
        g_c = int(C_EMERALD_DEEP[1] + (C_EMERALD_LIGHT[1] - C_EMERALD_DEEP[1]) * t_fill)
        b_c = int(C_EMERALD_DEEP[2] + (C_EMERALD_LIGHT[2] - C_EMERALD_DEEP[2]) * t_fill)
        return (r_c, g_c, b_c, 255)

for y in range(SIZE):
    for x in range(SIZE):
        # 2x2 box supersampling
        c00 = sample_point(x * SS + 0.25 * SS, y * SS + 0.25 * SS)
        c01 = sample_point(x * SS + 0.75 * SS, y * SS + 0.25 * SS)
        c10 = sample_point(x * SS + 0.25 * SS, y * SS + 0.75 * SS)
        c11 = sample_point(x * SS + 0.75 * SS, y * SS + 0.75 * SS)

        r_sum = c00[0]*c00[3] + c01[0]*c01[3] + c10[0]*c10[3] + c11[0]*c11[3]
        g_sum = c00[1]*c00[3] + c01[1]*c01[3] + c10[1]*c10[3] + c11[1]*c11[3]
        b_sum = c00[2]*c00[3] + c01[2]*c01[3] + c10[2]*c10[3] + c11[2]*c11[3]
        a_sum = c00[3] + c01[3] + c10[3] + c11[3]

        idx = (y * SIZE + x) * 4
        if a_sum > 0:
            rgba[idx] = int(r_sum / a_sum)
            rgba[idx+1] = int(g_sum / a_sum)
            rgba[idx+2] = int(b_sum / a_sum)
            rgba[idx+3] = int(a_sum / 4.0)
        else:
            rgba[idx] = 0; rgba[idx+1] = 0; rgba[idx+2] = 0; rgba[idx+3] = 0

with open("public/logo2.png", "wb") as f:
    f.write(make_png(SIZE, SIZE, rgba))

print("public/logo2.png successfully rendered with mathematical precision!")
