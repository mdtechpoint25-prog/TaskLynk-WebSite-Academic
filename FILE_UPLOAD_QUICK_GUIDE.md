# 📁 File Upload System - Quick User Guide

## 🎯 Overview

TaskLynk uses **Cloudinary** cloud storage for secure and reliable file management. All uploaded files maintain their original format and can be downloaded anytime.

---

## 📤 How to Upload Files

### **Step 1: Navigate to Your Order**
- **Clients**: Go to `/client/jobs/[id]`
- **Freelancers**: Go to `/freelancer/jobs/[id]`
- **Admins**: Go to `/admin/jobs/[id]`

### **Step 2: Select Files**
1. Click the **"Choose Files"** button
2. Select one or multiple files (hold Ctrl/Cmd for multiple selection)
3. Review selected files in the preview area

### **Step 3: Upload**
1. Click the **"Upload"** button
2. Wait for the upload to complete (progress shown)
3. Files appear in the **"Files"** section automatically

---

## ✅ Supported File Types

### **Documents**
- PDF (`.pdf`)
- Word (`.doc`, `.docx`)
- PowerPoint (`.ppt`, `.pptx`)
- Excel (`.xls`, `.xlsx`)
- Text (`.txt`, `.rtf`, `.csv`)
- Other (`.json`, `.xml`)

### **Images**
- JPG/JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- BMP (`.bmp`)
- SVG (`.svg`)

### **Archives**
- ZIP (`.zip`)
- RAR (`.rar`)
- 7-Zip (`.7z`)
- TAR (`.tar`, `.gz`)

### **Media** (Limited)
- Audio (`.mp3`, `.wav`)
- Video (`.mp4`, `.avi`, `.mov`) - **Note**: Large video files may be rejected

---

## ⚠️ File Size Limits

- **Maximum file size**: **40MB per file**
- **Total upload limit**: No limit on number of files
- **Recommended**: Keep files under 20MB for faster uploads

### **If your file is too large**:
1. **Compress** the file using ZIP/RAR
2. **Split** large files into smaller parts
3. **Reduce quality** for images/videos
4. **Use external links** for very large files (Google Drive, Dropbox, etc.)

---

## 📥 How to Download Files

### **Method 1: Direct Download**
1. Find the file in the **"Files"** section
2. Click the **Download** button (📥 icon)
3. File downloads with original filename preserved

### **Method 2: External Links**
- If file is a shared link (Google Drive, Dropbox)
- Click the link to open in new tab
- Download from the external service

---

## 🔐 Security & Privacy

### **Who Can See Files?**
- **Clients**: See their own uploads + writer's submissions
- **Freelancers**: See client's instructions + their own submissions
- **Admins**: See ALL files for the order
- **Managers**: See ALL files for orders they oversee

### **File Protection**
- ✅ Files are stored securely on Cloudinary
- ✅ Only authorized users can access files
- ✅ Download links expire after 5 minutes (auto-regenerated)
- ✅ Files are soft-deleted (recoverable by admin)

### **File Retention**
- Files are kept for **1 week after order completion**
- After 1 week, files are automatically scheduled for deletion
- Admins can extend retention period if needed

---

## 🎨 File Organization

### **Client View**
```
┌─────────────────────────────────────────┐
│ A - Your Upload (2)                     │
│ • Instructions.pdf                      │
│ • Requirements.docx                     │
├─────────────────────────────────────────┤
│ B - Writer's Upload (1)                 │
│ • Completed-Work.pdf                    │
└─────────────────────────────────────────┘
```

### **Freelancer View**
```
┌─────────────────────────────────────────┐
│ A - Client Upload (2)                   │
│ • Instructions.pdf                      │
│ • Requirements.docx                     │
├─────────────────────────────────────────┤
│ B - Your Upload (1)                     │
│ • Draft-Submission.pdf                  │
└─────────────────────────────────────────┘
```

### **Admin View**
```
┌─────────────────────────────────────────┐
│ A - Client Upload (2)                   │
│ • Instructions.pdf                      │
│ • Requirements.docx                     │
├─────────────────────────────────────────┤
│ B - Writers Upload (2)                  │
│ • Draft-Submission.pdf (Freelancer)     │
│ • Final-Review.pdf (Admin)              │
└─────────────────────────────────────────┘
```

---

## 🏷️ Upload Types

Files are categorized by upload type:

1. **Initial** - Order instructions and requirements (Client uploads)
2. **Draft** - Draft submissions for review (Freelancer uploads)
3. **Final** - Final completed work (Freelancer uploads)
4. **Revision** - Revision submissions after feedback (Freelancer uploads)

