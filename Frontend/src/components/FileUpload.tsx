import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  isAuthenticated?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  onUpload, 
  isUploading, 
  isAuthenticated = false,
  className = "" 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!isAuthenticated) {
      alert('Please sign in to upload your resume.');
      return;
    }
    
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf'))) {
      setFile(selectedFile);
      onFileSelect(selectedFile);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUploadClick = async () => {
    if (file) {
      await onUpload(file);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  return (
    <div className={`w-full max-w-xl mx-auto ${className}`}>
      <div className="relative">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
          
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
              !isAuthenticated
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : isDragging
                ? 'border-blue-400 bg-blue-50'
                : file
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
            }`}
            onDrop={isAuthenticated ? handleDrop : undefined}
            onDragOver={isAuthenticated ? handleDragOver : undefined}
            onDragLeave={isAuthenticated ? handleDragLeave : undefined}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!isAuthenticated ? (
              // Not authenticated - show sign-in prompt
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center mx-auto shadow-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-600 mb-2">
                    Please sign in to upload
                  </p>
                  <div className="space-y-2">
                    <Link
                      to="/signin"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-300 mr-2"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-300 border border-gray-300"
                    >
                      Sign Up
                    </Link>
                  </div>
                  <p className="text-gray-500 text-xs mt-3">
                    Create an account to start building your portfolio
                  </p>
                </div>
              </div>
            ) : file ? (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto shadow-sm">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-green-600">File Selected!</p>
                  <p className="text-gray-700 text-sm mt-1">{file.name}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto shadow-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800 mb-2">
                    Drop your resume here or
                  </p>
                  <button
                    onClick={() => isAuthenticated && fileInputRef.current?.click()}
                    disabled={!isAuthenticated}
                    className={`font-semibold underline transition-colors duration-300 ${
                      isAuthenticated 
                        ? 'text-blue-600 hover:text-blue-700 cursor-pointer' 
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    browse files
                  </button>
                  <p className="text-gray-500 text-xs mt-2">
                    Supports PDF files up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {file && (
                <button
                  onClick={handleRemoveFile}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-300 border border-gray-300"
                >
                  Remove File
                </button>
              )}
              
              <button
                onClick={handleUploadClick}
                disabled={!file || isUploading}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  file && !isUploading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Portfolio...</span>
                  </div>
                ) : (
                  'Generate Portfolio'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
