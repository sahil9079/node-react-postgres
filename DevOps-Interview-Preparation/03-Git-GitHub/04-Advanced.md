# Git & GitHub - Level 3: Advanced

## 1. Git Internals: Blobs, Trees, Commits, and Tags
Inside `.git/objects/`, Git stores cryptographic SHA-1/SHA-256 hashed objects:
1. **Blob:** Stores pure file content data (no filename or permissions).
2. **Tree:** Represents a directory; maps filenames and permissions to Blob/Tree hashes.
3. **Commit:** Contains a pointer to the root Tree object, author/committer metadata, timestamp, and pointer to parent commit hash.
4. **Annotated Tag:** A permanent pointer to a specific commit object with release notes and GPG signatures.

```bash
# Inspecting Git Objects Internally
git cat-file -t <HASH>    # View object type (blob, tree, commit)
git cat-file -p <HASH>    # Print content of git object
```
