import React, { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { observer } from 'mobx-react-lite';
import { toast } from 'react-toastify';
import {
  Upload as UploadIcon,
  PictureAsPdf as PDFIcon,
  Description as DocIcon,
  Notes as TxtIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  LinearProgress,
  Chip,
} from '@mui/material';
import { useStores } from '@/hooks/useStores';
import { DocumentType } from '@/stores/translate/DocumentStore';

const DocumentUploader: React.FC = observer(() => {
  const { documentStore, uiStore } = useStores();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const isValidFileType = (fileName: string): boolean => {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    return ['pdf', 'docx', 'txt'].includes(ext);
  };

  const handleFileUpload = async (file: File) => {
    if (!isValidFileType(file.name)) {
      toast.error('PDF, DOCX, TXT 파일만 업로드할 수 있습니다.');
      return;
    }

    try {
      setIsUploading(true);
      
      // 파일 확장자 추출
      const fileExtension = file.name.toLowerCase().split('.').pop() || '';
      
      // DOCX 파일의 경우 5MB 크기 제한 적용
      if (fileExtension === 'docx' && file.size > 3 * 1024 * 1024) {
        alert('DOCX 파일은 3MB 이하만 업로드할 수 있습니다. 더 큰 파일은 여러 개의 작은 파일로 나누어 업로드해 주세요.');
        setIsUploading(false);
        return;
      }
      
      // 모든 파일에 대한 일반 크기 제한 (100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('100MB 이하의 파일만 업로드할 수 있습니다.');
        setIsUploading(false);
        return;
      }

      // Vercel Blob의 클라이언트 사이드 직접 업로드 사용
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/translate/upload/get-upload-url',
        // 최신 Vercel Blob 클라이언트에서는 onProgress 옵션이 지원되지 않을 수 있음
        // 진행률은 handleUpload API 내에서 관리됨
      });
      
      console.log('Blob 업로드 성공:', blob.url);
      
      // DocumentStore에 파일 정보 설정 및 Blob URL 저장
      await documentStore.setDocumentFile(file);
      documentStore.setBlobUrl(blob.url);
      
      // Blob URL에서 텍스트 추출
      const extractResponse = await fetch('/api/translate/document/extract-from-blob', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blobUrl: blob.url,
          fileName: file.name,
        }),
      });
      
      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || '텍스트 추출에 실패했습니다.');
      }
      
      const extractResult = await extractResponse.json();
      
      // 추출된 텍스트에 HTML 콘텐츠가 있는지 확인
      const hasHtmlContent = extractResult.textWithPages.some((page: { html?: string }) => !!page.html);
      console.log('HTML 콘텐츠 포함 여부:', hasHtmlContent);
      
      // 추출된 텍스트 설정 (HTML 콘텐츠 존재 여부 전달)
      await documentStore.setExtractedText(extractResult.textWithPages, hasHtmlContent);
      
    } catch (error) {
      console.error('파일 업로드 중 오류:', error);
      toast.error(error instanceof Error ? error.message : '파일 처리 중 문제가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 파일 타입에 따른 아이콘 반환
  const getFileIcon = (fileType: DocumentType) => {
    switch (fileType) {
      case 'pdf':
        return <PDFIcon color="error" sx={{ fontSize: 60, mb: 2 }} />;
      case 'docx':
        return <DocIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />;
      case 'txt':
        return <TxtIcon color="success" sx={{ fontSize: 60, mb: 2 }} />;
      default:
        return <UploadIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />;
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        문서 파일 업로드
      </Typography>
      
      <Box sx={{ display: 'flex', mb: 2 }}>
        <Chip 
          label="PDF" 
          color="error" 
          variant="outlined" 
          sx={{ mr: 1 }} 
        />
        <Chip 
          label="DOCX" 
          color="primary" 
          variant="outlined" 
          sx={{ mr: 1 }} 
        />
        <Chip 
          label="TXT" 
          color="success" 
          variant="outlined" 
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px dashed ${isDragging ? '#2196f3' : '#cccccc'}`,
          borderRadius: 2,
          p: 6,
          mt: 3,
          width: '100%',
          height: '300px',
          bgcolor: isDragging ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
          transition: 'all 0.3s',
          cursor: 'pointer',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        {isUploading ? (
          <>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="body1">파일 처리 중...</Typography>
            <LinearProgress sx={{ width: '80%', mt: 3 }} />
          </>
        ) : (
          <>
            {documentStore.documentFile ? (
              <>
                {getFileIcon(documentStore.documentType)}
                <Typography variant="h6">{documentStore.documentName}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {(documentStore.documentSize / (1024 * 1024)).toFixed(2)} MB
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  타입: {documentStore.documentType.toUpperCase()}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2, mr: 1 }}
                  onClick={e => {
                    e.stopPropagation();
                    triggerFileInput();
                  }}
                >
                  다른 파일 선택
                </Button>
              </>
            ) : (
              <>
                <UploadIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="body1">
                  문서 파일을 이곳에 끌어다 놓거나 클릭하여 업로드
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  지원 형식: PDF, DOCX, TXT
                </Typography>
              </>
            )}
          </>
        )}
      </Box>

      <Button
        variant="contained"
        color="success"
        size="large"
        sx={{ mt: 3 }}
        onClick={() => uiStore.nextStep()}
        disabled={!documentStore.documentFile || documentStore.isAnalyzingHtml}
      >
        {documentStore.isAnalyzingHtml ? '문서 분석 중...' : '번역 시작'}
      </Button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.txt"
        style={{ display: 'none' }}
      />
    </Paper>
  );
});

export default DocumentUploader;
