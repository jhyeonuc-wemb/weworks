"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Download, Trash2, FileText, File, Image, FileSpreadsheet, Paperclip } from "lucide-react";
import { useToast } from "./Toast";
import { cn } from "@/lib/utils";
import { isBlockedFile } from "@/lib/utils/file-security";

interface Attachment {
    id: number;
    fileName: string;
    filePath: string;
    fileSize: number | null;
    mimeType: string | null;
    uploadedByName: string | null;
    createdAt: string;
}

interface AttachmentSectionProps {
    entityType: string;   // 'contract' | 'vrb' | 'profitability' | 'settlement' | 'md'
    entityId: number;
    readonly?: boolean;
    hideUpload?: boolean;
    className?: string;
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FileIcon({ mimeType, className }: { mimeType: string | null; className?: string }) {
    const cls = cn("h-4 w-4 shrink-0", className);
    if (!mimeType) return <File className={cls} />;
    if (mimeType.startsWith("image/")) return <Image className={cls} />;
    if (mimeType.includes("pdf")) return <FileText className={cls} />;
    if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType.includes("csv"))
        return <FileSpreadsheet className={cls} />;
    if (mimeType.includes("word") || mimeType.includes("document")) return <FileText className={cls} />;
    return <File className={cls} />;
}

export function AttachmentSection({ entityType, entityId, readonly = false, hideUpload = false, className }: AttachmentSectionProps) {
    const { showToast, confirm } = useToast();
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchAttachments = useCallback(async () => {
        try {
            const res = await fetch(`/api/attachments?entityType=${entityType}&entityId=${entityId}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setAttachments(data.attachments || []);
        } catch {
            showToast("첨부파일 목록 조회에 실패했습니다.", "error");
        } finally {
            setLoading(false);
        }
    }, [entityType, entityId]);

    useEffect(() => { fetchAttachments(); }, [fetchAttachments]);

    const uploadFiles = async (files: FileList | File[]) => {
        if (!files || files.length === 0) return;

        const allFiles = Array.from(files);

        // 클라이언트 사전 차단
        const blockedFiles = allFiles.filter(f => isBlockedFile(f.name));
        const allowedFiles = allFiles.filter(f => !isBlockedFile(f.name));

        if (blockedFiles.length > 0) {
            const names = blockedFiles.map(f => f.name).join(", ");
            showToast(
                `업로드 차단: ${names} (보안 위험 파일)`,
                "error"
            );
        }
        if (allowedFiles.length === 0) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("entityType", entityType);
            formData.append("entityId", String(entityId));
            allowedFiles.forEach(f => formData.append("files", f));

            const res = await fetch("/api/attachments", { method: "POST", body: formData });
            if (!res.ok) throw new Error();
            const data = await res.json();
            showToast(`${data.attachments.length}개 파일이 업로드되었습니다.`, "success");
            await fetchAttachments();
        } catch {
            showToast("업로드에 실패했습니다.", "error");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = (attachment: Attachment) => {
        confirm({
            title: "파일 삭제",
            message: `"${attachment.fileName}"을(를) 삭제하시겠습니까?`,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/attachments/${attachment.id}`, { method: "DELETE" });
                    if (!res.ok) throw new Error();
                    showToast("삭제되었습니다.", "success");
                    setAttachments(prev => prev.filter(a => a.id !== attachment.id));
                } catch {
                    showToast("삭제에 실패했습니다.", "error");
                }
            },
        });
    };

    const handleDownload = (attachment: Attachment) => {
        window.open(`/api/attachments/${attachment.id}`, "_blank");
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (readonly) return;
        uploadFiles(e.dataTransfer.files);
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* 섹션 헤더 */}
            <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    첨부파일
                    {attachments.length > 0 && (
                        <span className="ml-1 text-sm font-medium text-gray-400">({attachments.length})</span>
                    )}
                </h4>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={e => e.target.files && uploadFiles(e.target.files)}
                />
            </div>

            {/* 드래그앤드롭 영역 (읽기전용 아닐 때만) */}
            {!readonly && (
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
                        dragOver
                            ? "border-primary bg-primary/5 scale-[1.01]"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                >
                    <Upload className={cn("h-8 w-8 mx-auto mb-2 transition-colors", dragOver ? "text-primary" : "text-gray-300")} />
                    <p className="text-sm text-gray-400">
                        파일을 드래그하거나 <span className="text-primary font-medium">클릭</span>하여 업로드
                    </p>
                    <p className="text-xs text-gray-300 mt-1">여러 파일 동시 업로드 가능</p>
                </div>
            )}

            {/* 파일 목록 */}
            {loading ? (
                <div className="flex items-center justify-center py-6 text-sm text-gray-400">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                    불러오는 중...
                </div>
            ) : attachments.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">
                    {readonly ? "첨부된 파일이 없습니다." : "업로드된 파일이 없습니다."}
                </div>
            ) : (
                <div className="space-y-2">
                    {attachments.map(att => (
                        <div
                            key={att.id}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 hover:bg-slate-100 transition-colors group"
                        >
                            <FileIcon mimeType={att.mimeType} className="text-gray-400" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{att.fileName}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {formatFileSize(att.fileSize)}
                                    {att.uploadedByName && ` · ${att.uploadedByName}`}
                                    {att.createdAt && ` · ${new Date(att.createdAt).toLocaleDateString("ko-KR")}`}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDownload(att)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    title="다운로드"
                                >
                                    <Download className="h-4 w-4" />
                                </button>
                                {!readonly && (
                                    <button
                                        onClick={() => handleDelete(att)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        title="삭제"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
