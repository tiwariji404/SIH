import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.core import security

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    user = db.query(User).filter(User.username == "admin").first()
    if not user:
        hashed_password = security.get_password_hash("admin123")
        admin_user = User(
            username="admin",
            hashed_password=hashed_password,
            role=UserRole.ADMIN
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print("Default admin created successfully.")
    else:
        print("Admin user already exists.")
        
    db.close()

if __name__ == "__main__":
    init_db()
