#!/usr/bin/env python3
"""
Test script to verify .env file loading and HUGGINGFACE_API_TOKEN availability
"""
import os
from dotenv import load_dotenv

print("🔧 Testing Environment Variable Loading")
print("=" * 50)

# Test 1: Load .env explicitly
print("1. Loading .env file explicitly...")
load_dotenv()

# Test 2: Check if HUGGINGFACE_API_TOKEN is available via os.getenv
hf_token_os = os.getenv("HUGGINGFACE_API_TOKEN")
print(f"   HUGGINGFACE_API_TOKEN via os.getenv(): {'✅ Found' if hf_token_os else '❌ Not found'}")
if hf_token_os:
    print(f"   Token starts with: {hf_token_os[:10]}...")

# Test 3: Check settings import
print("\n2. Testing settings import...")
try:
    from app.core.config import settings
    print(f"   Settings import: ✅ Success")
    print(f"   HUGGINGFACE_API_TOKEN via settings: {'✅ Found' if settings.HUGGINGFACE_API_TOKEN else '❌ Not found'}")
    if settings.HUGGINGFACE_API_TOKEN:
        print(f"   Token starts with: {settings.HUGGINGFACE_API_TOKEN[:10]}...")
except Exception as e:
    print(f"   Settings import: ❌ Failed - {e}")

# Test 4: Check .env file exists
env_file_path = ".env"
if os.path.exists(env_file_path):
    print(f"\n3. .env file: ✅ Exists at {os.path.abspath(env_file_path)}")
    with open(env_file_path, 'r') as f:
        content = f.read()
        if 'HUGGINGFACE_API_TOKEN=' in content:
            print("   HUGGINGFACE_API_TOKEN line: ✅ Found in .env file")
        else:
            print("   HUGGINGFACE_API_TOKEN line: ❌ Not found in .env file")
else:
    print(f"\n3. .env file: ❌ Not found at {os.path.abspath(env_file_path)}")

print("\n🎯 Diagnosis:")
if hf_token_os and hasattr(settings, 'HUGGINGFACE_API_TOKEN') and settings.HUGGINGFACE_API_TOKEN:
    print("   Everything looks good! HUGGINGFACE_API_TOKEN should work in the API.")
else:
    print("   There's an issue with environment variable loading.")