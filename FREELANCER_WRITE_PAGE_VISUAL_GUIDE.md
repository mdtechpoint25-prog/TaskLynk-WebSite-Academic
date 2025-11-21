# 🎬 Freelancer Write Page - Visual Testing Guide

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  FREELANCER JOB DETAIL PAGE (/freelancer/jobs/[id])        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ← Back to Dashboard                                         │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ORDER DETAILS                                        │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │                                                       │   │
│  │ Research Paper - Write 2000 words     [In Progress] │   │
│  │ Order ID: ORD-2024-001                              │   │
│  │ Assigned Jan 15, 2024                               │   │
│  │                                                       │   │
│  │ Work Type: Research Paper | Pages: 5 | Deadline: ...│   │
│  │ Your Earnings: KSh 2,500                             │   │
│  │                                                       │   │
│  │ Instructions: Write a 5-page research paper on...    │   │
│  │                                                       │   │
│  │ ┌────────────────────────────────────────────────┐   │   │
│  │ │ ⏰ Working on this order                        │   │   │
│  │ │ Upload your work files below. Final submission │   │   │
│  │ │ requires the main document plus Plagiarism &   │   │   │
│  │ │ AI reports.                                    │   │   │
│  │ └────────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │ ✅ Final package ready                              │   │
│  │ ├─ Final document, Plagiarism report, AI report   │   │   │
│  │ └─ [🔒 SUBMIT ORDER] (Green button)                │   │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────┬──────────────────────────┐      │
│  │ CHAT                    │ FILES                    │      │
│  ├─────────────────────────┼──────────────────────────┤      │
│  │                         │ CLIENT FILES (0)         │      │
│  │ No messages yet ←─────→ │ No files from client yet │      │
│  │                         │                          │      │
│  │ Send a message...       │ YOUR FILES (3)           │      │
│  │                         │ ├─ draft-1.pdf (1.2MB)  │      │
│  │ Type message...         │ │  [draft] ⬇️            │      │
│  │ [━━━━━━━━━━━] [Send]    │ ├─ paper-final.pdf ...  │      │
│  │                         │ │  [final_document] ⬇️   │      │
│  │                         │ └─ plagiarism.pdf ...    │      │
│  │                         │    [plagiarism_report] ⬇️│      │
│  │                         │                          │      │
│  │                         │ UPLOAD YOUR WORK FILES   │      │
│  │                         │                          │      │
│  │                         │ Select File Type:        │      │
│  │                         │ [▼ Choose file type]    │      │
│  │                         │                          │      │
│  │                         │ Notes (optional):        │      │
│  │                         │ [Updated version ...]    │      │
│  │                         │                          │      │
│  │                         │ Selected Files (2/10):   │      │
│  │                         │ ├─ paper-v2.pdf (1.5MB) │      │
│  │                         │ ├─ sources.pdf (2.1MB)   │      │
│  │                         │ └─ [✕ Remove]            │      │
│  │                         │                          │      │
│  │                         │ [📎 Select Files] [⬆️ Upload] │      │
│  │                         │                          │      │
│  │                         │ ℹ️ Final submission      │      │
│  │                         │ requires Final Document, │      │
│  │                         │ Plagiarism & AI reports  │      │
│  └─────────────────────────┴──────────────────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## File Type Selector Dropdown

```
┌─ Select File Type ─────────────┐
│ Choose file type               │
└─────────────────────────────────┘
  ▼

┌─────────────────────────────────┐
│ ✓ Draft                         │  ← Currently showing draft files
│   Final Document                │
│   Completed Paper               │
│   Plagiarism Report             │
│   AI Report                     │
│   Revision                      │
│   Abstract                      │
│   Printable Sources             │
│   Graphics/Tables               │
│   Additional Files              │
└─────────────────────────────────┘
```

---

## Upload Process Flow

