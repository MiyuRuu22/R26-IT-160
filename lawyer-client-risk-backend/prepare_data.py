from app.services.dataset_loader import load_all_datasets

if __name__ == "__main__":
    df = load_all_datasets()
    print("Datasets prepared successfully.")
    print(f"Total rows: {len(df)}")
    print(df.head())