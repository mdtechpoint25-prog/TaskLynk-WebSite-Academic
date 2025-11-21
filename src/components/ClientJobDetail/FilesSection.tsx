import React, { memo } from 'react';
import { Download, Paperclip, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export interface Attachment {
  id: number;
  jobId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: number;
  uploaderName: string;
  uploaderRole: string;
  uploadType: string;
  createdAt: string;
}

export interface FilesSectionProps {
  clientFiles: Attachment[];
  writerFiles: Attachment[];
  clientSelectedFiles: File[];
  clientUploading: boolean;
  onClientFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClientRemoveFile: (index: number) => void;
  onClientDirectUpload: () => void;
  onDownload: (attachment: Attachment) => void;
  clientFileInputRef: React.RefObject<HTMLInputElement>;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('sheet') || fileType.includes('csv')) return '📊';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return '📦';
  return '📎';
};

const shortenFileName = (name: string, maxLength: number = 50) => {
  if (name.length <= maxLength) return name;
  const ext = name.split('.').pop() || '';
  const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
  const shortened = nameWithoutExt.substring(0, maxLength - ext.length - 3) + '...';
  return shortened + '.' + ext;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const FileItem = memo(({
  file,
  onDownload,
}: {
  file: Attachment;
  onDownload: (attachment: Attachment) => void;
}) => (
  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
    <span>{getFileIcon(file.fileType)}</span>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium truncate" title={file.fileName}>
        {shortenFileName(file.fileName, 20)}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatFileSize(file.fileSize)} • {format(new Date(file.createdAt), 'MMM dd, HH:mm')}
      </p>
    </div>
    <Button
      size="sm"
      variant="ghost"
      onClick={() => onDownload(file)}
      className="h-7 w-7 p-0"
    >
      <Download className="w-4 h-4" />
    </Button>
  </div>
));

FileItem.displayName = 'FileItem';

const WriterFileItem = memo(({
  file,
  onDownload,
}: {
  file: Attachment;
  onDownload: (attachment: Attachment) => void;
}) => (
  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
    <span>{getFileIcon(file.fileType)}</span>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium truncate" title={file.fileName}>
        {shortenFileName(file.fileName, 20)}
      </p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{formatFileSize(file.fileSize)}</span>
        <span>•</span>
        <span>{format(new Date(file.createdAt), 'MMM dd, HH:mm')}</span>
        {file.uploadType && (
          <>
            <span>•</span>
            <Badge variant="outline" className="text-xs px-1 py-0">
              {file.uploadType}
            </Badge>
          </>
        )}
      </div>
    </div>
    <Button
      size="sm"
      variant="ghost"
      onClick={() => onDownload(file)}
      className="h-7 w-7 p-0"
    >
      <Download className="w-4 h-4" />
    </Button>
  </div>
));

WriterFileItem.displayName = 'WriterFileItem';

const shortenUploadFileName = (name: string, maxLength: number = 25) => {
  if (name.length <= maxLength) return name;
  const ext = name.split('.').pop() || '';
  const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
  const shortened = nameWithoutExt.substring(0, maxLength - ext.length - 3) + '...';
  return shortened + '.' + ext;
};

export const FilesSection = memo(({
  clientFiles,
  writerFiles,
  clientSelectedFiles,
  clientUploading,
  onClientFileSelect,
  onClientRemoveFile,
  onClientDirectUpload,
  onDownload,
  clientFileInputRef,
}: FilesSectionProps) => {
  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Files</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-primary mb-2">Your Files ({clientFiles.length})</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {clientFiles.length === 0 ? (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  No files uploaded yet
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Use the upload section below to add your files
                </p>
              </div>
            ) : (
              clientFiles.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  onDownload={onDownload}
                />
              ))
            )}
          </div>
        </div>

        {/* CLIENT UPLOAD SPACE */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-bold text-primary mb-3">
            Upload Your Files
          </h3>
          
          {clientSelectedFiles.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold mb-2">Selected Files ({clientSelectedFiles.length}/10)</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {clientSelectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs bg-background p-2 rounded border">
                    <Paperclip className="w-3 h-3" />
                    <span className="flex-1 truncate">{shortenUploadFileName(file.name, 25)}</span>
                    <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onClientRemoveFile(index)}
                      className="h-5 w-5 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={clientFileInputRef}
              type="file"
              multiple
              onChange={onClientFileSelect}
              className="hidden"
              accept="*/*"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => clientFileInputRef.current?.click()}
              disabled={clientSelectedFiles.length >= 10 || clientUploading}
              className="flex-1"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Select Files ({clientSelectedFiles.length}/10)
            </Button>
            
            <Button
              onClick={onClientDirectUpload}
              disabled={clientSelectedFiles.length === 0 || clientUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {clientUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
              ) : (
                <>⬆️ Upload</>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center mt-2">
            ℹ️ Files will appear in "Your Files" section above
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-green-700 dark:text-green-400 mb-2">
            Writer Files ({writerFiles.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {writerFiles.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No files from writer yet</p>
            ) : (
              writerFiles.map((file) => (
                <WriterFileItem
                  key={file.id}
                  file={file}
                  onDownload={onDownload}
                />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

FilesSection.displayName = 'FilesSection';
