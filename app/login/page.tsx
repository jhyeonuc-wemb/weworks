"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Eye, EyeOff, Lock, User, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 비밀번호 변경 모달 상태
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      showToast("아이디와 비밀번호를 입력해주세요.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.user.must_change_password) {
          setShowChangePassword(true);
          showToast("보안을 위해 비밀번호를 변경해주세요.", "info");
        } else {
          showToast("환영합니다!", "success");
          router.push("/");
          router.refresh();
        }
      } else {
        showToast(data.error || "로그인 실패", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("로그인 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("새 비밀번호가 일치하지 않습니다.", "error");
      return;
    }

    // NIST SP 800-63B 기반 규칙 적용

    // 1. 길이: 최소 8자 이상
    if (newPassword.length < 8) {
      showToast("비밀번호는 최소 8자 이상이어야 합니다.", "error");
      return;
    }

    // 2. 최대 길이 제한 (NIST는 긴 비밀번호 권장, 64자까지 허용)
    if (newPassword.length > 64) {
      showToast("비밀번호는 64자 이하여야 합니다.", "error");
      return;
    }

    // 3. 문맥 정보(아이디) 포함 금지
    if (newPassword.includes(username)) {
      showToast("비밀번호에 아이디를 포함할 수 없습니다.", "error");
      return;
    }

    // 4. 숫자로만 구성된 비밀번호 금지
    if (/^\d+$/.test(newPassword)) {
      showToast("숫자로만 구성된 비밀번호는 사용할 수 없습니다.", "error");
      return;
    }

    // 5. 기존 비밀번호와 동일 금지
    if (newPassword === password) {
      showToast("기존 비밀번호와 동일하게 설정할 수 없습니다.", "error");
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 현재 비밀번호는 로그인 시 사용한 password (세션에 저장된 id 사용)
        body: JSON.stringify({ currentPassword: password, newPassword }),
      });

      if (res.ok) {
        showToast("비밀번호가 변경되었습니다.", "success");
        setShowChangePassword(false);
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        showToast(data.error || "비밀번호 변경 실패", "error");
      }
    } catch (err) {
      showToast("오류 발생", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center gap-4">
            {/* 회사 CI */}
            <img src="/wemb_ci.png" alt="WEMB CI" className="h-14 w-auto" />

            {/* 시스템 타이틀 */}
            <p className="text-xl font-bold text-gray-900 tracking-tight font-sans">
              프로젝트 통합 관리 시스템
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2rem] p-10 shadow-2xl border border-gray-100 ring-4 ring-gray-50/50">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-500 uppercase ml-1">ID</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-6 w-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 text-lg bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
                    placeholder="아이디를 입력하세요"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-500 uppercase ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-6 w-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-3.5 text-lg bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
                    placeholder="비밀번호를 입력하세요"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-6 text-lg rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>로그인</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 font-medium">
          초기 비밀번호는 아이디와 동일합니다.
        </p>
      </div>

      {/* Password Change Modal - Non-dismissible */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 ring-4 ring-blue-500/20">
            <div className="text-center mb-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 mb-6">
                <ShieldCheck className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">비밀번호 변경 필요</h2>
              <p className="text-base text-gray-500 mt-3 leading-relaxed">
                NIST SP 800-63B 보안 가이드라인에 따라<br />
                <span className="font-bold text-blue-600">최소 8자 이상</span>의 비밀번호 설정이 필요합니다.<br />
                <span className="text-xs text-gray-400 font-normal mt-1 block">(복잡한 특수문자 강제 없음, 긴 비밀번호 권장)</span>
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-bold text-gray-500 uppercase">새로운 비밀번호</label>
                    <div className="group relative">
                      <HelpCircle className="h-4 w-4 text-gray-300 cursor-help hover:text-blue-500 transition-colors" />
                      <div className="absolute right-0 bottom-full mb-3 w-64 p-4 bg-gray-900 text-white text-[11px] rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl pointer-events-none ring-1 ring-white/10 text-left">
                        <p className="font-bold border-b border-white/10 pb-2 mb-2 text-blue-400 flex items-center gap-2">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          비밀번호 설정 규칙 (6가지)
                        </p>
                        <ul className="space-y-2 opacity-90 font-medium whitespace-normal">
                          <li className="flex gap-2 text-left">
                            <span className="text-blue-400 font-bold">1.</span>
                            <span>최소 8자 이상의 길이 (NIST 표준)</span>
                          </li>
                          <li className="flex gap-2 text-left">
                            <span className="text-blue-400 font-bold">2.</span>
                            <span>최대 64자 이하의 길이 (권장)</span>
                          </li>
                          <li className="flex gap-2 text-left">
                            <span className="text-blue-400 font-bold">3.</span>
                            <span>아이디(계정명)를 포함하지 않음</span>
                          </li>
                          <li className="flex gap-2 text-left">
                            <span className="text-blue-400 font-bold">4.</span>
                            <span>숫자로만 구성된 비밀번호 사용 불가</span>
                          </li>
                          <li className="flex gap-2 text-left">
                            <span className="text-blue-400 font-bold">5.</span>
                            <span>현재 비밀번호와 다르게 설정</span>
                          </li>
                          <li className="flex gap-2 text-left">
                            <span className="text-blue-400 font-bold">6.</span>
                            <span>영문/숫자/특수문자 조합 권장 (보안)</span>
                          </li>
                        </ul>
                        <div className="absolute top-full right-1 translate-x-[-10px] border-8 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full px-5 py-3.5 text-lg bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
                    placeholder="8자 이상, 영문/숫자/특수문자 조합 권장"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-500 uppercase ml-1">비밀번호 확인</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full px-5 py-3.5 text-lg bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
                    placeholder="새로운 비밀번호를 한 번 더 입력하세요"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 text-lg rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-200"
              >
                {isChangingPassword ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "비밀번호 변경 및 로그인"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
