#!/usr/bin/env python3
"""
Security fix verification test
Tests that hardcoded tokens have been removed and environment variables work correctly
"""

import os
import subprocess
from dotenv import load_dotenv

def check_for_hardcoded_tokens():
    """Check if any hardcoded tokens remain in Python files"""
    print("🔍 Checking for hardcoded tokens...")
    
    # Search for potential hardcoded tokens
    result = subprocess.run([
        'git', 'grep', '-n', '-E', 'hf_[A-Za-z0-9_]{20,}', '--', '*.py'
    ], capture_output=True, text=True, cwd='..')
    
    if result.returncode == 0 and result.stdout.strip():
        print("❌ SECURITY ISSUE: Hardcoded tokens found:")
        print(result.stdout)
        return False
    else:
        print("✅ No hardcoded tokens found in Python files")
        return True

def check_env_variables():
    """Check if environment variables are properly configured"""
    print("\n🔧 Checking environment variable configuration...")
    
    # Load environment variables
    load_dotenv()
    
    # Check if the new environment variable is available
    token = os.getenv('HUGGINGFACE_API_TOKEN')
    if token:
        print(f"✅ HUGGINGFACE_API_TOKEN found: {token[:10]}...")
        return True
    else:
        print("❌ HUGGINGFACE_API_TOKEN not found in environment")
        return False

def check_gitignore():
    """Check if .env files are properly ignored"""
    print("\n📁 Checking .gitignore configuration...")
    
    try:
        with open('../.gitignore', 'r') as f:
            content = f.read()
            
        if '.env' in content:
            print("✅ .env files are properly ignored in .gitignore")
            return True
        else:
            print("❌ .env files not found in .gitignore")
            return False
    except FileNotFoundError:
        print("❌ .gitignore file not found")
        return False

def check_env_example():
    """Check if .env.example exists"""
    print("\n📄 Checking .env.example file...")
    
    if os.path.exists('.env.example'):
        with open('.env.example', 'r') as f:
            content = f.read()
            if 'HUGGINGFACE_API_TOKEN' in content:
                print("✅ .env.example file exists with HUGGINGFACE_API_TOKEN")
                return True
            else:
                print("❌ .env.example exists but missing HUGGINGFACE_API_TOKEN")
                return False
    else:
        print("❌ .env.example file not found")
        return False

def test_api_functionality():
    """Test that the API can still work with environment variables"""
    print("\n🧪 Testing API functionality...")
    
    try:
        # Import and test the settings
        import sys
        sys.path.append('../app')
        from app.core.config import settings
        
        if hasattr(settings, 'HUGGINGFACE_API_TOKEN') and settings.HUGGINGFACE_API_TOKEN:
            print("✅ Settings properly configured with HUGGINGFACE_API_TOKEN")
            return True
        else:
            print("❌ Settings not properly configured")
            return False
    except Exception as e:
        print(f"❌ Error testing settings: {e}")
        return False

def main():
    print("🔒 SECURITY FIX VERIFICATION")
    print("=" * 50)
    
    checks = [
        ("Hardcoded Token Check", check_for_hardcoded_tokens),
        ("Environment Variables", check_env_variables),
        ("GitIgnore Configuration", check_gitignore),
        ("Env Example File", check_env_example),
        ("API Functionality", test_api_functionality)
    ]
    
    passed = 0
    total = len(checks)
    
    for name, check_func in checks:
        try:
            if check_func():
                passed += 1
        except Exception as e:
            print(f"❌ {name}: Error - {e}")
    
    print(f"\n🎯 RESULTS: {passed}/{total} checks passed")
    
    if passed == total:
        print("🎉 All security fixes verified successfully!")
        print("\n✅ Your code is now safe to push to git!")
    else:
        print("⚠️  Some issues remain. Please review the failed checks above.")
    
    return passed == total

if __name__ == "__main__":
    main()