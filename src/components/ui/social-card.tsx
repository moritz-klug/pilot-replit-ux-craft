"use client";

import { cn } from "@/lib/utils";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Link as LinkIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./button";

interface SocialCardProps {
  author?: {
    name?: string;
    username?: string;
    avatar?: string;
    timeAgo?: string;
  };
  content?: {
    text?: string;
    link?: {
      title?: string;
      description?: string;
      icon?: React.ReactNode;
    };
  };
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
  };
  statusOptions?: string[];
  currentStatus?: string;
  onStatusChange?: (status: string) => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onMore?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function SocialCard({
  author,
  content,
  engagement,
  statusOptions,
  currentStatus,
  onStatusChange,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onMore,
  className,
  children
}: SocialCardProps) {
  const [isLiked, setIsLiked] = useState(engagement?.isLiked ?? false);
  const [isBookmarked, setIsBookmarked] = useState(engagement?.isBookmarked ?? false);
  const [likes, setLikes] = useState(engagement?.likes ?? 0);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.();
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.();
  };

  const handleMoreClick = () => {
    if (statusOptions) {
      setShowStatusMenu(!showStatusMenu);
    } else {
      onMore?.();
    }
  };

  const handleStatusSelect = (status: string) => {
    onStatusChange?.(status);
    setShowStatusMenu(false);
  };

  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto",
        "bg-white dark:bg-zinc-900",
        "rounded-3xl shadow-xl",
        className
      )}
    >
      <div>
        <div className="p-6">
          {/* Author section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src={author?.avatar}
                alt={author?.name}
                className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-zinc-800"
              />
              <div>
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {author?.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  @{author?.username} · {author?.timeAgo}
                </p>
              </div>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={handleMoreClick}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-zinc-400" />
              </button>
              {showStatusMenu && statusOptions && (
                <div className="absolute right-0 top-12 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-2 z-50 min-w-[120px]">
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={currentStatus === status ? 'default' : 'ghost'}
                      onClick={() => handleStatusSelect(status)}
                      className="w-full justify-start mb-1 last:mb-0"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content section */}
          <p className="text-zinc-600 dark:text-zinc-300 mb-4">
            {content?.text}
          </p>

          {/* Link preview */}
          {content?.link && (
            <div className="mb-4 rounded-2xl overflow-hidden">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white dark:bg-zinc-700 rounded-xl">
                    {content.link.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {content.link.title}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {content.link.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Engagement section */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors",
                  isLiked
                    ? "text-rose-600"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-rose-600"
                )}
              >
                <Heart
                  className={cn(
                    "w-5 h-5 transition-all",
                    isLiked && "fill-current scale-110"
                  )}
                />
                <span>{likes}</span>
              </button>
              <button
                type="button"
                onClick={onComment}
                className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{engagement?.comments}</span>
              </button>
              <button
                type="button"
                onClick={onShare}
                className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-green-500 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span>{engagement?.shares}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleBookmark}
              className={cn(
                "p-2 rounded-full transition-all",
                isBookmarked 
                  ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10" 
                  : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <Bookmark className={cn(
                "w-5 h-5 transition-transform",
                isBookmarked && "fill-current scale-110"
              )} />
            </button>
          </div>

          {/* Custom children content */}
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}