#!/usr/bin/env python3
"""
Final security scan - checks for any secrets that might be detected by git scanners
"""

import os
import re
import glob

def scan_for_secrets(directory="."):
    """Scan all trackable files for potential secrets"""
    print("🔍 Scanning for potential secrets...")
    
    # Patterns that might be detected as secrets
    patterns = [
        r'hf_[A-Za-z0-9_]{20,}',  # Hugging Face tokens
        r'sk-[A-Za-z0-9]{20,}',   # OpenAI API keys
        r'ghp_[A-Za-z0-9]{36}',   # GitHub tokens
        r'AIza[0-9A-Za-z\\-_]{35}',  # Google API keys
    ]
    
    # Files to check (excluding .env and other ignored files)
    file_patterns = [
        "**/*.py",
        "**/*.md", 
        "**/*.txt",
        "**/*.json",
        "**/*.js",
        "**/*.jsx",
        "**/*.ts",
        "**/*.tsx",
        "**/*.yml",
        "**/*.yaml"
    ]
    
    issues_found = False
    
    for file_pattern in file_patterns:
        for filepath in glob.glob(file_pattern, recursive=True):
            # Skip .env files and other common excludes
            if any(skip in filepath for skip in ['.env', 'node_modules', '__pycache__', '.git']):
                continue
                
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                for line_num, line in enumerate(content.split('\n'), 1):
                    for pattern in patterns:
                        matches = re.findall(pattern, line)
                        if matches:
                            print(f"❌ POTENTIAL SECRET in {filepath}:{line_num}")
                            print(f"   Pattern: {pattern}")
                            print(f"   Line: {line.strip()}")
                            issues_found = True
                            
            except Exception as e:
                # Skip files that can't be read as text
                continue
    
    if not issues_found:
        print("✅ No potential secrets found in trackable files")
        
    return not issues_found

def check_gitignore_coverage():
    """Check if sensitive files are properly ignored"""
    print("\n📁 Checking .gitignore coverage...")
    
    if not os.path.exists('.gitignore'):
        print("❌ No .gitignore file found")
        return False
        
    with open('.gitignore', 'r') as f:
        gitignore_content = f.read()
    
    required_patterns = ['.env', '*.env', 'node_modules', '__pycache__']
    missing = []
    
    for pattern in required_patterns:
        if pattern not in gitignore_content:
            missing.append(pattern)
    
    if missing:
        print(f"❌ Missing .gitignore patterns: {missing}")
        return False
    else:
        print("✅ All important patterns are in .gitignore")
        return True

def main():
    print("🔒 FINAL SECURITY SCAN")
    print("=" * 50)
    
    # Change to project root
    os.chdir('..')
    
    checks = [
        ("Secret Pattern Scan", scan_for_secrets),
        ("GitIgnore Coverage", check_gitignore_coverage),
    ]
    
    all_passed = True
    
    for name, check_func in checks:
        try:
            if not check_func():
                all_passed = False
        except Exception as e:
            print(f"❌ {name}: Error - {e}")
            all_passed = False
    
    print(f"\n🎯 FINAL RESULT:")
    
    if all_passed:
        print("🎉 ALL CLEAR! Your code is safe to push to git!")
        print("\n✅ No secrets detected in trackable files")
        print("✅ Sensitive files are properly ignored") 
        print("✅ Ready for git commit and push")
    else:
        print("⚠️  ISSUES DETECTED - Review and fix before pushing")
    
    return all_passed

if __name__ == "__main__":
    main()