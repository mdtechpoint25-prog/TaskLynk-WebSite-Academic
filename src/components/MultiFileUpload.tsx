import React, { memo, useRef, useCallback, useState } from 'react';
import { Upload, X, Paperclip, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export interface MultiFileUploadProps {
  onFilesSelected: (files: File[]) => void;
  onFilesRemoved?: (indices: number[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number;
  maxTotalSize?: number;
  allowedFileTypes?: string[];
  context?: 'chat' | 'direct-upload' | 'job-creation' | 'revision' | 'submission';
  userRole?: 'client' | 'freelancer' | 'admin' | 'manager' | 'editor' | 'account_owner';
  selectedFiles?: File[];
  uploading?: boolean;
  onRemoveFile?: (index: number) => void;
  variant?: 'minimal' | 'compact' | 'full';
  showFileList?: boolean;
  dragAndDrop?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const shortenFileName = (name: string, maxLength: number = 30): string => {
  if (name.length <= maxLength) return name;
  const ext = name.split('.').pop() || '';
  const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
  const shortened = nameWithoutExt.substring(0, maxLength - ext.length - 3) + '...';
  return shortened + '.' + ext;
};

interface FileWithError {
  file: File;
  error?: string;
}

const FileListItem = memo(({
  file,
  index,
  onRemove,
  isUploading,
}: {
  file: File;
  index: number;
  onRemove: (index: number) => void;
  isUploading?: boolean;
}) => (
  <div className="flex items-center gap-2 p-2 bg-background rounded border border-border hover:border-primary/50 transition-colors">
    <Paperclip className="w-4 h-4 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium truncate" title={file.name}>
        {shortenFileName(file.name, 25)}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatFileSize(file.size)}
      </p>
    </div>
    <Button
      size="sm"
      variant="ghost"
      onClick={() => onRemove(index)}
      disabled={isUploading}
      className="h-6 w-6 p-0"
    >
      <X className="w-3 h-3" />
    </Button>
  </div>
));

FileListItem.displayName = 'FileListItem';

export const MultiFileUpload = memo(({
  onFilesSelected,
  onFilesRemoved,
  maxFiles = 10,
  maxSizePerFile = 100 * 1024 * 1024, // 100MB default
  maxTotalSize = 500 * 1024 * 1024, // 500MB default
  allowedFileTypes,
  context = 'direct-upload',
  userRole = 'client',
  selectedFiles = [],
  uploading = false,
  onRemoveFile,
  variant = 'full',
  showFileList = true,
  dragAndDrop = true,
}: MultiFileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileErrors, setFileErrors] = useState<FileWithError[]>([]);

  // Validate files
  const validateFiles = useCallback((files: File[]): FileWithError[] => {
    const validated: FileWithError[] = [];
    let totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

    for (const file of files) {
      const errors: string[] = [];

      // Check file size
      if (file.size > maxSizePerFile) {
        errors.push(`File exceeds max size of ${formatFileSize(maxSizePerFile)}`);
      }

      // Check total size
      totalSize += file.size;
      if (totalSize > maxTotalSize) {
        errors.push(`Total size would exceed ${formatFileSize(maxTotalSize)}`);
      }

      // Check file type
      if (allowedFileTypes && allowedFileTypes.length > 0) {
        const isAllowed = allowedFileTypes.some(type => {
          if (type === '*/*') return true;
          if (type.endsWith('/*')) {
            const category = type.split('/')[0];
            return file.type.startsWith(category);
          }
          return file.type === type;
        });

        if (!isAllowed) {
          errors.push(`File type not allowed. Allowed: ${allowedFileTypes.join(', ')}`);
        }
      }

      // Check max files
      if (selectedFiles.length + files.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
      }

      validated.push({
        file,
        error: errors.length > 0 ? errors[0] : undefined,
      });
    }

    return validated;
  }, [selectedFiles, maxFiles, maxSizePerFile, maxTotalSize, allowedFileTypes]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validated = validateFiles(fileArray);

    // Show errors
    const errors = validated.filter(f => f.error);
    const valid = validated.filter(f => !f.error);

    if (errors.length > 0) {
      toast.error(`${errors.length} file(s) have issues:\n${errors[0].error}`);
    }

    if (valid.length > 0) {
      onFilesSelected(valid.map(v => v.file));
      toast.success(`${valid.length} file(s) selected`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [validateFiles, onFilesSelected]);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleRemove = useCallback((index: number) => {
    if (onRemoveFile) {
      onRemoveFile(index);
    }
  }, [onRemoveFile]);

  // Minimal variant (just button)
  if (variant === 'minimal') {
    return (
      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          accept={allowedFileTypes?.join(',')}
          disabled={uploading}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={selectedFiles.length >= maxFiles || uploading}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload
        </Button>
      </div>
    );
  }

  // Compact variant (button + count)
  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          accept={allowedFileTypes?.join(',')}
          disabled={uploading}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={selectedFiles.length >= maxFiles || uploading}
          className="w-full gap-2"
        >
          <Paperclip className="w-4 h-4" />
          Select Files ({selectedFiles.length}/{maxFiles})
        </Button>
        
        {showFileList && selectedFiles.length > 0 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <FileListItem
                key={`${file.name}-${index}`}
                file={file}
                index={index}
                onRemove={handleRemove}
                isUploading={uploading}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full variant (drag & drop + upload details)
  return (
    <div className="space-y-3">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30 hover:border-primary/50'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={dragAndDrop ? handleDrag : undefined}
        onDragLeave={dragAndDrop ? handleDrag : undefined}
        onDragOver={dragAndDrop ? handleDrag : undefined}
        onDrop={dragAndDrop ? handleDrop : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          accept={allowedFileTypes?.join(',')}
          disabled={uploading}
        />

        <div className="text-center">
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            {dragAndDrop ? 'Drag files here or click to select' : 'Click to select files'}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Max {formatFileSize(maxSizePerFile)} per file, {maxFiles} files total
            {allowedFileTypes && allowedFileTypes.length > 0 && ` • Types: ${allowedFileTypes.join(', ')}`}
          </p>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={selectedFiles.length >= maxFiles || uploading}
            className="gap-2"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</>
            ) : (
              <><Upload className="w-4 h-4" />Select Files</>
            )}
          </Button>
        </div>
      </div>

      {showFileList && selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Selected Files ({selectedFiles.length}/{maxFiles})
            </p>
            {uploading && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs text-muted-foreground">Uploading...</span>
              </div>
            )}
          </div>

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <FileListItem
                key={`${file.name}-${index}`}
                file={file}
                index={index}
                onRemove={handleRemove}
                isUploading={uploading}
              />
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            Total size: {formatFileSize(selectedFiles.reduce((sum, f) => sum + f.size, 0))}
          </div>
        </div>
      )}
    </div>
  );
});

MultiFileUpload.displayName = 'MultiFileUpload';
