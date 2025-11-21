# ✅ Cloudinary File Upload System - Complete Implementation

## 🎯 Overview

The TaskLynk platform now has a **fully functional file upload and download system** powered by **Cloudinary** cloud storage. This system works seamlessly across all user roles (Admin, Client, Freelancer, Manager) with proper format preservation, security, and user-friendly features.

---

## 📋 System Components

### 1. **Cloudinary Configuration** (`.env`)

```env
CLOUDINARY_CLOUD_NAME="deicqit1a"
CLOUDINARY_API_KEY="242166948379137"
CLOUDINARY_API_SECRET="M52ofeXX3tgwvhCUvJbGhxM1c5M"
CLOUDINARY_FOLDER="TaskLynk_Storage"
```

✅ **Status**: All credentials are configured and working.

---

### 2. **Upload API** (`/api/cloudinary/upload`)

**Location**: `src/app/api/cloudinary/upload/route.ts`

**Features**:
- ✅ Accepts files up to **40MB**
- ✅ Validates file formats (PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, images, archives, etc.)
- ✅ Preserves original filename and extension
- ✅ Automatically determines resource type (image, video, raw)
- ✅ Returns secure Cloudinary URL with format preservation
- ✅ Includes detailed error messages for debugging

**Supported File Types**:
```
Documents: pdf, doc, docx, ppt, pptx, xls, xlsx, txt, rtf, csv, json, xml
Images: jpg, jpeg, png, gif, bmp, svg
Archives: zip, rar, 7z, tar, gz
Media: mp3, mp4, wav, avi, mov
```

**Example Request**:
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('jobId', '23');
formData.append('folder', 'tasklynk/uploads');

const response = await fetch('/api/cloudinary/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
// Returns: { success: true, url: "https://res.cloudinary.com/...", format: "pdf", ... }
```

---

### 3. **Attachment Storage API** (`/api/jobs/[id]/attachments`)

**Location**: `src/app/api/jobs/[id]/attachments/route.ts`

**Features**:
- ✅ Stores file metadata in database
- ✅ Links files to specific jobs
- ✅ Tracks uploader user ID and role
- ✅ Supports upload types: `initial`, `draft`, `final`, `revision`
- ✅ Validates file sizes (40MB limit)
- ✅ Filters deleted files (soft delete support)
- ✅ Returns uploader details (name, role, email)

**Database Schema** (`jobAttachments` table):
```typescript
{
  id: integer,
  jobId: integer,
  uploadedBy: integer,
  fileName: text,           // ✅ Original filename with extension
  fileUrl: text,            // ✅ Cloudinary secure URL
  fileSize: integer,        // In bytes
  fileType: text,           // MIME type (e.g., "application/pdf")
  uploadType: text,         // initial, draft, final, revision
  attachmentCategory: text, // Optional category
  scheduledDeletionAt: text,
  deletedAt: text,          // Soft delete timestamp
  createdAt: text
}
```

**Example GET Request**:
```bash
GET /api/jobs/23/attachments
```

**Example Response**:
```json
[
  {
    "id": 1,
    "jobId": 23,
    "uploadedBy": 5,
    "uploaderName": "John Doe",
    "uploaderRole": "client",
    "uploaderEmail": "john@example.com",
    "fileName": "research-paper.pdf",
    "fileUrl": "https://res.cloudinary.com/deicqit1a/raw/upload/...",
    "fileSize": 2048576,
    "fileType": "application/pdf",
    "uploadType": "initial",
    "createdAt": "2025-11-16T10:30:00Z"
  }
]
```

---

### 4. **Download Proxy API** (`/api/files/download/[id]`)

**Location**: `src/app/api/files/download/[id]/route.ts`

**Features**:
- ✅ Generates **signed Cloudinary URLs** (5-minute expiration)
- ✅ Proxies file downloads to bypass CORS issues
- ✅ Sets proper `Content-Disposition` headers for downloads
- ✅ Preserves original filename in download
- ✅ Handles external links (opens in new tab)
- ✅ Fallback to direct URL if proxy fails

**How It Works**:
1. Client requests: `GET /api/files/download/1`
2. Server fetches file metadata from database
3. Generates signed Cloudinary URL (5-min expiration)
4. Proxies file content with proper headers
5. Client downloads file with original filename

**Example Usage**:
```javascript
const response = await fetch(`/api/files/download/${fileId}`);
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);

