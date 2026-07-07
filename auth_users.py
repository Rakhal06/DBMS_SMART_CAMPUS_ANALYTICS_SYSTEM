# ================================================================
#  auth_users.py  —  SmartCampus Authorized Users
#  Place this file in: C:\Users\rakha\OneDrive\Desktop\DBMS\
#
#  To add a new user: copy any block below and change the values
#  Share the username + password with that person privately
# ================================================================

# Password is stored as plain text here for simplicity
# In production you would hash these — fine for college project

AUTHORIZED_USERS = {

    # ── Admin Users ──────────────────────────────────────────
    "rakhal": {
        "password":   "rakhal@admin123",
        "role":       "admin",
        "full_name":  "Rakhal",
        "can_insert": True,
        "can_view":   True,
    },

    # ── Friend 1 ─────────────────────────────────────────────
    "admin1": {
        "password":   "admin1@smart456",
        "role":       "admin",
        "full_name":  "vineel",
        "can_insert": True,
        "can_view":   True,
    },

    # ── Friend 2 ─────────────────────────────────────────────
    "rishikesh": {
        "password":   "admin2@smart789",
        "role":       "viewer",
        "full_name":  "Rishikesh",
        "can_insert": False,
        "can_view":   True,
    },

  
    # ── Add more friends below this line ─────────────────────
    # "newuser": {
    #     "password":   "newuser@pass000",
    #     "role":       "admin",
    #     "full_name":  "New User Name",
    #     "can_insert": True,
    #     "can_view":   True,
    # },
}

# Secret key used to sign tokens — change this to anything random
SECRET_KEY = "smartcampus_iiit_dharwad_da264_secret_2025"
ALGORITHM  = "HS256"
# Token expires after this many minutes
TOKEN_EXPIRE_MINUTES = 480   # 8 hours