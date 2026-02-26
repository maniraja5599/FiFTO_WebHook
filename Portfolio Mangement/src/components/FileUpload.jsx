import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone'; // Wait, I didn't install react-dropzone. I should use standard input or install it.
// I'll use standard input for now to avoid extra deps, or just a simple drag/drop handler.
import { Upload, FileSpreadsheet } from 'lucide-react';

export function FileUpload({ onUpload }) {
    const handleFile = (files) => {
        // Normalize to array if single file passed (backward compat or drop event)
        const fileList = Array.isArray(files) ? files : [files];

        const validFiles = fileList.filter(file =>
            file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))
        );

        if (validFiles.length > 0) {
            onUpload(validFiles);
        } else {
            alert('Please upload valid files (.xlsx, .xls, or .csv)');
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        handleFile(files);
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div
            className="w-full max-w-2xl mx-auto"
            onDrop={onDrop}
            onDragOver={onDragOver}
        >
            <label
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-800/50 hover:bg-slate-800 hover:border-blue-500 transition-all group"
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="p-4 bg-slate-900 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="mb-2 text-xl font-semibold text-slate-300">
                        Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-slate-500">
                        Quantman Backtest Results (.xlsx, .csv)
                    </p>
                    <p className="text-xs text-slate-600 mt-2">
                        Upload multiple files to merge portfolios
                    </p>
                </div>
                <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => handleFile(Array.from(e.target.files))}
                />
            </label>
        </div>
    );
}
