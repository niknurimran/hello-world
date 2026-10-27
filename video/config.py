"""Creative config for the Alvique DU cat tree TikTok ad.

All crop/view coordinates are in SOURCE pixels:
  - product photos: the 1170x1170 product square cut out of the Shopee
    screenshot (Shopee UI above/below is removed by PRODUCT_SQUARE)
  - selfies: the original photo after EXIF rotation

A "fill" view is (cx, cy, w): centre and width of a 9:16 window.
A "card" rect is (x0, y0, x1, y1): a sharp inset shown on a blurred bed.
"""

W, H, FPS = 1080, 1920, 30
SR = 48000

NAVY = (14, 26, 54)        # #0E1A36
YELLOW = (255, 199, 44)    # #FFC72C
WHITE = (255, 255, 255)
OUTLINE = (8, 12, 26)

# TikTok safe zone: keep text out of the bottom 20% and the right-hand
# button column.
SAFE_LEFT, SAFE_RIGHT, SAFE_TOP, SAFE_BOTTOM = 60, 940, 210, int(H * 0.80)

HEADLINE_XY = (60, 236)
HEADLINE_SIZE = 138
SUB_Y = 1405               # centre line of the word-by-word subtitles
SUB_Y_CTA = 1235           # raised in the CTA so the basket arrow stays clear
SUB_SIZE = 78
LABEL_XY = (64, 1110)

MAX_SHOT = 2.0             # no shot longer than this (seconds)
MIN_SHOT = 0.45
END_HOLD = 1.5             # final product + price frame, minimum

# Dead-air trimming
GAP_KEEP_MAX = 0.30        # gaps up to this are left untouched
TAIL_PAD = 0.10            # kept after a word when a long gap is cut
LEAD_PAD = 0.08            # kept before a word when a long gap is cut
XFADE = 0.012

VO_LUFS = -14.0
MUSIC_LUFS = -20.0

# Raw screenshot rows that hold the 1170x1170 product image.
PRODUCT_SQUARE = (0, 681, 1170, 1851)

SOURCES = {
    "geram":  ("me/geram.jpg", "photo"),
    "senyum": ("me/senyum.jpg", "photo"),
    "p02": ("product/raw/p02_hero.png", "product"),          # 3 cats, living room
    "p03": ("product/raw/p03_ladder_pompom.png", "product"),  # ladder + pom-pom insets
    "p07": ("product/raw/p07_engineered.png", "product"),    # sisal/perch/base insets
    "p08": ("product/raw/p08_livingroom.png", "product"),    # sofas, no cats
    "p09": ("product/raw/p09_crafted.png", "product"),       # sisal/edge/cushion macro
    # p05_playground and p06_paradise show a different tree model on the
    # right-hand side, so they are deliberately not used.
}

SHOTS = {
    # ---- 1 HOOK -------------------------------------------------------
    "geram_punch": dict(src="geram", mode="fill", v0=(1000, 1288, 1449),
                        v1=(900, 1430, 1080), motion="punch", shake=1.0),
    "geram_tight": dict(src="geram", mode="fill", v0=(860, 1500, 880),
                        v1=(860, 1545, 760), motion="kick", shake=0.6),
    "geram_alt":   dict(src="geram", mode="fill", v0=(1150, 1330, 1000),
                        v1=(1080, 1300, 1180), motion="kick", shake=0.5),
    # ---- 2 INTRO ------------------------------------------------------
    "hero_full":   dict(src="p02", mode="fill", v0=(592, 585, 650),
                        v1=(592, 600, 560), motion="ease", reveal=True),
    "tree_lounge": dict(src="p08", mode="fill", v0=(604, 745, 470),
                        v1=(604, 750, 420), motion="ease"),
    "tree_window": dict(src="p09", mode="fill", v0=(905, 590, 520),
                        v1=(912, 600, 460), motion="ease"),
    "tree_retro":  dict(src="p07", mode="fill", v0=(290, 700, 500),
                        v1=(286, 690, 440), motion="ease"),
    # ---- 3 SATISFACTION -----------------------------------------------
    "climb_ladder":  dict(src="p03", mode="card", rect=(92, 92, 390, 558), motion="kick"),
    "capsule_grey":  dict(src="p02", mode="fill", v0=(598, 505, 440),
                          v1=(598, 548, 390), motion="kick"),
    "peek_orange":   dict(src="p02", mode="fill", v0=(640, 760, 460),
                          v1=(615, 748, 380), motion="kick"),
    "capsule_tabby": dict(src="p03", mode="fill", v0=(840, 520, 440),
                          v1=(840, 500, 370), motion="kick"),
    "top_ragdoll":   dict(src="p02", mode="fill", v0=(637, 420, 460),
                          v1=(640, 405, 390), motion="kick"),
    "peek_orange2":  dict(src="p03", mode="fill", v0=(965, 722, 400),
                          v1=(968, 722, 340), motion="kick"),
    # ---- 4 DETAIL -----------------------------------------------------
    "sisal_macro":  dict(src="p09", mode="card", rect=(72, 326, 438, 529), motion="kick"),
    "cushion_plush": dict(src="p09", mode="card", rect=(72, 797, 438, 1001), motion="kick"),
    "ladder_steps": dict(src="p02", mode="fill", v0=(452, 796, 420),
                         v1=(452, 830, 360), motion="kick"),
    "pompom_paw":   dict(src="p03", mode="card", rect=(92, 612, 390, 1080), motion="kick"),
    "base_wide":    dict(src="p02", mode="card", rect=(330, 870, 850, 1145), motion="kick"),
    "base_inset":   dict(src="p07", mode="card", rect=(647, 823, 838, 1016), motion="kick"),
    "edge_round":   dict(src="p09", mode="card", rect=(72, 560, 438, 766), motion="kick"),
    "sisal_post":   dict(src="p07", mode="card", rect=(647, 257, 838, 445), motion="kick"),
    "perch_soft":   dict(src="p07", mode="card", rect=(647, 547, 838, 734), motion="kick"),
    # ---- 5 CTA --------------------------------------------------------
    "cta_hero":   dict(src="p02", mode="fill", v0=(592, 590, 650),
                       v1=(592, 600, 600), motion="ease"),
    "cta_window": dict(src="p09", mode="fill", v0=(905, 600, 500),
                       v1=(908, 600, 470), motion="ease"),
    "cta_end":    dict(src="p08", mode="fill", v0=(604, 748, 470),
                       v1=(604, 750, 450), motion="ease", end_frame=True),
}

