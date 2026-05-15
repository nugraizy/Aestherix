# Git Commit Rules for Agent

## Commit Standard

- Always use Conventional Commits format.
- Format:

\<type>(\<scope>): \<short summary>

Examples:

feat(auth): add OAuth session refresh handling
fix(api): prevent duplicate webhook processing
chore(release): bump version to v1.4.2

---

## Commit Priority Order

Commits must be categorized from most important to least important.

Priority order:

1. feat
2. fix
3. perf
4. refactor
5. style
6. test
7. docs
8. build
9. ci
10. chore

---

## File Grouping Rules

### Group Related Important Changes

- If multiple files belong to the same feature, fix, or refactor:
  - group them into a single commit.
- Related means:
  - same functionality
  - same module
  - same feature
  - same bug
  - same flow

Example:

feat(payment): add Stripe subscription retry flow

May include:
- payment.service.ts
- subscription.ts
- retry-worker.ts
- payment-ui.tsx

---

### Separate Unrelated Changes

If files are unrelated:
- create separate commits
- or categorize them as lower-priority commits such as:
  - chore
  - style
  - docs

Do not mix unrelated changes into important commits.

---

## Commit Description Rules

### Important Commits

For important commits (feat, fix, perf, refactor):

- describe only the main purpose of the change.
- do not mention:
  - formatting
  - cleanup
  - unrelated edits
  - version updates
  - hash updates

Good:

fix(auth): prevent token refresh race condition

Bad:

fix(auth): prevent token refresh race condition and update version and fix lint

---

## Versioning Rules

### Always End With Release Chore Commit

The final commit must always be:

chore(release): bump version to vX.Y.Z

This commit must include:
- version bump
- changelog update
- frontend commit hash update

---

## Frontend Hash Rules

When updating frontend hash:
- always use the latest important commit hash
- never use:
  - the version bump commit hash
  - the release commit hash

Correct flow:

feat -> fix -> refactor -> hash update -> release chore

Incorrect flow:

feat -> release chore -> use release hash

---

## Changelog Rules

### Changelog Update Requirements

The release chore commit must:
- update changelog
- include commit hash beside each change entry

Example:

## v1.4.2

- add Stripe retry flow (a1b2c3d)
- fix OAuth refresh race condition (d4e5f6g)

---

## Release Commit Responsibilities

The release chore commit should contain only:
- version bump
- changelog update
- frontend hash update

Example:

chore(release): bump version to v1.4.2

---

## Additional Rules

### Avoid Noise

Do not create commits for:
- tiny formatting changes
- unrelated whitespace
- auto-generated changes unless required
- temporary debug edits

Unless they are isolated and necessary as:

style: format codebase

or

chore: regenerate types

---

## Example Commit Sequence

feat(auth): add OAuth device login flow

fix(api): prevent duplicate webhook retries

refactor(core): simplify event dispatcher logic

chore(release): bump version to v2.3.0

The final release commit must include:
- updated version
- updated changelog
- updated frontend latest hash