```
START
  │
  ▼
Click "Select Files" button
  │
  ▼
File dialog opens
  │
  ├─ User selects file(s)
  │ (can select 1-10 files)
  │
  ▼
Selected files appear in list
  │
  ├─ paper-v2.pdf (1.5MB) [×]
  │ sources.pdf (2.1MB)  [×]
  │
  ▼
Select file type from dropdown
  │
  ├─ [▼ Draft]
  │ [▼ Final Document]
  │ etc.
  │
  ▼
Click "Upload" button
  │
  ▼
Toast: "⏳ Uploading..."
  │
  ├─ Upload to Cloudinary
  │ ├─ paper-v2.pdf → https://res.cloudinary.com/...
  │ └─ sources.pdf → https://res.cloudinary.com/...
  │
  ├─ Save metadata to /api/v2/orders/[id]/upload/draft
  │ ├─ fileName, fileSize, mimeType, fileType, uploadedAt
  │
  ▼
Toast: "✅ Files uploaded successfully as 'Draft'!"
  │
  ▼
Refresh file list
  │
  ▼
Files appear in "YOUR FILES" section
  │
  ├─ paper-v2.pdf (1.5MB)
  │  [draft] ⬇️
  │  Jan 15, 10:30
  │
  ├─ sources.pdf (2.1MB)
  │  [draft] ⬇️
  │  Jan 15, 10:30
  │
  ▼
Check if final package ready
  │
  ├─ If YES → "Submit Order" button appears
  │ If NO  → "Requirements not met" message
  │
  ▼
END
```

---

## Submit Process Flow

```
START
  │
  ▼
Click "Submit Order" (green button)
  │
  ▼
Dialog: "Confirm Order Submission"
  │
  ┌───────────────────────────────────────┐
  │ Confirm Order Submission              │
  │                                       │
  │ You are about to submit this order    │
  │ for admin review. Confirm files:      │
  │                                       │
  │ Final Package:                        │
  │ ✓ paper-final.pdf (2.1MB)             │
  │ ✓ plagiarism.pdf (1.3MB)              │
  │ ✓ ai-report.pdf (0.8MB)               │
  │                                       │
  │ Once submitted, your work will be     │
  │ reviewed by admin before delivery     │
  │ to the client.                        │
  │                                       │
  │ [Cancel] [✓ Confirm & Submit]        │
  └───────────────────────────────────────┘
  │
  ├─ User clicks "Confirm & Submit"
  │
  ▼
Toast: "⏳ Submitting..."
  │
  ├─ POST /api/jobs/[id]/submit
  │
  ├─ Backend validates:
  │  ✓ Job exists
  │  ✓ Status is "assigned"
  │  ✓ Final files uploaded
  │
  ├─ Update job status: assigned → editing
  │
  ├─ Create notifications:
  │  ├─ For Admin: "Order submitted by writer"
  │  └─ For Client: "Order under review"
  │
  ├─ Create audit log entry
  │
  ▼
Toast: "✅ Order submitted successfully!"
  │
  ▼
Status badge changes
  │
  ├─ Before: [In Progress]
  │ After:  [Submitted]
  │
  ▼
Upload interface replaced
  │
  ├─ Before: Upload form visible
  │
  ├─ After:  ┌──────────────────────────┐
  │          │ ✅ Work submitted         │
  │          │ Under review by admin     │
  │          │ Waiting for delivery...   │
  │          └──────────────────────────┘
  │
  ▼
END
```

---

## Error Scenarios

### Error 1: No File Type Selected
```
┌─────────────────────────────────────┐
│ Files selected: 2                   │
│ File type: [Select file type]       │
│                                     │
│ Click "Upload"                      │
│                                     │
│ ❌ Toast: "Please select a file     │
│    type before uploading"           │
└─────────────────────────────────────┘
```

### Error 2: No Files Selected
```
┌─────────────────────────────────────┐
│ Files selected: 0                   │
│ File type: [Draft]                  │
│                                     │
│ Click "Upload"                      │
│                                     │
│ ❌ Toast: "Please select files      │
│    to upload"                       │
└─────────────────────────────────────┘
```

### Error 3: Too Many Files (11+)
```
┌─────────────────────────────────────┐
│ Files selected (11/10):             │
│ ├─ file1.pdf                        │
│ ├─ file2.pdf                        │
│ ... (10 more)                       │
│                                     │
│ Click "Select Files" for 11th       │
│                                     │
│ ❌ Toast: "Maximum 10 files         │
│    allowed per upload"              │
└─────────────────────────────────────┘
```

### Error 4: File Too Large (>40MB)
```
┌─────────────────────────────────────┐
│ Files selected:                     │
│ ├─ large-file.zip (50MB)            │
│                                     │
│ Click "Upload"                      │
│                                     │
│ ❌ Toast: "File size exceeds        │
│    40MB limit. Please compress      │
│    or split your file."             │
└─────────────────────────────────────┘
```

### Error 5: Unsupported File Type
```
┌─────────────────────────────────────┐
│ Files selected:                     │
│ ├─ executable.exe                   │
│                                     │
│ Click "Upload"                      │
│                                     │
│ ❌ Toast: "Unsupported file type:   │
│    .exe. Please upload a supported  │
│    file format."                    │
└─────────────────────────────────────┘
```

