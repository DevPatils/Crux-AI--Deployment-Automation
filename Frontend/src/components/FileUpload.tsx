import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from './useToast';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onUpload: (file: File, avatar?: File) => Promise<void>;
  isUploading: boolean;
  isAuthenticated?: boolean;
  className?: string;
  showAvatarUpload?: boolean;
  templateName?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  onUpload, 
  isUploading, 
  isAuthenticated = false,
  className = "",
  showAvatarUpload = false,
  templateName = ""
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileSelect = (selectedFile: File) => {
    if (!isAuthenticated) {
      toast.push('Please sign in to upload your resume.', { type: 'warning' });
      return;
    }
    
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf'))) {
      setFile(selectedFile);
      onFileSelect(selectedFile);
    } else {
      toast.push('Please select a PDF file', { type: 'error' });
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

  const handleAvatarSelect = (selectedFile: File) => {
    if (!isAuthenticated) {
      toast.push('Please sign in to upload your avatar.', { type: 'warning' });
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (selectedFile && allowedTypes.includes(selectedFile.type)) {
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.push('Avatar file size must be less than 5MB', { type: 'error' });
        return;
      }
      setAvatar(selectedFile);
    } else {
      toast.push('Please select a valid image file (JPEG, PNG, or WebP)', { type: 'error' });
    }
  };

  const handleAvatarInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleAvatarSelect(selectedFile);
    }
  };

  const handleUploadClick = async () => {
    if (file) {
      await onUpload(file, avatar || undefined);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    // Also clear avatar when resume is removed
    setAvatar(null);
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
  };

  return (
    <div className={`w-full max-w-xl mx-auto ${className}`}>
      <div className="relative">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-lg">
          
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 text-center transition-all duration-300 ${
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
              <div className="space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-400 rounded-lg flex items-center justify-center mx-auto shadow-sm">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                    Please sign in to upload
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:space-y-0 justify-center">
                    <Link
                      to="/signin"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-300 text-center text-sm sm:text-base"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-300 border border-gray-300 text-center text-sm sm:text-base"
                    >
                      Sign Up
                    </Link>
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm mt-3">
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

          {/* Avatar Upload Section - Only show for modern-professional template and after resume is selected */}
          {showAvatarUpload && file && isAuthenticated && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-semibold text-blue-800">Profile Picture (Optional)</h3>
              </div>
              <p className="text-xs text-blue-700 mb-3">
                Add a profile picture to personalize your {templateName} portfolio
              </p>
              
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarInputChange}
                className="hidden"
              />
              
              {avatar ? (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{avatar.name}</p>
                      <p className="text-xs text-gray-500">{(avatar.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveAvatar}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-full p-3 border-2 border-dashed border-blue-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-100 transition-colors"
                >
                  <div className="space-y-1">
                    <svg className="w-6 h-6 text-blue-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-sm text-blue-700">Click to select profile picture</p>
                    <p className="text-xs text-blue-600">JPEG, PNG, WebP (max 5MB)</p>
                  </div>
                </button>
              )}
            </div>
          )}

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