# Feature keywords are matched against the VO words of the DETAIL beat
# (lower-case, punctuation stripped, prefix match). The matching shot is
# cut in on that word and its label pops in at the same time.
FEATURES = [
    dict(shot="sisal_macro", label="TIANG SISAL",
         kw=["sisal", "tiang", "cakar", "garu", "scratch"]),
    dict(shot="cushion_plush", label="KUSYEN BOLEH BASUH",
         kw=["kusyen", "cushion", "basuh", "lembut", "tilam", "bantal", "plush", "gebu"]),
    dict(shot="ladder_steps", label="TANGGA",
         kw=["tangga", "ladder"]),
    dict(shot="pompom_paw", label="BOLA POM-POM",
         kw=["pom", "pompom", "bola", "mainan"]),
    dict(shot="base_wide", label="TAPAK LEBAR",
         kw=["tapak", "base", "lebar", "stabil", "tegap", "goyang"]),
    dict(shot="edge_round", label="BUCU BULAT",
         kw=["bucu", "licin", "rounded"]),
]

BEATS = [
    dict(id=1, name="HOOK", headline=["SOFA", "HANCUR?!"], color="yellow",
         pool=["geram_punch", "geram_tight", "geram_alt"],
         kw=["sofa", "hancur", "cakar", "rosak", "koyak", "geram", "baru", "beli"]),
    dict(id=2, name="INTRO", headline=["CAT TREE", "KAYU SOLID"], color="white",
         pool=["hero_full", "tree_lounge", "tree_window", "tree_retro"],
         kw=["cat", "tree", "kayu", "solid", "sejak", "selamat", "menara", "alvique"]),
    dict(id=3, name="SATISFACTION", headline=["KUCING", "TERUS BETAH"], color="yellow",
         min_shots=3,
         pool=["climb_ladder", "capsule_grey", "peek_orange", "capsule_tabby",
               "top_ragdoll", "peek_orange2"],
         kw=["kucing", "betah", "suka", "tidur", "panjat", "main", "turun", "lepak", "seronok"]),
    dict(id=4, name="DETAIL", headline=["KUKUH", "GILA!"], color="white",
         pool=["ladder_steps", "pompom_paw", "sisal_post", "perch_soft", "edge_round", "base_wide",
               "sisal_macro", "cushion_plush"],
         kw=[k for f in FEATURES for k in f["kw"]] + ["kukuh", "kuat", "sturdy"]),
    dict(id=5, name="CTA", headline=["RM77.60 JE!"], color="yellow",
         headline2=["BERBALOI!"], color2="white",
         pool=["cta_hero", "cta_window"], end_shot="cta_end",
         kw=["rm", "ringgit", "77", "tujuh", "harga", "tekan", "beg", "beli", "stok",
             "sekarang", "je", "murah", "berbaloi", "habis", "link", "bakul", "keranjang"]),
]

CTA = dict(
    selfie_center=(757, 790), selfie_radius=290,   # in senyum.jpg
    circle_xy=(250, 905), circle_d=350,           # on screen
    price_text="RM77.60", price_kicker="HARGA",
    price_xy=(712, 905),
    price_kw=["rm", "ringgit", "77", "77.60", "rm77", "rm77.60", "tujuh", "harga"],
    arrow_kw=["tekan", "beg", "bakul", "keranjang", "beli", "klik", "link", "order",
              "checkout", "basket", "cart", "troli"],
    arrow_label="TEKAN BEG KUNING",
    berbaloi_kw=["berbaloi", "worth", "murah", "jimat"],
)

WHISPER_PROMPT = ("Alvique cat tree kayu solid, tiang sisal, kusyen boleh basuh, "
                  "tapak lebar, kucing, sofa, RM77.60, beg kuning.")
