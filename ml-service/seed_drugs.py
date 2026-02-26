from pymongo import MongoClient
import random
import string
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)

db = client["healthcareDB"]   # IMPORTANT: match URI DB name
collection = db["drugs"]

collection.delete_many({})

base_brands = [
    "Bicogut", "Nexoder", "Sithrin", "Zithrin", "Progut",
    "Cetoral", "Diflu", "Backtone", "Disopan", "Odazin",
    "Nexum", "Opton", "Exium", "Valparin", "Levera",
    "Azimax", "Montair", "Levocet", "Azee", "Augmentin"
]

salts = [
    "Azithromycin 500mg",
    "Levocetirizine 5mg",
    "Pantoprazole 40mg",
    "Sodium Valproate 200mg",
    "Levetiracetam 250mg",
    "Paracetamol 500mg",
    "Ibuprofen 400mg",
    "Amoxicillin 500mg",
    "Montelukast 10mg",
    "Ondansetron 4mg"
]

data = []

TOTAL_RECORDS = 1000

for i in range(TOTAL_RECORDS):
    base = random.choice(base_brands)
    suffix = ''.join(random.choices(string.ascii_uppercase, k=2))
    number = random.randint(10, 99)

    brand_name = f"{base}{suffix}{number}"

    data.append({
        "brand": brand_name,
        "salt": random.choice(salts),
        "price": random.randint(20, 1500),
        "stock": random.randint(0, 500)
    })

collection.insert_many(data)

print(f"Inserted {TOTAL_RECORDS} drugs successfully.")