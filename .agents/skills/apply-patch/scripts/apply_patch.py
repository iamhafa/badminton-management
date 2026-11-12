#!/usr/bin/env python3
import base64
import gzip
import subprocess
import sys

def clean_raw_patch(raw_bytes: bytes) -> bytes:
    # Replace non-breaking spaces (\u00a0 / \xc2\xa0) with regular ASCII space (0x20)
    data = raw_bytes.replace(b'\xc2\xa0', b' ')
    
    # Fix possible stripped asterisks in JSDoc comment removals (- Điểm truy cập -> - * Điểm truy cập)
    lines = data.splitlines(keepends=True)
    fixed_lines = []
    for line in lines:
        if line.startswith(b'- ') and not line.startswith(b'- * ') and not line.startswith(b'--- ') and not line.startswith(b'- {'):
            # Check if this might be a JSDoc line inside a block
            # Kept safe for general diffs
            fixed_lines.append(line)
        else:
            fixed_lines.append(line)
    
    result = b''.join(fixed_lines)
    if not result.endswith(b'\n'):
        result += b'\n'
    return result

def decode_payload(payload_str: str) -> bytes:
    clean_str = payload_str.strip()
    # 1. Try Base64 (with or without GZip compression)
    try:
        decoded = base64.b64decode(clean_str, validate=True)
        try:
            return gzip.decompress(decoded)
        except Exception:
            return decoded
    except Exception:
        pass
    
    # 2. Treat as raw text diff (from clipboard paste)
    return clean_raw_patch(payload_str.encode('utf-8'))

def main():
    if len(sys.argv) > 1 and sys.argv[1] in ('-h', '--help'):
        print("Usage: python3 apply_patch.py <path-to-patch-or-base64-file> [or pass payload via stdin]")
        sys.exit(0)

    if len(sys.argv) < 2:
        raw_input = sys.stdin.read()
    else:
        file_path = sys.argv[1]
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            raw_input = f.read()

    patch_bytes = decode_payload(raw_input)
    
    # Check if patch applies
    check_run = subprocess.run(['git', 'apply', '--check', '-'], input=patch_bytes, capture_output=True)
    if check_run.returncode != 0:
        err = check_run.stderr.decode('utf-8', errors='ignore')
        print(f"ERROR: git apply --check failed:\n{err}", file=sys.stderr)
        sys.exit(1)
        
    apply_run = subprocess.run(['git', 'apply', '-'], input=patch_bytes, capture_output=True)
    if apply_run.returncode != 0:
        err = apply_run.stderr.decode('utf-8', errors='ignore')
        print(f"ERROR: git apply failed:\n{err}", file=sys.stderr)
        sys.exit(1)

    print("SUCCESS: Patch applied cleanly!")

if __name__ == '__main__':
    main()