// Download with original filename preserved
const link = document.createElement('a');
link.href = url;
link.download = originalFileName;
link.click();
```

---

### 5. **File Upload UI Component** (`FileUploadSection`)

**Location**: `src/components/file-upload-section.tsx`

**Features**:
- ✅ **Format Validation**: Client-side validation before upload
- ✅ **Size Validation**: Shows error for files > 40MB
- ✅ **Multi-file Upload**: Select and upload multiple files at once
- ✅ **Visual Feedback**: Progress indicators, success/error toasts
- ✅ **File Preview**: Shows selected files with size and format
- ✅ **Grouped Display**: 
  - **Client View**: "Your Upload" (A) vs "Writer's Upload" (B)
  - **Admin View**: "Client Upload" (A) vs "Writers Upload" (B)
  - **Freelancer View**: "Client Upload" (A) vs "Your Upload" (B)
- ✅ **Download Support**: One-click download with original filename
- ✅ **External Links**: Special handling for shared links
- ✅ **Format Preservation**: Shows file extensions (.pdf, .docx, etc.)
- ✅ **Storage Notice**: Informs users about 1-week auto-deletion

**UI Components**:
```tsx
<FileUploadSection
  jobId={23}
  currentUserId={5}
  currentUserRole="client"
  files={attachments}
  canUpload={true}
  canDownload={true}
  uploadType="initial"
  onFileUploaded={() => refetch()}
  clientId={10} // For grouping in admin/freelancer view
/>
```

**Visual Features**:
- 📁 File icons based on type (PDF, Word, Excel, Image, Archive)
- 📊 File size display (KB, MB)
- ⏰ Upload timestamp
- 🏷️ Upload type badges (Initial, Draft, Final, Revision)
- ✅ "Available" status indicator
- 📥 Download button

---

## 🔐 Security Features

### 1. **Server-Side Validation**
- ✅ File format whitelist (only allowed types)
- ✅ File size limits (40MB maximum)
- ✅ MIME type validation
- ✅ Extension validation

### 2. **Access Control**
- ✅ User authentication required
- ✅ Role-based permissions (canUpload, canDownload)
- ✅ Job ownership verification

### 3. **Signed URLs**
- ✅ Cloudinary signed URLs with 5-minute expiration
- ✅ Prevents unauthorized direct access
- ✅ Automatic expiration for security

### 4. **Soft Delete System**
- ✅ Files marked as deleted (not physically removed)
- ✅ Scheduled deletion after 1 week
- ✅ Can be restored if needed

---

## 📦 File Upload Flow

### **Client Uploads File**:

```
1. Client selects file(s) in UI
   ↓
2. Frontend validates format and size
   ↓
3. POST /api/cloudinary/upload (FormData)
   ↓
4. Cloudinary stores file and returns secure URL
   ↓
5. POST /api/jobs/[id]/attachments (save metadata)
   ↓
6. Database stores file metadata with uploader info
   ↓
7. UI refreshes and shows uploaded file
   ↓
8. Notifications sent to all relevant users
```

### **User Downloads File**:

```
1. User clicks Download button
   ↓
2. GET /api/files/download/[id]
   ↓
3. Server fetches file metadata from database
   ↓
4. Server generates signed Cloudinary URL
   ↓
5. Server proxies file content
   ↓
6. Browser downloads file with original filename
```

---

## 🎨 UI/UX Features

### **Format Preservation Notice**
```
ℹ️ Format Preservation: All files maintain their original format (.pdf, .docx, .pptx, etc.).
⚠️ Size Limit: Maximum file size is 40MB. Larger files will be rejected.
☁️ Storage: Files are securely stored and will be automatically deleted 1 week after order completion.
```

### **File Grouping (Client View)**
```
┌─────────────────────────────────────────────────────────────┐
│ Files [2]                                                    │
├─────────────────────────────────────────────────────────────┤
│ A - Your Upload (1)          │ B - Writer's Upload (1)      │
│ ┌─────────────────────────┐  │ ┌─────────────────────────┐ │
│ │ 📄 instructions.pdf     │  │ │ 📄 completed-work.docx  │ │
│ │ You • 1.5 MB            │  │ │ Writer • 2.3 MB         │ │
│ │ Nov 16, 10:30 • Initial │  │ │ Nov 16, 14:20 • Final   │ │
│ │ ✅ Available [Download] │  │ │ ✅ Available [Download] │ │
│ └─────────────────────────┘  │ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Selected Files Preview**
```
Selected files (2):
┌─────────────────────────────────────────────────┐
│ 📄 research-paper.pdf • .pdf • (2.1 MB)    [×] │
│ 📄 data-analysis.xlsx • .xlsx • (850 KB)   [×] │
└─────────────────────────────────────────────────┘
```

### **File Too Large Warning**
```
┌─────────────────────────────────────────────────┐
│ 📄 large-file.zip • .zip • (45 MB) ⚠️ Too Large! [×] │
└─────────────────────────────────────────────────┘
Toast: ❌ File "large-file.zip" is too large (45 MB). Maximum size is 40 MB.
       Please compress your file or split it into smaller parts.
```

---

## ✅ Testing Checklist

### **Upload Tests**
- [x] Client can upload files to own orders
- [x] Freelancer can upload files to assigned orders
- [x] Admin can upload files to any order
- [x] Files > 40MB are rejected with proper error message
- [x] Invalid file formats are rejected
- [x] Multiple files can be uploaded at once
- [x] Original filename is preserved
- [x] File extension is preserved (.pdf, .docx, etc.)

### **Download Tests**
- [x] Files download with original filename
- [x] PDF files open correctly
- [x] Word documents maintain formatting
- [x] Images display correctly
- [x] Archives extract properly
- [x] External links open in new tab
- [x] CORS issues are bypassed via proxy

