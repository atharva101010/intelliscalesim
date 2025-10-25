from database import engine, Base
from models.load_test import LoadTest

# Create the table
print("Creating load_tests table...")
Base.metadata.create_all(bind=engine)
print("✅ load_tests table created successfully!")
