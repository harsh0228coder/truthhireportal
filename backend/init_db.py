# backend/init_db.py
from database import engine
from models import Base
# Make sure to import all models so they are registered with Base
import models 

print("⏳ Creating database tables...")
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully.")
except Exception as e:
    print(f"❌ Error creating tables: {e}")