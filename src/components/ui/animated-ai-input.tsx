"use client";

import { ArrowRight, Bot, Check, ChevronDown, Paperclip, Wrench } from "lucide-react";
import { useState, useRef, useCallback, useEffect, useContext } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { UITestModeContext } from "@/App";

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;

            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface AnimatedAiInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    disabled?: boolean;
}

export function AnimatedAiInput({ value, onChange, onSubmit, disabled }: AnimatedAiInputProps) {
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 72,
        maxHeight: 300,
    });
    const [selectedModel, setSelectedModel] = useState("Standard (1-2min)");
    const { uiTest, setUITest } = useContext(UITestModeContext);

    const AI_MODELS = [
        "Reasoning-Pro (wait times 8-15min)",
        "Standard (1-2min)",
    ];

    const MODEL_ICONS: Record<string, React.ReactNode> = {
        "Reasoning-Pro (wait times 8-15min)": <Bot className="w-4 h-4" />,
        "Standard (1-2min)": <Bot className="w-4 h-4" />,
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && value.trim()) {
            e.preventDefault();
            onSubmit();
            adjustHeight(true);
        }
    };

    const handleSubmit = () => {
        if (!disabled && value.trim()) {
            onSubmit();
            adjustHeight(true);
        }
    };

    return (
        <div className="w-full py-4">
            <div className="relative max-w-xl border rounded-[22px] border-border p-1 w-full mx-auto">
                <div className="relative rounded-2xl border border-border bg-card/50 flex flex-col shadow-lg">
                    <div
                        className="overflow-y-auto"
                        style={{ maxHeight: "300px" }}
                    >
                        <Textarea
                            value={value}
                            placeholder={uiTest ? "UI Test Mode ON" : "What can I do for you?"}
                            className={cn(
                                "w-full rounded-2xl rounded-b-none px-4 py-3 bg-card/50 border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0",
                                "min-h-[72px]"
                            )}
                            ref={textareaRef}
                            disabled={disabled}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => {
                                onChange(e.target.value);
                                adjustHeight();
                            }}
                        />
                    </div>

                    <div className="h-14 bg-card/50 rounded-b-xl flex items-center">
                        <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between w-[calc(100%-24px)]">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUITest(!uiTest)
                                    }}
                                    className={cn(
                                        "rounded-full transition-all flex items-center gap-2 px-1.5 py-1 border h-8",
                                        uiTest
                                            ? "bg-orange-500/15 border-orange-500 text-orange-600"
                                            : "bg-muted border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                        <motion.div
                                            animate={{
                                                rotate: uiTest ? 180 : 0,
                                                scale: uiTest ? 1.1 : 1,
                                            }}
                                            whileHover={{
                                                rotate: uiTest ? 180 : 15,
                                                scale: 1.1,
                                                transition: {
                                                    type: "spring",
                                                    stiffness: 300,
                                                    damping: 10,
                                                },
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 260,
                                                damping: 25,
                                            }}
                                        >
                                            <Wrench
                                                className={cn(
                                                    "w-4 h-4",
                                                    uiTest ? "text-orange-600" : "text-inherit"
                                                )}
                                            />
                                        </motion.div>
                                    </div>
                                    <AnimatePresence>
                                        {uiTest && (
                                            <motion.span
                                                initial={{ width: 0, opacity: 0 }}
                                                animate={{
                                                    width: "auto",
                                                    opacity: 1,
                                                }}
                                                exit={{ width: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-sm overflow-hidden whitespace-nowrap text-orange-600 flex-shrink-0"
                                            >
                                                UI Test
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </button>
                                <div className="h-4 w-px bg-border mx-0.5" />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="flex items-center gap-1 h-8 pl-1 pr-2 text-xs rounded-md hover:bg-accent focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-ring"
                                        >
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={selectedModel}
                                                    initial={{
                                                        opacity: 0,
                                                        y: -5,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        y: 5,
                                                    }}
                                                    transition={{
                                                        duration: 0.15,
                                                    }}
                                                    className="flex items-center gap-1"
                                                >
                                                    {MODEL_ICONS[selectedModel]}
                                                    {selectedModel}
                                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                                </motion.div>
                                            </AnimatePresence>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="min-w-[12rem]">
                                        {AI_MODELS.map((model) => (
                                            <DropdownMenuItem
                                                key={model}
                                                onSelect={() => setSelectedModel(model)}
                                                className="flex items-center justify-between gap-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {MODEL_ICONS[model]}
                                                    <span>{model}</span>
                                                </div>
                                                {selectedModel === model && (
                                                    <Check className="w-4 h-4 text-primary" />
                                                )}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={disabled || !value.trim()}
                                className={cn(
                                    "rounded-full p-2 transition-colors",
                                    value.trim() && !disabled
                                        ? "bg-primary/15 text-primary"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}