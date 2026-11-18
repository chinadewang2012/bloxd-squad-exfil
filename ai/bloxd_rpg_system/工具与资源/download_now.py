import urllib.request
import ssl
import os

ssl._create_default_https_context = ssl._create_unverified_context

save_dir = "..\\bloxd代码\\API文档"
os.makedirs(save_dir, exist_ok=True)

files = {
    "BLOCK_NAMES.txt": "https://raw.githubusercontent.com/Bloxdy/code-api/main/BLOCK_NAMES.txt",
    "ITEM_NAMES.txt": "https://raw.githubusercontent.com/Bloxdy/code-api/main/ITEM_NAMES.txt",
    "SOUNDS_AND_MUSIC.md": "https://raw.githubusercontent.com/Bloxdy/code-api/main/SOUNDS_AND_MUSIC.md",
}

print("=" * 50)
print("Downloading missing files...")
print("=" * 50)

for filename, url in files.items():
    print(f"\n{filename}...", end=" ")
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        request = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(request, timeout=30) as response:
            content = response.read()
        
        filepath = os.path.join(save_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(content)
        
        print(f"OK ({len(content):,} bytes)")
    except Exception as e:
        print(f"FAIL: {e}")

print("\n" + "=" * 50)
print("Done!")
input("\nPress Enter to exit...")
