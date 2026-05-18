/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type ClipboardEvent } from 'react';
import { Search, Brain, BookOpen, CheckCircle, Database, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useQuestionBank } from './hooks/useQuestionBank';
import { performLocalOcr } from './services/ocrService';

export default function App() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { questions, search } = useQuestionBank();
  
  const searchResults = search(query);

  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
       if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          await processImage(file);
        }
      }
    }
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const extractedText = await performLocalOcr(base64);
        setQuery(extractedText);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Local OCR Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div 
      className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-indigo-500/30"
      onPaste={handlePaste}
    >
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">软工基小测做题器</h1>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">题库模式已激活</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <Database size={12} />
            已索引 {questions.length.toLocaleString()} 道题目
          </div>
        </header>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative bg-[#111] border border-white/10 rounded-3xl p-2 flex items-center gap-4 transition-all focus-within:border-indigo-500/40 focus-within:ring-4 ring-indigo-500/5">
            <Search className="ml-4 text-gray-500" />
            <input 
              autoFocus
              placeholder="粘贴题目片段或按下 Ctrl+V 粘贴图片..."
              className="flex-1 bg-transparent border-none outline-none text-xl py-4 placeholder:text-gray-700"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="mr-2 p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                title="清除"
              >
                清除
              </button>
            )}
          </div>
          <div className="mt-2 pl-4 text-[10px] text-gray-600 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse" />
            引擎就绪 // 随时可以粘贴图片
          </div>
        </div>

        {/* Status */}
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 text-indigo-500 py-4 border border-indigo-500/10 bg-indigo-500/5 rounded-2xl"
          >
            <Brain className="animate-spin text-indigo-400" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] font-medium">本地 OCR 引擎正在解析图片...</span>
          </motion.div>
        )}

        {/* Results Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2">
              <BookOpen size={12} />
              题库匹配结果 {query && `(${searchResults.length})`}
            </h2>
            {query && searchResults.length > 0 && (
              <span className="text-[10px] font-mono text-gray-600">
                扫描范围: {questions.length} 条记录
              </span>
            )}
          </div>
          
          <AnimatePresence mode="popLayout">
            {searchResults.length > 0 ? (
              <div className="grid gap-6">
                {searchResults.map(({ item, score }: any, idx: number) => (
                  <QuestionCard 
                    key={item.id} 
                    question={item} 
                    isExact={idx === 0 && score < 0.15} 
                    onCopy={() => copyToClipboard(item.answer, item.id)}
                    isCopied={copiedId === item.id}
                  />
                ))}
              </div>
            ) : query && !isProcessing ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-24 text-center border border-dashed border-white/5 rounded-3xl group transition-colors hover:border-indigo-500/20"
              >
                <div className="text-gray-500 font-medium mb-2">未在 JSON 题库中找到匹配项</div>
                <div className="text-[10px] text-gray-700 font-mono uppercase tracking-widest">请尝试调整关键词或重新截图</div>
              </motion.div>
            ) : !query && (
              <div className="py-32 text-center text-gray-700 bg-white/[0.01] border border-white/5 rounded-3xl border-dashed">
                <Search size={32} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm">支持文本搜索或直接粘贴截图（OCR）</p>
                <div className="mt-6 flex items-center justify-center gap-8 opacity-40">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-mono uppercase">Ctrl + V</span>
                    <span className="text-[8px]">粘贴图片</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-mono uppercase">本地题库</span>
                    <span className="text-[8px]">JSON 匹配</span>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="fixed bottom-6 right-6 text-[10px] font-mono text-gray-800 pointer-events-none select-none">
        本地运行模式 // 无外部 API 依赖 // 引擎: TESSERACT_JS
      </footer>
    </div>
  );
}

function QuestionCard({ 
  question, 
  isExact, 
  onCopy, 
  isCopied 
}: { 
  question: any; 
  isExact: boolean; 
  onCopy: () => void;
  isCopied: boolean;
  key?: string | number;
}) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "bg-[#0d0d0d] p-8 rounded-3xl transition-all border group relative",
        isExact ? "border-green-500/30 ring-1 ring-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.05)]" : "border-white/5 hover:border-white/10"
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 bg-white/5 py-1 px-2 rounded">
          {question.chapter}
        </span>
        <div className="flex items-center gap-4">
          {isExact && (
            <span className="text-[9px] font-mono text-green-500 uppercase tracking-widest flex items-center gap-1 font-bold">
              <CheckCircle size={10} /> 精准匹配
            </span>
          )}
          <button 
            onClick={onCopy}
            className={cn(
              "p-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest",
              isCopied ? "bg-green-500 text-black" : "bg-white/5 text-gray-500 hover:text-white"
            )}
          >
            {isCopied ? <Check size={12} /> : <Copy size={12} />}
            {isCopied ? "已复制" : "复制答案"}
          </button>
        </div>
      </div>

      <p className="text-xl leading-relaxed text-gray-200 font-medium tracking-tight">
        {question.text}
      </p>
      
      {question.options && question.options.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-3">
          {question.options.map((opt: string, idx: number) => {
            const isCorrect = opt.trim().startsWith(question.answer) || 
                              opt.trim().split('.')[0] === question.answer;
            return (
              <div 
                key={idx} 
                className={cn(
                  "text-sm p-4 rounded-xl border transition-all relative overflow-hidden",
                  isCorrect 
                    ? "bg-green-500/10 border-green-500/30 text-green-300 ring-1 ring-green-500/5 font-medium" 
                    : "bg-white/[0.02] border-white/5 text-gray-500"
                )}
              >
                {isCorrect && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    className="absolute inset-0 bg-green-500/5 pointer-events-none"
                  />
                )}
                <span className="relative z-10">{opt}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-4">
        <div className="bg-green-500 h-10 w-10 rounded-xl flex items-center justify-center font-bold text-black border-2 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
          {question.answer}
        </div>
        <div>
          <p className="text-[10px] font-mono text-green-500 uppercase tracking-widest font-bold">验证通过</p>
          <p className="text-sm text-gray-400 leading-none">记录索引 ID: {question.id}</p>
        </div>
      </div>
    </motion.div>
  );
}
