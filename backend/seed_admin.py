"""
Jalankan sekali untuk membuat akun admin pertama:
    python seed_admin.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app import models
from app.utils.auth import hash_password

def seed():
    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == "admin@webgis.id").first()
        if existing:
            print("Admin sudah ada. Skip.")
            return

        admin = models.User(
            nama     = "Super Admin",
            email    = "admin@webgis.id",
            password = hash_password("admin123"),
            role     = "admin",
        )
        db.add(admin)
        db.commit()
        print("✅ Admin berhasil dibuat!")
        print("   Email    : admin@webgis.id")
        print("   Password : admin123")
        print("   ⚠️  Segera ganti password setelah login pertama!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
