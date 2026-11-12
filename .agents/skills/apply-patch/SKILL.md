---
name: apply-patch
description: Use when syncing uncommitted code changes across devices (e.g. from a company Windows PC to home macOS) via base64 or clipboard patch text, applying unified diffs safely without formatting corruption, and validating project health.
---

# Cross-Device Patch & Code Sync (`apply-patch`)

Use this skill when moving code changes between environments where direct `git push` is blocked by company security/DLP policies. It allows exporting uncommitted code on a work PC (Windows) into a clean, safe string and applying it seamlessly on home machine (macOS).

---

## 1. At Work PC (Windows) — Exporting Code

Before leaving work, open your project terminal (preferably **Git Bash**) and run:

### Recommended: Git Bash (One-liner)

```bash
git add -N . && git diff HEAD | gzip -c | base64 | clip
```

- `git add -N .`: Tracks newly created files so they are included in the diff.
- `gzip -c`: Compresses the diff (reducing 2,000+ lines of code into a compact ~10KB string).
- `base64`: Converts binary into pure alphanumeric characters (`A-Z, a-z, 0-9, +, /, =`), immune to browser formatting glitches.
- `clip`: Automatically copies the output directly into your Windows clipboard.

> Now simply open the browser chat and press **Ctrl + V** to paste the string.

### Alternative: PowerShell (If Git Bash is not available)

```powershell
git add -N .
$diff = [System.Text.Encoding]::UTF8.GetBytes((git diff HEAD))
$ms = [System.IO.MemoryStream]::new()
$gz = [System.IO.Compression.GZipStream]::new($ms, [System.IO.Compression.CompressionMode]::Compress)
$gz.Write($diff, 0, $diff.Length); $gz.Close()
[System.Convert]::ToBase64String($ms.ToArray()) | Set-Clipboard
```

---

## 2. At Home PC (macOS) — Applying Code

When you arrive home, simply paste the base64 string or the patch file to Antigravity and prompt:

> _"Apply this patch to the project"_ or use `/apply-patch`

### The Agent's Execution Steps:

1. **Decode & Clean Patch**:
   Run the bundled Python helper:

   ```bash
   python3 .agents/skills/apply-patch/scripts/apply_patch.py <path-to-saved-patch-or-base64>
   ```

   Or pipe payload directly:

   ```bash
   echo "<base64_string>" | python3 .agents/skills/apply-patch/scripts/apply_patch.py
   ```

   _(The script automatically handles Base64 decoding, GZip decompression, and sanitizes Non-Breaking Spaces `\u00a0` if raw diff text was pasted)._

2. **Install Dependencies (if package.json was touched)**:

   ```bash
   pnpm install
   ```

3. **Verify Standards (AGENTS.md checklist)**:
   ```bash
   npx tsc --noEmit -p .
   npx oxlint src
   npx oxfmt "src/**/*.{ts,tsx,json}" "*.json" ".*.json"
   pnpm build
   ```