### **Permission Tests**
- [x] Unapproved users cannot upload files
- [x] Users can only access files for their own orders
- [x] Admin can access all files
- [x] Deleted files are not shown in lists

### **UI Tests**
- [x] File grouping works for all roles (Client, Admin, Freelancer)
- [x] Upload progress shows correctly
- [x] Success/error toasts display properly
- [x] File icons match file types
- [x] File sizes format correctly (KB, MB, GB)
- [x] Timestamps display in local timezone

---

## 🚀 Integration Across Platform

### **Where File Upload is Used**:

1. **Client New Order Page** (`/client/new-job`)
   - Upload order instructions and requirements

2. **Client Order Detail Page** (`/client/jobs/[id]`)
   - View uploaded files
   - Download completed work
   - Upload additional files for revisions

3. **Freelancer Order Detail Page** (`/freelancer/jobs/[id]`)
   - View client instructions
   - Upload draft submissions
   - Upload final completed work
   - Upload revision files

4. **Admin Order Management** (`/admin/jobs/[id]`)
   - View all files (client + freelancer)
   - Upload additional files if needed
   - Monitor file submissions

5. **Manager Order Oversight** (`/manager/orders/[id]`)
   - Review all uploaded files
   - Verify submission quality

---

## 📊 Database Integration

### **Job Attachments Table**
```sql
CREATE TABLE job_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  file_name TEXT NOT NULL,          -- Original filename with extension
  file_url TEXT NOT NULL,           -- Cloudinary secure URL
  file_size INTEGER NOT NULL,       -- Size in bytes
  file_type TEXT NOT NULL,          -- MIME type
  upload_type TEXT NOT NULL,        -- initial/draft/final/revision
  attachment_category TEXT,         -- Optional category
  scheduled_deletion_at TEXT,       -- Auto-delete timestamp
  deleted_at TEXT,                  -- Soft delete timestamp
  created_at TEXT NOT NULL
);
```

### **File Lifecycle**:
```
1. Upload → Status: Active (deletedAt = null)
2. Order Complete → scheduledDeletionAt = now() + 7 days
3. After 7 days → deletedAt = now() (soft delete)
4. Cron Job → Physical deletion from Cloudinary (optional)
```

---

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **Issue**: Upload fails with "File too large"
**Solution**: 
- Compress files before uploading
- Split large files into multiple smaller files
- Maximum size: 40MB per file

#### **Issue**: "Unsupported file type" error
**Solution**:
- Check file extension is in allowed list
- Rename file to have proper extension (.pdf, .docx, etc.)
- Supported formats listed above

#### **Issue**: Download fails or shows CORS error
**Solution**:
- System uses proxy endpoint `/api/files/download/[id]`
- Proxy automatically handles CORS issues
- If proxy fails, system falls back to direct URL

#### **Issue**: File shows "Available" but won't download
**Solution**:
- Check Cloudinary credentials in `.env`
- Verify signed URL generation is working
- Check server logs for detailed error messages

---

## 📝 Key Implementation Details

### **Format Preservation**
```javascript
// ✅ Cloudinary upload preserves original filename
public_id: `${Date.now()}-${sanitizedName}`, // Timestamp + original name
format: fileExt, // Explicitly set file extension
use_filename: true,
unique_filename: true,
```

### **Resource Type Detection**
```javascript
let resourceType = 'raw'; // Default for documents

if (type.startsWith('image/')) {
  resourceType = 'image';
} else if (type.startsWith('video/')) {
  resourceType = 'video';
} else {
  resourceType = 'raw'; // PDFs, DOC, DOCX, ZIP, etc.
}
```

### **Signed URL Generation**
```javascript
const signedUrl = cloudinary.url(publicId, {
  resource_type: 'raw',
  type: 'upload',
  sign_url: true,
  secure: true,
  expires_at: Math.floor(Date.now() / 1000) + 300, // 5 minutes
});
```

---

## 🎉 Summary

✅ **Cloudinary Integration**: Fully configured and operational  
✅ **File Upload**: Works across all user roles  
✅ **File Download**: Original filename and format preserved  
✅ **Format Validation**: Client and server-side checks  
✅ **Size Limits**: 40MB maximum with clear error messages  
✅ **Security**: Signed URLs, access control, soft delete  
✅ **UI/UX**: Grouped file display, progress indicators, toasts  
✅ **CORS Handling**: Automatic proxy for downloads  
✅ **Database Integration**: Complete metadata storage  

---

## 🔗 Related Documentation

- Cloudinary API: https://cloudinary.com/documentation
- TaskLynk Database Schema: `src/db/schema.ts`
- File Upload Component: `src/components/file-upload-section.tsx`
- Upload API: `src/app/api/cloudinary/upload/route.ts`
- Download API: `src/app/api/files/download/[id]/route.ts`

---

**Last Updated**: November 16, 2025  
**Status**: ✅ Production Ready  
**Maintained By**: TaskLynk Development Team
