"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, FileImage, FileText } from "lucide-react";

interface FileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
}

export default function FileUpload({ files, onChange }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<(string | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // プレビュー生成
  useEffect(() => {
    const urls: (string | null)[] = [];
    const objectUrls: string[] = [];

    files.forEach((f) => {
      if (f.type.startsWith("image/")) {
        const url = URL.createObjectURL(f);
        objectUrls.push(url);
        urls.push(url);
      } else {
        urls.push(null);
      }
    });

    setPreviews(urls);

    return () => {
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const arr = Array.from(newFiles).filter(
      (f) => f.type.startsWith("image/") || f.type === "application/pdf"
    );
    onChange([...files, ...arr]);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      {/* ドロップゾーン */}
      <div
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-primary bg-primary-light scale-[1.01]"
            : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-500">
          スクショやPDFをドラッグ＆ドロップ
        </p>
        <p className="text-xs text-muted mt-1">
          またはクリックしてファイルを選択
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* 選択済みファイル一覧（サムネイル付き） */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, i) => {
            const isImage = file.type.startsWith("image/");
            return (
              <div
                key={i}
                className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2 border border-border"
              >
                {/* サムネイル or アイコン */}
                {isImage && previews[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previews[i]!}
                    alt={file.name}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                    {file.type === "application/pdf" ? (
                      <FileText className="w-5 h-5 text-red-400" />
                    ) : (
                      <FileImage className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-muted">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="text-gray-400 hover:text-red-500 shrink-0 p-1 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
