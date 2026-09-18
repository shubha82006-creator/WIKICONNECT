import kagglehub

# Download the complete dataset
path = kagglehub.dataset_download(
    "wikimedia-foundation/wikipedia-structured-contents"
)

print("Dataset downloaded successfully!")
print("Location:")
print(path)