---

## 🚨 Common Issues & Solutions

### ❌ **"File too large" Error**
**Problem**: File exceeds 40MB limit  
**Solution**: 
- Compress file using ZIP
- Reduce image/video quality
- Split into smaller files

### ❌ **"Unsupported file type" Error**
**Problem**: File format not supported  
**Solution**:
- Check file has proper extension (.pdf, .docx, etc.)
- Rename file to include extension
- Convert to supported format

### ❌ **Upload Stuck/Frozen**
**Problem**: Upload not progressing  
**Solution**:
- Check internet connection
- Refresh page and try again
- Try smaller file or different format
- Clear browser cache

### ❌ **Download Not Working**
**Problem**: File won't download  
**Solution**:
- Try clicking download again (generates new link)
- Check browser popup blocker
- Try different browser
- Contact admin if issue persists

### ❌ **File Missing After Upload**
**Problem**: Uploaded file doesn't appear  
**Solution**:
- Refresh the page
- Check if upload completed successfully
- Look in correct upload type section
- Contact admin to verify file was received

---

## 💡 Best Practices

### **Before Uploading**
1. ✅ **Name files clearly** - Use descriptive names
   - ❌ Bad: `file1.pdf`, `doc.docx`
   - ✅ Good: `Order-Instructions.pdf`, `Research-Paper-Draft.docx`

2. ✅ **Check file size** - Keep under 20MB for best performance

3. ✅ **Verify file format** - Ensure proper extension (.pdf, .docx, etc.)

4. ✅ **Compress if needed** - Use ZIP for multiple files

### **During Upload**
1. ✅ **Wait for confirmation** - Don't close browser during upload
2. ✅ **Upload one batch at a time** - Avoid uploading 10+ files simultaneously
3. ✅ **Check progress** - Watch for success/error messages

### **After Upload**
1. ✅ **Verify files appear** - Check files section after upload
2. ✅ **Test download** - Verify file can be downloaded correctly
3. ✅ **Notify recipient** - Let other party know files are uploaded

---

## 📱 Mobile Upload Tips

### **For Mobile Users**
- Use mobile browser (Chrome, Safari) or app
- Files upload from phone storage or cloud apps
- Camera photos can be uploaded directly
- Mobile data usage: ~1MB per MB of file (no compression)

### **Recommended for Mobile**
- Keep files under 10MB on mobile data
- Use WiFi for larger uploads
- Compress images before uploading
- Use external links for very large files

---

## 🔗 External Links Support

### **How to Share External Links**
1. Upload file to Google Drive, Dropbox, OneDrive, etc.
2. Generate shareable link (set to "Anyone with link can view")
3. Paste link in order messages or instructions
4. Recipient clicks link to access file externally

### **When to Use External Links**
- ✅ Files larger than 40MB
- ✅ Video files (large size)
- ✅ Multiple large files (easier to share folder)
- ✅ Files that update frequently

---

## 📊 File Storage Information

### **Where Are Files Stored?**
- All files stored on **Cloudinary** cloud storage
- Cloudinary servers located worldwide for fast access
- 99.99% uptime guarantee
- Automatic backups and redundancy

### **File URLs**
- Format: `https://res.cloudinary.com/deicqit1a/raw/upload/...`
- URLs are permanent (don't change)
- Download links expire after 5 minutes for security
- System auto-generates new download links as needed

### **Storage Limits**
- **Per file**: 40MB maximum
- **Total storage**: Unlimited for TaskLynk users
- **Retention**: 1 week after order completion
- **Download speed**: Optimized for fast delivery

---

## 🆘 Need Help?

### **Contact Support**
- **Email**: support@tasklynk.co.ke
- **Phone**: +254701066845
- **In-App**: Send message to Admin

### **FAQs**
**Q: Can I delete uploaded files?**  
A: No, only admins can delete files. Contact admin if you uploaded wrong file.

**Q: Can I upload files after order is completed?**  
A: No, file upload is disabled after order completion.

**Q: Are my files private?**  
A: Yes, only you, assigned freelancer, and admin can see order files.

**Q: Can I edit files after uploading?**  
A: No, upload new version instead. Old version remains visible.

**Q: What happens if upload fails?**  
A: System shows error message. Try again or contact support.

---

**Last Updated**: November 16, 2025  
**Version**: 2.0  
**Platform**: TaskLynk Academic Writing Marketplace
