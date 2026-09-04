# MindSpace V1 — Release Baseline Reference

## 1. Purpose

This document establishes the official historical baseline reference for **MindSpace V1**. It records the exact state of the repository that was analyzed and documented across M0 issues #1, #2, #3, and #4, serving as the immutable reference point for the MindSpace V2 migration.

---

## 2. Baseline Specification

| Metric | Value |
| :--- | :--- |
| **Repository** | `https://github.com/rodrigolinhas/mindspace` |
| **Branch** | `main` |
| **Baseline Commit SHA** | `23ce400f45971e48de30f30996914da24e2005b8` |
| **Short SHA** | `23ce400` |
| **Commit Date** | `2026-07-23 12:03:15 +0100` |
| **Commit Author** | Rodrigo Linhas |
| **Commit Subject** | `Update README.md` |
| **Tree State at Inspection**| Clean (`nothing to commit, working tree clean`) |
| **Package Version** | `3.141592653589793` (`package.json`) |
| **Active Milestone** | `M0 — Preserve V1 Baseline` |

---

## 3. Version History & Tag Audit

### 3.1 Historical Git Commits
The repository history preceding this baseline consists of:
```text
23ce400f45971e48de30f30996914da24e2005b8 2026-07-23 12:03:15 +0100 Update README.md
9cb26ebe02f1ee1bb037ac76e9080c5e949dd016 2026-07-23 12:02:12 +0100 imported
7a784fb493f97026a897f4e66368ec6fbce071a9 2025-11-02 16:08:21 +0000 Update README.md
98b3c1de7181ebd72e81c177b76273896ef4d65b 2025-11-02 16:05:36 +0000 update README.md
c234876820dc9d01594e334615169bbc40c7e384 2025-11-02 16:05:05 +0000 Initial commit
```

### 3.2 Existing Tags & Releases
- Local Git Tags: **None** (`git tag -l` returned 0 entries).
- Remote GitHub Tags: **None** (`/repos/rodrigolinhas/mindspace/tags` returned `[]`).
- GitHub Releases: **None** (`/repos/rodrigolinhas/mindspace/releases` returned `[]`).

---

## 4. Recommended Baseline Tag & Release Identifier

Because no historical tags or releases exist in the repository, and the package version `"version": "3.141592653589793"` is a symbolic constant (Pi) rather than a Semantic Version, an official versioning convention should be established for future reference.

### RECOMMENDED FOLLOW-UP: Tag `v1.0.0`
- **Recommended Tag Name**: `v1.0.0`
  - *SemVer Note*: Under Semantic Versioning (SemVer 2.0.0 §9), hyphenated suffixes such as `-baseline` denote a pre-release (e.g. `1.0.0-baseline` has lower precedence than `1.0.0`). Because V1 represents the completed, deployed initial version of the system, a standard release tag `v1.0.0` (with release title/description indicating it preserves the initial V1 baseline) avoids misleading pre-release semantics.
- **Target Commit**: `23ce400f45971e48de30f30996914da24e2005b8`
- **Release Title**: `MindSpace V1 Baseline (Express + React + SQLite)`
- **Release Notes Summary**:
  > Snapshot of the initial full-stack implementation of MindSpace prior to the V2 migration. Features an Express.js backend, React 19 frontend, SQLite database, and vanilla CSS glassmorphic UI. Preserved under Milestone M0.

### Mutation Policy Adherence
Per M0 operational discipline:
- **No tags or releases have been created on the remote or local repository** as part of this documentation work.
- Tagging and GitHub release publication remain a **RECOMMENDED FOLLOW-UP** pending explicit user authorization.

---

## 5. Historical Integrity Confirmation

- **No Git history rewriting**: No rebasing, resetting, or history tampering was performed.
- **No commit squashing**: The commit graph remains intact.
- **No deletion of V1 assets**: All V1 client, server, and shared source files remain preserved.
