# #️⃣ **1. Durability With WAL (Write-Ahead Logging)**

## ✔ What happens when a transaction commits?

When a transaction commits:

* The **WAL (Write-Ahead Log) must be flushed to disk**.
* Dirty **data pages do NOT need to be flushed** to disk at commit time.
* WAL contains enough information to **replay (REDO)** the changes after a crash.

### 🔑 Key guarantee:

> **Commit success == WAL flushed to persistent storage**

Even if the actual data pages remain only in memory at commit time, durability is ensured because WAL can recreate the committed changes after crash.

---

# #️⃣ **2. Difference Between Data Page Flush & WAL Flush**

| Item                    | Data Pages                                | WAL (Write-Ahead Log)                   |
| ----------------------- | ----------------------------------------- | --------------------------------------- |
| What it stores          | Actual table/index data                   | Redo/undo instructions for every change |
| When updated            | Immediately in memory when modifying data | On every change; flushed at commit      |
| Must flush at commit?   | ❌ No                                    | ✔ Yes                                   |
| Writes                  | Random I/O                                | Sequential I/O                          |
| Used for crash recovery | Not reliable (may be stale)               | Source of truth (redo/undo)             |
| Flushed by              | Checkpoints                               | Commit or WAL writer                    |

### 🌟 Summary

* **WAL = durability mechanism**
* **Data pages = performance optimization (lazy writing)**

---

# #️⃣ **3. Full Workflow Scenarios**

Below are various workflows showing how data flows in commit, rollback, and crash cases.

---

## ⭐ **Scenario 1 — Normal COMMIT Workflow**

### Sequence:

1. SQL modifies data
   → Data page loaded into buffer pool
   → Modifications applied **in memory** (dirty pages)
2. WAL records created for the change.
3. WAL record placed in WAL buffer (still memory).
4. On `COMMIT`:
   → Commit record is added to WAL buffer
   → WAL buffer is **flushed to disk** (fsync)
5. Data pages are **NOT flushed**.
6. DB acknowledges commit to client.

### Result:

* WAL ensures durability.
* Data pages flushed later via checkpoint.

---

## ⭐ **Scenario 2 — Normal ROLLBACK Workflow**

### Sequence:

1. Data pages updated **in memory**.
2. WAL creates redo & undo information.
3. On `ROLLBACK`:
   → DB applies **UNDO** to in-memory data pages
   → WAL writes a rollback record (and flushes it)
4. Data pages remain only in memory; unchanged on disk.

### Result:

* Undo is durable (WAL knows rollback occurred)
* Data pages are fixed in memory but not flushed yet.

---

## ⭐ **Scenario 3 — Crash BEFORE WAL Flush**

### Sequence:

1. Data pages updated in memory.
2. WAL still only in WAL buffer (not flushed).
3. Crash happens.

### Result:

* Both memory and WAL buffer lost.
* No commit record exists.
* Transaction is treated as **never committed**.

### Durability preserved:

Because commit was *never acknowledged*, database is consistent.

---

## ⭐ **Scenario 4 — Crash AFTER WAL Flush but BEFORE Data Page Flush**

### Sequence:

1. Data page updated in memory.
2. WAL written in memory.
3. COMMIT issued → WAL **flushed to disk**.
4. Crash occurs.
5. Data pages were never flushed.

### On recovery:

* DB scans WAL
* Replays REDO for committed transactions
* Reconstructs data pages

### Result:

* Durability is fully preserved.
* Data pages restored from WAL.

---

## ⭐ **Scenario 5 — Crash DURING a Transaction (Partial TX)**

### KEY CORRECTION:

Even without commit:

* **WAL records for changes ARE flushed periodically**
* Only the **commit record may be missing**

### Sequence:

1. Transaction performs operations.
2. DB writes WAL entries for each step; WAL writer flushes them.
3. Crash happens **before commit record is written**.

### On recovery:

* DB scans WAL.
* Sees transaction’s redo/undo records.
* Sees **no COMMIT record**.
* Applies **UNDO** to rollback incomplete transaction.

### Result:

* Partial TX rolled back safely.

---

# #️⃣ **4. When Are Data Pages Updated in Buffer Memory?**

Data pages are updated **immediately when SQL modifies data**, before any commit and before WAL flush.

### Steps:

1. SQL issued.
2. Data page loaded into buffer pool.
3. Change applied directly to in-memory page.
4. WAL records generated afterward.

➡ **Changes happen in buffer memory first, always.**

---

# #️⃣ **5. When & How Does WAL Delete Old Records?**

WAL does **NOT delete records immediately after commit**.

Instead:

### WAL cleanup happens **after checkpoints**:

1. Checkpoint flushes dirty data pages to disk.
2. DB identifies the oldest LSN required for crash recovery.
3. WAL segments older than this LSN are no longer needed.
4. DB removes or recycles those WAL files.

➡ WAL cleanup is tied to checkpoints, not commits.

---

# #️⃣ **6. How DB Detects Partial Transactions After Crash**

Even partial TX generate WAL entries that are flushed by:

* WAL writer threads
* Periodic background checkpoints
* Buffer pressure
* Group commit

So after crash:

* WAL on disk contains early TX operations
* But *no COMMIT record* for incomplete TX

Recovery process:

1. Reads WAL sequentially.
2. Finds transaction with redo/undo records.
3. Notices missing commit record.
4. Performs **UNDO** using WAL undo information.

➡ WAL flush for changes happens before commit, ensuring UNDO safety.

---

# #️⃣ **7. Where Are WAL REDO & UNDO Operations Applied?**

### ❌ Not applied to WAL

### ✔ Applied to **Data Pages in the Buffer Pool**

During recovery:

### REDO:

* WAL scanned
* Affected pages loaded into memory
* REDO applied to in-memory pages
* Pages later flushed to disk

### UNDO:

* Uses before-images stored in WAL
* Applies undo to in-memory data pages
* Writes an undo record to WAL for durability

➡ WAL is **never** modified during undo/redo.
➡ Only the **data pages** (buffer pages) are modified.

---

# #️⃣ **8. Unified Summary Table**

### 🔥 Behavior Matrix

| Scenario             | WAL Flushed? | Data Page Flushed?   | DB Action          | Result                 |
| -------------------- | ------------ | ------------------   | ------------------ | ---------------------- |
| Normal commit        | ✔ Yes        | ❌ No               | REDO not needed    | Commit durable         |
| Normal rollback      | ✔ Yes        | ❌ No               | UNDO applied       | Rollback durable       |
| Crash pre-WAL flush  | ❌ No        | ❌ No               | Nothing to recover | TX lost but consistent |
| Crash post-WAL flush | ✔ Yes        | ❌ No               | REDO applies       | TX preserved           |
| Crash mid-TX         | ✔ Partial    | ❌ No               | UNDO applies       | Partial TX rolled back |

---

# #️⃣ **9. Concept Map**

* **Data pages** = actual table data
  Updated immediately in memory; flushed later.

* **WAL** = authoritative log of all changes
  Must be flushed before reporting COMMIT.

* **Checkpoints** = flush dirty pages; allow WAL cleanup.

* **REDO** = reapply committed changes after crash.

* **UNDO** = revert uncommitted changes after crash.

* **Durability** relies entirely on WAL, not data pages.

---
