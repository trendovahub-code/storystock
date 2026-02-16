---
name: cleanup
description: Identify and remove unused or obsolete files from the project. Use this when cleaning up, decluttering, or moving unused files. CRITICAL - verifies all dependencies before moving ANY file.
argument-hint: "[area-or-folder]"
disable-model-invocation: true
---

# Cleanup Skill

Identify and safely remove unused files from: `$ARGUMENTS`

## CRITICAL RULE: NEVER MOVE A FILE WITHOUT FULL DEPENDENCY VERIFICATION

Before moving or deleting ANY file, you MUST verify it has ZERO dependencies. A previous cleanup incorrectly moved `arch_changes/screener_company_symbols.csv` which broke the stock search feature because `backend/services/company_registry.py` loaded the CSV from that path at runtime.

**Lesson learned**: Dependencies are NOT limited to Python/TypeScript imports. They include:
- **File path references** (`os.path.join`, `open()`, `csv.DictReader`, etc.)
- **Config file references** (paths in `.env`, JSON configs, YAML configs)
- **Dynamic imports** (`importlib`, `__import__`)
- **Shell script references** (`start_all.sh`, other `.sh` files)
- **Data files** loaded at runtime (CSV, JSON, SQLite, etc.)
- **Static assets** referenced by URL or path

## Mandatory Pre-Move Checklist (for EACH file)

For every single file you intend to move, run ALL of these checks:

### 1. Import/Require Check
```
Grep for the module name across the entire codebase
```

### 2. File Path Reference Check (MOST COMMONLY MISSED)
```
Grep for the filename (without extension) across the entire codebase
Grep for the parent directory name across the entire codebase
```

### 3. String Reference Check
```
Grep for the filename as a string literal in all .py, .ts, .tsx, .js, .sh, .env files
```

### 4. Dynamic Load Check
```
Grep for os.path.join, open(), csv.DictReader, json.load, sqlite3.connect
and verify none reference the file's directory or filename
```

### 5. Config Reference Check
```
Check .env, package.json, requirements.txt, tsconfig.json, next.config.ts
for any reference to the file or its parent directory
```

## Process

1. **List candidate files** - identify files that appear unused
2. **For EACH candidate, run ALL 5 checks above** - no exceptions
3. **Present findings to the user** - show the check results per file
4. **Wait for user approval** before moving anything
5. **Move files** only after explicit user confirmation
6. **Verify the app still works** after moving

## What Counts as "Unused"

A file is truly unused ONLY if ALL of these are true:
- Not imported in any Python/TypeScript file
- Not referenced by file path in any code (os.path, open, require, import)
- Not referenced in any config file
- Not referenced in any shell script
- Not loaded as data at runtime (CSV, JSON, SQLite, etc.)
- Not referenced as a static asset or URL

## What to NEVER Move Without Asking

- Any data file (CSV, JSON, SQLite, RDB) - these may be runtime dependencies
- Any config file (.env, .yml, .json) - these may be loaded dynamically
- Any file in a directory that is referenced by path in code
- Shell scripts - they may be used for deployment/startup

## Output Format

Present a table for user review BEFORE moving anything:

| File | Import Check | Path Check | String Check | Dynamic Load | Config Check | Safe? |
|------|-------------|------------|--------------|-------------|-------------|-------|
| file.py | No refs | No refs | No refs | No refs | No refs | YES |
| data.csv | No imports | **FOUND in service.py** | No refs | **FOUND** | No refs | **NO** |

Only proceed after user confirms the list.
