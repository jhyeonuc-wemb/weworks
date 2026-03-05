/**
 * 파일 첨부 보안 필터
 * 클라이언트(AttachmentSection)와 서버(API) 양쪽에서 공유 사용
 */

// 실행 가능하거나 보안 위험이 있는 차단 확장자 목록
export const BLOCKED_EXTENSIONS = new Set([
    // 실행 파일
    "exe", "bat", "cmd", "com", "msi", "msp", "mst",
    // 스크립트
    "ps1", "psm1", "psd1", "vbs", "vbe", "js", "jse", "wsf", "wsh",
    "sh", "bash", "zsh", "fish",
    // 시스템/코드
    "dll", "sys", "drv", "ocx", "cpl",
    "scr", "pif", "reg",
    // 웹 실행
    "php", "php3", "php4", "php5", "phtml", "asp", "aspx", "jsp",
    "cgi", "pl", "py", "rb",
    // 기타
    "jar", "class", "swf", "lnk", "url", "scf",
    "iso", "img",
]);

export function isBlockedFile(fileName: string): boolean {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext) return false;
    return BLOCKED_EXTENSIONS.has(ext);
}

export function getBlockedReason(fileName: string): string | null {
    if (isBlockedFile(fileName)) {
        const ext = fileName.split(".").pop()?.toLowerCase();
        return `보안상 .${ext} 파일은 업로드할 수 없습니다.`;
    }
    return null;
}
