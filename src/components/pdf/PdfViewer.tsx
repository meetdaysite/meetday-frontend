'use client';
import { useState, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
    url: string;
}

export default function PdfViewer({ url }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [containerWidth, setContainerWidth] = useState<number>(0);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const containerRef = useMemo(() => {
        return (el: HTMLDivElement | null) => {
            if (el) {
                const observer = new ResizeObserver((entries) => {
                    if (entries[0]) {
                        const { width } = entries[0].contentRect;
                        setContainerWidth(width);
                    }
                });
                observer.observe(el);
            }
        };
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center relative overflow-hidden" ref={containerRef}>
            <div className="w-full flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center bg-slate-50/50 relative">
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex flex-col items-center gap-6 py-6 w-full"
                    loading={
                        <div className="flex h-full w-full min-h-[300px] items-center justify-center text-sm font-semibold text-black/40">
                            Loading PDF document...
                        </div>
                    }
                    error={
                        <div className="flex h-[300px] w-full flex-col items-center justify-center gap-2 text-sm font-semibold text-black/60">
                            <span className="text-xl">⚠️</span>
                            Failed to load PDF.
                        </div>
                    }
                >
                    {Array.from(new Array(numPages), (el, index) => (
                        <div key={`page_${index + 1}`} className="shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] border-[2px] border-black/30 rounded-xl overflow-hidden bg-white mx-2 sm:mx-4 max-w-full">
                            <Page
                                pageNumber={index + 1}
                                width={containerWidth > 0 ? Math.max(containerWidth - (containerWidth < 640 ? 20 : 48), 240) : undefined}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                loading={<div className="h-[300px] sm:h-[400px] w-full bg-slate-100 animate-pulse" />}
                            />
                        </div>
                    ))}
                </Document>
            </div>
            
            {numPages > 0 && (
                <div className="w-full py-2.5 bg-white border-t-2 border-black/10 flex flex-col items-center justify-center shrink-0 shadow-sm z-10">
                    <p className="text-[10px] font-black text-black/40 uppercase tracking-wider">
                        {numPages} Page{numPages !== 1 ? 's' : ''} Document
                    </p>
                </div>
            )}
        </div>
    );
}
