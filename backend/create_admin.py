import bcrypt
from database import SessionLocal
from models import Admin, Base
from database import engine

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Check if admin exists
existing = db.query(Admin).filter(Admin.username == "admin").first()
if existing:
    print("Admin already exists!")
else:
    # Create admin with username: admin, password: admin123
    password_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    admin = Admin(
        username="admin",
        email="admin@truthhire.com",
        password_hash=password_hash
    )
    
    db.add(admin)
    db.commit()
    print("✅ Admin created successfully!")
    print("Username: admin")
    print("Password: admin123")

db.close()
