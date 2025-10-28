
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { DownloadIcon, SparklesIcon, XCircleIcon } from './components/icons';
import { generateSubtitles } from './services/geminiService';
import type { SubtitleBlock } from './types';

const App: React.FC = () => {
  const [textFile, setTextFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [srtContent, setSrtContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const handleTextFileChange = (file: File | null) => {
    setTextFile(file);
    setSrtContent('');
    setError(null);
  };

  const handleAudioFileChange = (file: File | null) => {
    setAudioFile(file);
    setSrtContent('');
    setError(null);
  };

  const fileToText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [header, data] = result.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || file.type;
        resolve({ mimeType, data });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleGenerateClick = useCallback(async () => {
    if (!textFile || !audioFile) return;

    setIsLoading(true);
    setError(null);
    setSrtContent('');
    setProgress(0);
    setLoadingMessage('Preparing files...');

    try {
      setProgress(10);
      const transcript = await fileToText(textFile);

      setLoadingMessage('Uploading and analyzing audio...');
      setProgress(30);
      const audioData = await fileToBase64(audioFile);

      setLoadingMessage('Generating synchronized subtitles...');
      setProgress(50);

      const onProgress = (block: SubtitleBlock) => {
        const srtBlock = `${block.id}\n${block.startTime} --> ${block.endTime}\n${block.text}\n\n`;
        setSrtContent((prev) => prev + srtBlock);
      };

      await generateSubtitles(transcript, audioData, onProgress);

      setLoadingMessage('Subtitles generated successfully!');
      setProgress(100);

      setTimeout(() => {
        setIsLoading(false);
        setLoadingMessage('');
        setProgress(0);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(
        'Failed to generate subtitles. Please check the files and try again.'
      );
      setIsLoading(false);
      setLoadingMessage('');
      setProgress(0);
    }
  }, [textFile, audioFile]);

  const handleDownloadClick = () => {
    if (!srtContent) return;
    const blob = new Blob([srtContent.trim()], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${
      audioFile?.name.replace(/\.[^/.]+$/, '') || 'subtitles'
    }.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canGenerate = textFile && audioFile && !isLoading;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto flex flex-col flex-grow">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            AI Subtitle Synchronizer
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Generate perfectly timed subtitles from audio and text.
          </p>
        </header>

        <main className="flex-grow bg-gray-800/50 rounded-2xl shadow-2xl shadow-indigo-500/10 p-6 sm:p-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <FileUpload
              id="text-file"
              label="Transcript File"
              accept=".txt"
              onFileChange={handleTextFileChange}
              fileType="text"
            />
            <FileUpload
              id="audio-file"
              label="Audio File"
              accept=".mp3"
              onFileChange={handleAudioFileChange}
              fileType="audio"
            />
          </div>

          {error && (
            <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center">
              <XCircleIcon className="w-5 h-5 mr-3" />
              <span>{error}</span>
            </div>
          )}

          {(isLoading || srtContent) && (
            <div className="mt-8">
              {isLoading && (
                <div className="text-center p-4 mb-4">
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                    <div
                      className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-indigo-300 font-medium">
                    {loadingMessage}{' '}
                    {progress > 0 && progress < 100 && `(${progress}%)`}
                  </p>
                  {progress < 100 && (
                    <p className="text-sm text-gray-400">
                      This may take a moment...
                    </p>
                  )}
                </div>
              )}

              {srtContent && (
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-gray-200">
                    {isLoading
                      ? 'Generating Subtitles...'
                      : 'Generated Subtitles Preview'}
                  </h2>
                  <textarea
                    readOnly
                    value={srtContent}
                    className="w-full h-64 p-4 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {!isLoading && (
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={handleDownloadClick}
                        className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105"
                      >
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Download .srt File
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
        
        <div className="sticky bottom-0 left-0 right-0 w-full p-4 mt-auto bg-gray-900/80 backdrop-blur-sm md:static md:bg-transparent md:p-0 md:mt-8">
           <div className="max-w-4xl mx-auto">
             <button
                onClick={handleGenerateClick}
                disabled={!canGenerate}
                className="w-full flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed disabled:text-gray-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105 disabled:scale-100 text-lg"
              >
                <SparklesIcon className="w-6 h-6 mr-3" />
                Generate Subtitles
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;
