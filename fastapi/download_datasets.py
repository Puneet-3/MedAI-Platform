import urllib.request
import os
import pandas as pd

# Define URLs
TRAINING_URL = "https://raw.githubusercontent.com/parthsompura/Disease-prediction-using-Machine-Learning/master/Training.csv"
TESTING_URL = "https://raw.githubusercontent.com/parthsompura/Disease-prediction-using-Machine-Learning/master/Testing.csv"

# Target directory
target_dir = os.path.join(os.path.dirname(__file__), "dataset")
os.makedirs(target_dir, exist_ok=True)

training_path = os.path.join(target_dir, "Training.csv")
testing_path = os.path.join(target_dir, "Testing.csv")

def download_file(url, path):
    print(f"Downloading {url} to {path}...")
    urllib.request.urlretrieve(url, path)
    print("Download completed.")

if __name__ == "__main__":
    # Download files
    download_file(TRAINING_URL, training_path)
    download_file(TESTING_URL, testing_path)
    
    # Load and run quick check (shape, nulls)
    df_train = pd.read_csv(training_path)
    df_test = pd.read_csv(testing_path)
    
    print("\n--- Quick Dataset Validation ---")
    print(f"Training set shape: {df_train.shape}")
    print(f"Testing set shape: {df_test.shape}")
    print(f"Training null values: {df_train.isnull().sum().sum()}")
    print(f"Testing null values: {df_test.isnull().sum().sum()}")
    
    # Check if 'Unnamed: 133' column exists (sometimes present in this dataset)
    unnamed_cols = [col for col in df_train.columns if 'Unnamed' in col]
    if unnamed_cols:
        print(f"Found extraneous columns in Training: {unnamed_cols}")
        df_train = df_train.drop(columns=unnamed_cols)
        df_train.to_csv(training_path, index=False)
        print("Removed extraneous columns and resaved Training.csv.")
        print(f"New Training set shape: {df_train.shape}")
