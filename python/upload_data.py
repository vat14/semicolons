import pandas as pd
from pymongo import MongoClient
import json

MONGO_URI = "mongodb+srv://admin:semicolons1234@semicolons-cluster.fu1smnv.mongodb.net/?appName=semicolons-cluster"

def upload_new_dataset():
    print("Loading NEW Kaggle dataset...")
    try:
        # Update this filename to whatever you saved the new CSV as
        df = pd.read_csv(os.path.join(os.path.dirname(__file__), "inventory_control_tower_master.csv"))
        
        # Take a random sample for speed during the hackathon
        df = df.sample(n=5000, random_state=42)
        
        client = MongoClient(MONGO_URI)
        db = client["inventory_optimization"]
        collection = db["supply_chain_data"]
        
        # This deletes the old logistics dataset so it doesn't mess up your new metrics!
        collection.delete_many({})
        print("Cleared out the old dataset...")
        
        records = json.loads(df.T.to_json()).values()
        collection.insert_many(records)
        
        print("✅ SUCCESS! Your new high-dimensional dataset is live in MongoDB!")
        
    except FileNotFoundError:
        print("❌ ERROR: Could not find the CSV file. Check the exact filename!")

if __name__ == "__main__":
    upload_new_dataset()