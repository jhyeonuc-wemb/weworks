"use client";

import { useState } from "react";
import { Sparkles, Brain, Zap, MessageSquare, BarChart3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ProjectAiAnalysisProps {
    projectId: string;
    projectData?: any;
}

export function ProjectAiAnalysis({ projectId, projectData }: ProjectAiAnalysisProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    return (
        <div className="mt-12 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                    <Sparkles size={20} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">프로젝트 진단 AI 분석</h2>
            </div>

            <div className="relative group overflow-hidden">
                {/* Animated Background Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>

                <div className="relative rounded-[2.5rem] border border-gray-100 bg-white/80 backdrop-blur-xl p-8 shadow-2xl shadow-indigo-100/50">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Content: Info & Action */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Brain className="text-indigo-500" size={20} />
                                    AI가 프로젝트의 성공 가능성을 진단합니다
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    M/D 산정의 적정성, 수익성 지표, 인력 투입 계획의 효율성 등을 종합적으로 분석하여
                                    프로젝트의 잠재적 리스크를 찾아내고 최적화 가이드를 제공합니다.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {[
                                    { icon: BarChart3, label: "M/D 적정성 분석", color: "blue" },
                                    { icon: Zap, label: "수익성 시뮬레이션", color: "amber" },
                                    { icon: MessageSquare, label: "리스크 사전 감지", color: "rose" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                                        <item.icon size={16} className={cn(
                                            item.color === "blue" ? "text-blue-500" :
                                                item.color === "amber" ? "text-amber-500" : "text-rose-500"
                                        )} />
                                        <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4">
                                <Button
                                    size="lg"
                                    className="rounded-2xl bg-gray-900 px-8 h-12 text-white hover:bg-indigo-600 transition-all duration-300 gap-2 shadow-lg shadow-indigo-100"
                                    onClick={() => setIsAnalyzing(true)}
                                    disabled={isAnalyzing}
                                >
                                    <Sparkles size={18} />
                                    {isAnalyzing ? "분석 엔진 가동 중..." : "AI 진단 실행하기"}
                                </Button>
                                <p className="mt-3 text-[11px] text-gray-400 flex items-center gap-1.5">
                                    <AlertCircle size={12} />
                                    현재는 프리뷰 단계로, 실제 데이터 분석 기능은 준비 중입니다. (대화 우선 모드)
                                </p>
                            </div>
                        </div>

                        {/* Right Content: Status/Preview */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl -rotate-2 scale-95 opacity-50" />
                            <div className="relative h-full min-h-[180px] rounded-3xl border border-dashed border-indigo-200 bg-white/50 p-6 flex flex-col items-center justify-center text-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center animate-pulse">
                                    <Brain size={32} className="text-indigo-400 opacity-50" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-indigo-900">분석 대기 중</p>
                                    <p className="text-xs text-indigo-400">데이터를 수집하고 준비하세요</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
