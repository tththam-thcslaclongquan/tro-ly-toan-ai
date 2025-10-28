import React from 'react';
import type { Grade, HintLevel, Mode } from '../types';
import { Upload, Lightbulb, RefreshCw, Mail, Zalo, XCircle } from './icons';

interface InputPanelProps {
  grade: Grade;
  setGrade: React.Dispatch<React.SetStateAction<Grade>>;
  level: HintLevel;
  setLevel: React.Dispatch<React.SetStateAction<HintLevel>>;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  problem: string;
  setProblem: React.Dispatch<React.SetStateAction<string>>;
  studentStep: string;
  setStudentStep: React.Dispatch<React.SetStateAction<string>>;
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  setImageMimeTypes: React.Dispatch<React.SetStateAction<string[]>>;
  imageMimeTypes: string[];
  studentImages: string[];
  setStudentImages: React.Dispatch<React.SetStateAction<string[]>>;
  studentImageMimeTypes: string[];
  setStudentImageMimeTypes: React.Dispatch<React.SetStateAction<string[]>>;
  onAsk: () => void;
  onClear: () => void;
  isLoading: boolean;
  isProblemActive: boolean;
}

const compressAndEncodeImage = (file: File): Promise<{ base64Data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const base64Data = dataUrl.split(',')[1];
        resolve({ base64Data, mimeType: 'image/jpeg' });
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


export const InputPanel: React.FC<InputPanelProps> = ({
  grade, setGrade, level, setLevel, mode, setMode,
  problem, setProblem, studentStep, setStudentStep,
  images, setImages, setImageMimeTypes, imageMimeTypes,
  studentImages, setStudentImages, studentImageMimeTypes, setStudentImageMimeTypes,
  onAsk, onClear, isLoading, isProblemActive
}) => {
  const MAX_IMAGES = 3;
  const MAX_STUDENT_IMAGES = 2;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > MAX_IMAGES) {
      alert(`Chỉ có thể tải lên tối đa ${MAX_IMAGES} ảnh cho một đề bài.`);
      e.target.value = '';
      return;
    }

    const filePromises = Array.from(files).map(compressAndEncodeImage);

    Promise.all(filePromises).then(results => {
      setImages(prev => [...prev, ...results.map(r => r.base64Data)]);
      setImageMimeTypes(prev => [...prev, ...results.map(r => r.mimeType)]);
    }).catch(error => console.error("Error processing files:", error));
    
    e.target.value = '';
  };
  
  const handleStudentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (studentImages.length + files.length > MAX_STUDENT_IMAGES) {
      alert(`Chỉ có thể tải lên tối đa ${MAX_STUDENT_IMAGES} ảnh cho câu trả lời.`);
      e.target.value = '';
      return;
    }
    
    const filePromises = Array.from(files).map(compressAndEncodeImage);

    Promise.all(filePromises).then(results => {
      setStudentImages(prev => [...prev, ...results.map(r => r.base64Data)]);
      setStudentImageMimeTypes(prev => [...prev, ...results.map(r => r.mimeType)]);
    }).catch(error => console.error("Error processing student files:", error));
    
    e.target.value = '';
  };


  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (isProblemActive) return;
    if (e.clipboardData.files.length > 0) {
      if (images.length >= MAX_IMAGES) {
        alert(`Chỉ có thể dán tối đa ${MAX_IMAGES} ảnh.`);
        e.preventDefault();
        return;
      }
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        compressAndEncodeImage(file)
          .then(result => {
            setImages(prev => [...prev, result.base64Data]);
            setImageMimeTypes(prev => [...prev, result.mimeType]);
          })
          .catch(error => console.error("Error processing pasted file:", error));
      }
    }
  };

  const handleStudentPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files.length > 0) {
      if (studentImages.length >= MAX_STUDENT_IMAGES) {
        alert(`Chỉ có thể dán tối đa ${MAX_STUDENT_IMAGES} ảnh cho câu trả lời.`);
        e.preventDefault();
        return;
      }
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        compressAndEncodeImage(file)
          .then(result => {
            setStudentImages(prev => [...prev, result.base64Data]);
            setStudentImageMimeTypes(prev => [...prev, result.mimeType]);
          })
          .catch(error => console.error("Error processing pasted student file:", error));
      }
    }
  };


  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    setImageMimeTypes(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const removeStudentImage = (indexToRemove: number) => {
    setStudentImages(prev => prev.filter((_, index) => index !== indexToRemove));
    setStudentImageMimeTypes(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  return (
    <section className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg flex flex-col h-fit space-y-6">
      <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nhập đề & Cấu hình</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="grade" className="block text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">Khối lớp</label>
          <select id="grade" value={grade} onChange={(e) => setGrade(e.target.value as Grade)} disabled={isLoading} className="w-full p-2.5 text-base border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed">
            <option value="6">Lớp 6</option>
            <option value="7">Lớp 7</option>
            <option value="8">Lớp 8</option>
            <option value="9">Lớp 9</option>
          </select>
        </div>
        <div>
          <label htmlFor="level" className="block text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">Mức gợi ý</label>
          <select id="level" value={level} onChange={(e) => setLevel(e.target.value as HintLevel)} disabled={isLoading} className="w-full p-2.5 text-base border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed">
            <option value="light">Gợi nhẹ (Socratic)</option>
            <option value="step">Hướng dẫn từng bước</option>
            <option value="outline">Dàn ý (ẩn đáp số)</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="problem" className="block text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">Đề toán (nhập tay/dán ảnh)</label>
        <textarea id="problem" value={problem} onChange={(e) => setProblem(e.target.value)} onPaste={handlePaste} disabled={isProblemActive || isLoading} placeholder="Nhập đề bài hoặc dán (Ctrl+V) ảnh đề vào đây..." rows={5} className="w-full p-3 text-base border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-slate-200 min-h-[120px] focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed"></textarea>
        <div className="mt-3">
            <label className={`inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 ${isProblemActive || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer'}`}>
                <Upload className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                <span className="text-base font-semibold text-slate-700 dark:text-slate-200">Chọn ảnh</span>
                <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} multiple disabled={isProblemActive || isLoading} />
            </label>
        </div>
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <img src={`data:${imageMimeTypes[index]};base64,${img}`} alt={`Xem trước đề ${index + 1}`} className="w-full h-auto object-cover aspect-square rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm" />
                <button
                    onClick={() => removeImage(index)}
                    disabled={isProblemActive || isLoading}
                    className="absolute top-1.5 right-1.5 bg-black/50 rounded-full p-1 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity opacity-0 group-hover:opacity-100"
                    aria-label={`Xoá ảnh ${index + 1}`}
                >
                    <XCircle className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="studentStep" className="block text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">Phản hồi/câu trả lời của học sinh</label>
        <textarea id="studentStep" value={studentStep} onChange={(e) => setStudentStep(e.target.value)} onPaste={handleStudentPaste} placeholder="Nhập câu trả lời hoặc dán ảnh bài làm của em vào đây..." rows={5} className="w-full p-3 text-base border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-slate-200 min-h-[120px] focus:ring-2 focus:ring-blue-500"></textarea>
         <div className="mt-3">
            <label className={`inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer`}>
                <Upload className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                <span className="text-base font-semibold text-slate-700 dark:text-slate-200">Đính kèm ảnh</span>
                <input id="student-image-upload" type="file" accept="image/*" className="hidden" onChange={handleStudentImageChange} multiple />
            </label>
        </div>
        {studentImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {studentImages.map((img, index) => (
                    <div key={index} className="relative group">
                        <img src={`data:${studentImageMimeTypes[index]};base64,${img}`} alt={`Bài làm của học sinh ${index + 1}`} className="w-full h-auto object-cover aspect-square rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm" />
                        <button
                            onClick={() => removeStudentImage(index)}
                            className="absolute top-1.5 right-1.5 bg-black/50 rounded-full p-1 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-opacity opacity-0 group-hover:opacity-100"
                            aria-label={`Xoá ảnh bài làm ${index + 1}`}
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>
      
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
        {isProblemActive && (
          <div className="text-base text-center text-slate-600 dark:text-slate-300 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
            Bài toán đang được giải quyết.{" "}
            <button onClick={onClear} className="text-blue-600 dark:text-blue-400 font-bold underline inline-flex items-center gap-1.5 hover:text-blue-800 dark:hover:text-blue-300">
                <RefreshCw className="w-4 h-4" />
                Bắt đầu lại
            </button>
            {" "}để nhập bài mới.
          </div>
        )}
        <button onClick={onAsk} disabled={isLoading} className="w-full flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-lg text-white bg-blue-600 dark:bg-blue-900 hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200">
            <Lightbulb className="w-5 h-5"/> Lấy gợi ý
        </button>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 text-center">
        <h3 className="text-base font-bold text-slate-600 dark:text-slate-300 mb-4">Cần tư vấn 1:1 với giáo viên?</h3>
        <div className="flex flex-col sm:flex-row gap-3">
            <a href="mailto:tththam.thcsllquan@gmail.com?subject=Tư vấn toán THCS&body=Tên em là: %0D%0ALớp: %0D%0A%0D%0ANội dung cần tư vấn:%0D%0A" target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-200">
                <Mail className="w-5 h-5" /> Gửi email
            </a>
            <a href="https://zalo.me/0918894498" target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-lg text-white bg-blue-600 dark:bg-blue-900 hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors duration-200">
                <Zalo className="w-5 h-5" /> Chat Zalo
            </a>
        </div>
      </div>

    </section>
  );
};