### Error 6: Missing Requirements for Submit
```
┌─────────────────────────────────────┐
│ ⚠️  Submission requirements not met  │
│                                     │
│ ☐ Upload Final Document             │
│ ☑ Upload Plagiarism Report          │
│ ☐ Upload AI Detection Report        │
│ ☑ Upload at least one Draft         │
│                                     │
│ [🔒 SUBMIT ORDER] (Disabled)       │
└─────────────────────────────────────┘
```

---

## Success States

### Success 1: File Uploaded
```
┌─────────────────────────────────────┐
│ ✅ Files uploaded successfully as   │
│    'Draft'!                         │
│                                     │
│ YOUR FILES (2)                      │
│ ├─ paper-v2.pdf (1.5MB)             │
│ │  [draft] Jan 15, 10:30 ⬇️         │
│ │                                   │
│ └─ sources.pdf (2.1MB)              │
│    [draft] Jan 15, 10:32 ⬇️         │
└─────────────────────────────────────┘
```

### Success 2: Final Package Ready
```
┌─────────────────────────────────────┐
│ ✅ Final package ready              │
│                                     │
│ Final document, Plagiarism report,  │
│ and AI report uploaded.             │
│                                     │
│ [🔓 SUBMIT ORDER] (Green, enabled) │
└─────────────────────────────────────┘
```

### Success 3: Order Submitted
```
┌─────────────────────────────────────┐
│ ✅ Order submitted successfully!    │
│    It will be reviewed by admin     │
│    before delivery to client.       │
│                                     │
│ Status: [Submitted]                 │
│                                     │
│ ✅ Work submitted - Under review    │
│    Admin is reviewing your work     │
│    before delivery to client        │
└─────────────────────────────────────┘
```

---

## Badge Reference

### File Type Badges
```
[draft]               = Gray/Muted - Draft version
[final_document]      = Green - Final submitted
[plagiarism_report]   = Blue - Plagiarism check
[ai_report]           = Blue - AI detection
[revision]            = Amber - Revision files
[abstract]            = Green - Abstract
[additional]          = Gray - Extra files
```

### Status Badges
```
[Assigned]            = Waiting for work to start
[In Progress]         = Work in progress
[Submitted]           = Submitted, under review
[Under Review]        = Admin reviewing
[Editing]             = In editing/QA
[Delivered]           = Delivered to client
[Completed]           = Client approved
[Paid]                = Payment processed
[Revision]            = Needs revision
[Cancelled]           = Order cancelled
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message (when in message field) |
| `Shift+Enter` | New line in message |
| `Ctrl+Click` | Select multiple files (browser dependent) |

---

## Browser DevTools Debugging

### Check Upload Status
```javascript
// In Console (F12):

// 1. Check if token exists
localStorage.getItem('bearer_token')
// Returns: "eyJhbGc..." or null

// 2. Check user info
JSON.parse(localStorage.getItem('user'))
// Returns: { id: 123, email: "...", role: "freelancer" }

// 3. Test file fetch
fetch('/api/v2/orders/123/files?role=freelancer&userId=456')
  .then(r => r.json())
  .then(console.log)

// 4. Check job data
fetch('/api/jobs/123')
  .then(r => r.json())
  .then(console.log)

// 5. Check Cloudinary config
fetch('/api/cloudinary/upload', {
  method: 'POST',
  body: new FormData()
}).then(r => r.json()).then(console.log)
```

### Network Tab Monitoring
```
Open DevTools (F12) → Network Tab

Watch for these requests:

1. POST /api/cloudinary/upload
   Status: 200
   Response: { "url": "https://res.cloudinary.com/..." }

2. POST /api/v2/orders/[id]/upload/draft
   Status: 200
   Response: { "success": true, "files": [...] }

3. GET /api/v2/orders/[id]/files
   Status: 200
   Response: { "files": [...] }

4. POST /api/jobs/[id]/submit
   Status: 200
   Response: { "success": true, "job": {...} }
```

---

## Performance Expectations

| Action | Time | Status |
|--------|------|--------|
| Page load | < 2s | ✅ Fast |
| Upload 5MB file | 5-10s | ✅ Good |
| Upload 20MB file | 15-30s | ✅ Good |
| Click submit | < 1s | ✅ Instant |
| Process submit | 2-5s | ✅ Good |
| Fetch file list | < 2s | ✅ Fast |
| Page refresh | < 3s | ✅ Good |

---

**Status**: ✅ Ready for Testing  
**Version**: 1.0 Complete  
**Last Updated**: Today
