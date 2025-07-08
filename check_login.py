# Import the necessary libraries
import os
from dotenv import load_dotenv
from huggingface_hub import whoami

# Load the environment variables from the .env file
load_dotenv()

print("Attempting to log in programmatically...")

try:
    # The whoami() function will automatically use the HUGGING_FACE_HUB_TOKEN
    # from your .env file to authenticate.
    user_info = whoami()
    print("\n✅ Login Successful!")
    print(f"Logged in as: {user_info['name']}")

    # This also confirms your token is stored correctly for later use.
    # We no longer need the 'huggingface-cli login' command.

except Exception as e:
    print("\n❌ Login Failed.")
    print("Error:", e)
    print("\nPlease double-check that the HUGGING_FACE_HUB_TOKEN in your .env file is correct and has 'write' permissions.")