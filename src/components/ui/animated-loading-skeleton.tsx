import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from './button'

interface AnimatedLoadingSkeletonProps {
  onClose?: () => void
}

const AnimatedLoadingSkeleton: React.FC<AnimatedLoadingSkeletonProps> = ({ onClose }) => {
    // Variants for frame animations
    const frameVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
    }

    // Variants for individual card animations
    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: (i: number) => ({
            y: 0,
            opacity: 1,
            transition: { delay: i * 0.1, duration: 0.4 }
        })
    }

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
            {/* Close button */}
            {onClose && (
                <div className="absolute top-6 right-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-10 w-10"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            )}

            <motion.div
                className="w-full max-w-4xl mx-auto p-6"
                variants={frameVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold mb-2">Generating Recommendations</h2>
                    <p className="text-muted-foreground">Please wait while we analyze your components...</p>
                </div>

                <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-8">
                    {/* Animated search icon */}
                    <motion.div
                        className="absolute top-8 left-8 z-10"
                        animate={{
                            x: [0, 200, 400, 600, 0],
                            y: [0, 100, 200, 50, 0],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <motion.div
                            className="bg-blue-500/20 p-3 rounded-full backdrop-blur-sm"
                            animate={{
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <svg
                                className="w-6 h-6 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </motion.div>
                    </motion.div>

                    {/* Grid of animated cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                custom={i}
                                whileHover={{ scale: 1.02 }}
                                className="bg-white rounded-lg shadow-sm p-4"
                            >
                                {/* Card placeholders */}
                                <motion.div
                                    className="h-32 bg-gray-200 rounded-md mb-3"
                                    animate={{
                                        backgroundColor: ["#f3f4f6", "#e5e7eb", "#f3f4f6"],
                                    }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                                <motion.div
                                    className="h-3 w-3/4 bg-gray-200 rounded mb-2"
                                    animate={{
                                        backgroundColor: ["#f3f4f6", "#e5e7eb", "#f3f4f6"],
                                    }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                                <motion.div
                                    className="h-3 w-1/2 bg-gray-200 rounded"
                                    animate={{
                                        backgroundColor: ["#f3f4f6", "#e5e7eb", "#f3f4f6"],
                                    }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default AnimatedLoadingSkeleton