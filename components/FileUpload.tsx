
import React, { useState, useRef } from 'react';
import { FileTextIcon, MusicIcon, UploadCloudIcon, XIcon } from './icons';

interface FileUploadProps {
  id: string;
  label: string;
  accept: string;
  onFileChange: (file: File | null) => void;
  fileType: 'text' | 'audio';
}

export const FileUpload: React.FC<FileUploadProps> = ({ id, label, accept, onFileChange, fileType }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      onFileChange(selectedFile);
    }
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };
  
  const handleClearFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setFile(null);
    onFileChange(null);
    if(inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const Icon = fileType === 'text' ? FileTextIcon : MusicIcon;

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      {file ? (
        <div className="flex items-center justify-between p-3 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg">
          <div className="flex items-center overflow-hidden">
            <Icon className="w-6 h-6 mr-3 text-indigo-400 flex-shrink-0" />
            <span className="truncate text-gray-200">{file.name}</span>
          </div>
          <button onClick={handleClearFile} className="ml-2 p-1 text-gray-400 hover:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-indigo-500">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={`relative flex flex-col items-center justify-center w-full h-32 px-4 transition bg-gray-700 border-2 border-dashed rounded-lg appearance-none cursor-pointer hover:border-indigo-400 focus:outline-none ${isDragging ? 'border-indigo-400' : 'border-gray-600'}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloudIcon className="w-10 h-10 mb-3 text-gray-500"/>
            <p className="mb-2 text-sm text-center text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-500">{accept.toUpperCase()} file</p>
          </div>
          <input
            ref={inputRef}
            id={id}
            name={id}
            type="file"
            accept={accept}
            onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
      )}
    </div>
  );
};
