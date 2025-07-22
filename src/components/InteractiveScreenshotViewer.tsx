import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react';

interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface FeatureSection {
    name: string;
    purpose: string;
    elements?: string[];
    bounding_box?: BoundingBox;
    style?: {
        colors?: string;
        fonts?: string;
        layout?: string;
    };
}

interface InteractiveScreenshotViewerProps {
    screenshotUrl: string;
    sections: FeatureSection[];
    hoveredFeature?: string | null;
    onFeatureHover?: (featureName: string | null) => void;
    className?: string;
}

export const InteractiveScreenshotViewer: React.FC<InteractiveScreenshotViewerProps> = ({
    screenshotUrl,
    sections,
    hoveredFeature,
    onFeatureHover,
    className = ''
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipContent, setTooltipContent] = useState<FeatureSection | null>(null);
    const [zoom, setZoom] = useState(1);
    const [showOverlays, setShowOverlays] = useState(true);
    const [isCompactView, setIsCompactView] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debug logging for sections
    useEffect(() => {
        console.log("[InteractiveScreenshotViewer] Sections updated:", sections);
        console.log("[InteractiveScreenshotViewer] Sections with bounding boxes:",
            sections?.filter(s => s.bounding_box));
    }, [sections]);

    useEffect(() => {
        const updateImageDimensions = () => {
            if (imageRef.current) {
                setImageDimensions({
                    width: imageRef.current.clientWidth,
                    height: imageRef.current.clientHeight
                });
            }
        };

        if (imageLoaded) {
            updateImageDimensions();
            window.addEventListener('resize', updateImageDimensions);
            return () => window.removeEventListener('resize', updateImageDimensions);
        }
    }, [imageLoaded, zoom]);

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    const handleBoxHover = (section: FeatureSection, event: React.MouseEvent) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        setTooltipPosition({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        });
        setTooltipContent(section);
        setTooltipVisible(true);
        onFeatureHover?.(section.name);
    };

    const handleBoxLeave = () => {
        setTooltipVisible(false);
        setTooltipContent(null);
        onFeatureHover?.(null);
    };

    const scrollToFeature = (section: FeatureSection) => {
        if (!section.bounding_box || !containerRef.current) return;

        const container = containerRef.current;
        const { y, height } = section.bounding_box;

        // Calculate scroll position to center the feature
        const targetY = (y / 100) * imageDimensions.height * zoom;
        const featureHeight = (height / 100) * imageDimensions.height * zoom;
        const containerHeight = container.clientHeight;

        const scrollTop = Math.max(0, targetY - (containerHeight / 2) + (featureHeight / 2));

        container.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
    };

    // Effect to scroll when hoveredFeature changes (from external hover)
    useEffect(() => {
        if (hoveredFeature) {
            const section = sections.find(s => s.name === hoveredFeature);
            if (section) {
                scrollToFeature(section);
            }
        }
    }, [hoveredFeature, sections, imageDimensions, zoom]);

    const sectionsWithBounds = sections.filter(section =>
        section.bounding_box &&
        typeof section.bounding_box.x === 'number' &&
        typeof section.bounding_box.y === 'number' &&
        typeof section.bounding_box.width === 'number' &&
        typeof section.bounding_box.height === 'number'
    );

    // Simplified overlay detection - only detect very obvious overlays
    const detectOverlays = () => {
        return sectionsWithBounds.filter(section => {
            const { width, height, y } = section.bounding_box!;
            const name = section.name.toLowerCase();
            const purpose = section.purpose?.toLowerCase() || '';

            // Only check for very obvious overlay keywords
            const overlayKeywords = ['cookie', 'popup', 'modal', 'consent', 'gdpr'];
            const isOverlayByName = overlayKeywords.some(keyword =>
                name.includes(keyword) || purpose.includes(keyword)
            );

            // Only detect obvious bottom cookie banners
            const isBottomBanner = width > 80 && height > 3 && y > 80;

            const isOverlay = isOverlayByName || isBottomBanner;

            if (isOverlay) {
                console.log(`Detected overlay: ${section.name}`, {
                    isOverlayByName,
                    isBottomBanner,
                    dimensions: { y, width, height }
                });
            }

            return isOverlay;
        });
    };

    const overlayElements = detectOverlays();

    const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
    const toggleCompactView = () => setIsCompactView(prev => !prev);

    // Calculate container height - either compact or based on image
    const getContainerHeight = () => {
        if (isCompactView) return '600px';
        if (imageDimensions.height > 0) {
            // Allow for full height but cap at reasonable maximum
            const maxHeight = Math.min(imageDimensions.height * zoom, window.innerHeight * 0.8);
            return `${maxHeight}px`;
        }
        return '800px'; // fallback
    };

    return (
        <Card className={`relative ${className}`}>
            {/* Control Bar */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.5}
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[60px] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomIn}
                        disabled={zoom >= 3}
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {overlayElements.length > 0 && (
                        <Button
                            variant={showOverlays ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowOverlays(prev => !prev)}
                            className={showOverlays ? "bg-red-500 hover:bg-red-600" : "border-red-200 text-red-600 hover:bg-red-50"}
                        >
                            {showOverlays ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            <span className="ml-1 text-xs">
                                {showOverlays ? 'Hide Overlays' : 'Show Overlays'}
                            </span>
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleCompactView}
                    >
                        {isCompactView ? 'Full View' : 'Compact'}
                    </Button>
                </div>
            </div>

            <div
                ref={containerRef}
                className="relative w-full overflow-auto bg-gray-50 rounded-b-lg"
                style={{ height: getContainerHeight() }}
            >
                {/* Screenshot Image */}
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                    <img
                        ref={imageRef}
                        src={screenshotUrl}
                        alt="Website Screenshot"
                        className="w-full h-auto block"
                        onLoad={handleImageLoad}
                        style={{ maxWidth: 'none' }}
                    />
                </div>

                {/* Visual Overlay Masks - These actually hide the popup content */}
                {imageLoaded && imageDimensions.width > 0 && imageDimensions.height > 0 && !showOverlays && (
                    <div
                        className="absolute top-0 left-0 pointer-events-none"
                        style={{
                            width: imageDimensions.width * zoom,
                            height: imageDimensions.height * zoom,
                            transformOrigin: 'top left'
                        }}
                    >
                        {overlayElements.map((section, index) => {
                            const { x, y, width, height } = section.bounding_box!;

                            // Convert percentages to pixel coordinates
                            const pixelX = (x / 100) * imageDimensions.width;
                            const pixelY = (y / 100) * imageDimensions.height;
                            const pixelWidth = (width / 100) * imageDimensions.width;
                            const pixelHeight = (height / 100) * imageDimensions.height;

                            return (
                                <motion.div
                                    key={`mask-${section.name}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute bg-gray-100/90 backdrop-blur-sm border-2 border-red-300 rounded-lg"
                                    style={{
                                        left: pixelX,
                                        top: pixelY,
                                        width: pixelWidth,
                                        height: pixelHeight,
                                    }}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm font-medium shadow-sm">
                                            <EyeOff className="inline h-4 w-4 mr-1" />
                                            {section.name} Hidden
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* SVG Overlay for Bounding Boxes */}
                {imageLoaded && imageDimensions.width > 0 && imageDimensions.height > 0 && (
                    <svg
                        className="absolute top-0 left-0 pointer-events-none"
                        style={{
                            width: imageDimensions.width * zoom,
                            height: imageDimensions.height * zoom,
                            transformOrigin: 'top left'
                        }}
                        viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
                    >
                        {sectionsWithBounds.map((section, index) => {
                            const { x, y, width, height } = section.bounding_box!;
                            const isHovered = hoveredFeature === section.name;
                            const isOverlay = overlayElements.includes(section);

                            // Skip rendering overlay bounding boxes if they're hidden (but still show the mask above)
                            if (isOverlay && !showOverlays) return null;

                            // Convert percentages to pixel coordinates - with safety checks
                            const pixelX = Math.max(0, (x / 100) * imageDimensions.width);
                            const pixelY = Math.max(0, (y / 100) * imageDimensions.height);
                            const pixelWidth = Math.max(1, (width / 100) * imageDimensions.width);
                            const pixelHeight = Math.max(1, (height / 100) * imageDimensions.height);

                            // Safety check - don't render if coordinates are invalid
                            if (!isFinite(pixelX) || !isFinite(pixelY) || !isFinite(pixelWidth) || !isFinite(pixelHeight)) {
                                return null;
                            }

                            // Different colors for overlays and regular elements
                            const strokeColor = isOverlay ? "#ef4444" : "#3b82f6";
                            const fillColor = isOverlay
                                ? "rgba(239, 68, 68, 0.1)"
                                : "rgba(59, 130, 246, 0.1)";
                            const hoverFillColor = isOverlay
                                ? "rgba(239, 68, 68, 0.2)"
                                : "rgba(59, 130, 246, 0.2)";

                            return (
                                <motion.g key={section.name}>
                                    {/* Bounding Box Rectangle */}
                                    <motion.rect
                                        x={pixelX}
                                        y={pixelY}
                                        width={pixelWidth}
                                        height={pixelHeight}
                                        fill={fillColor}
                                        stroke={strokeColor}
                                        strokeWidth={2}
                                        strokeDasharray={isOverlay ? "4,4" : "8,4"}
                                        className="pointer-events-auto cursor-pointer"
                                        initial={{
                                            strokeWidth: 2,
                                            strokeDasharray: isOverlay ? "4,4" : "8,4",
                                            fill: fillColor
                                        }}
                                        animate={{
                                            strokeWidth: isHovered ? 3 : 2,
                                            strokeDasharray: isHovered ? "0" : (isOverlay ? "4,4" : "8,4"),
                                            fill: isHovered ? hoverFillColor : fillColor
                                        }}
                                        transition={{ duration: 0.2 }}
                                        onMouseEnter={(e) => handleBoxHover(section, e as any)}
                                        onMouseLeave={handleBoxLeave}
                                    />

                                    {/* Feature Label */}
                                    <motion.text
                                        x={pixelX + 8}
                                        y={pixelY + 20}
                                        fill="#1f2937"
                                        fontSize="12px"
                                        fontWeight="600"
                                        className="pointer-events-none"
                                        initial={{
                                            opacity: 0.8,
                                            fontSize: "12px"
                                        }}
                                        animate={{
                                            opacity: isHovered ? 1 : 0.8,
                                            fontSize: isHovered ? "14px" : "12px"
                                        }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {section.name}
                                        {isOverlay && " (Overlay)"}
                                    </motion.text>

                                    {/* Feature Number Badge */}
                                    <motion.circle
                                        cx={pixelX + pixelWidth - 12}
                                        cy={pixelY + 12}
                                        r={10}
                                        fill={strokeColor}
                                        className="pointer-events-none"
                                        initial={{ r: 10 }}
                                        animate={{
                                            r: isHovered ? 12 : 10
                                        }}
                                        transition={{ duration: 0.2 }}
                                    />
                                    <text
                                        x={pixelX + pixelWidth - 12}
                                        y={pixelY + 16}
                                        fill="white"
                                        fontSize="10px"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        className="pointer-events-none"
                                    >
                                        {index + 1}
                                    </text>
                                </motion.g>
                            );
                        })}
                    </svg>
                )}

                {/* Tooltip */}
                <AnimatePresence>
                    {tooltipVisible && tooltipContent && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="absolute z-50 bg-white rounded-lg shadow-lg border p-3 max-w-xs pointer-events-none"
                            style={{
                                left: tooltipPosition.x + 10,
                                top: tooltipPosition.y - 10,
                                transform: 'translateY(-100%)'
                            }}
                        >
                            <h4 className="font-semibold text-sm mb-1">{tooltipContent.name}</h4>
                            <p className="text-xs text-gray-600 mb-2">{tooltipContent.purpose}</p>
                            {tooltipContent.bounding_box && (
                                <div className="text-xs text-gray-500 mb-2">
                                    <span className="font-medium">Dimensions: </span>
                                    {Math.round(tooltipContent.bounding_box.width)}% × {Math.round(tooltipContent.bounding_box.height)}%
                                </div>
                            )}
                            {tooltipContent.elements && tooltipContent.elements.length > 0 && (
                                <div className="text-xs">
                                    <span className="font-medium">Elements: </span>
                                    <span className="text-gray-500">
                                        {tooltipContent.elements.slice(0, 3).join(', ')}
                                        {tooltipContent.elements.length > 3 && '...'}
                                    </span>
                                </div>
                            )}
                            {tooltipContent.style?.colors && (
                                <div className="text-xs mt-1">
                                    <span className="font-medium">Colors: </span>
                                    <span className="text-gray-500">{tooltipContent.style.colors}</span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading State */}
                {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-500">Loading screenshot...</p>
                        </div>
                    </div>
                )}

                {/* No Coordinates Warning */}
                {imageLoaded && sectionsWithBounds.length === 0 && (
                    <div className="absolute inset-4 flex items-center justify-center">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                            <p className="text-sm text-yellow-800">
                                No bounding box coordinates available for this analysis.
                            </p>
                            <p className="text-xs text-yellow-600 mt-1">
                                Interactive overlays will be added once the AI provides coordinate data.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Overlay Warnings - Below screenshot for better UX */}
            {overlayElements.length > 0 && (
                <div className="p-3 bg-blue-50 border-t border-blue-200 rounded-b-lg">
                    <div className="flex items-start gap-2">
                        <div className="flex-1">
                            <p className="text-sm text-blue-800">
                                <strong>{overlayElements.map(el => el.name).join(', ')}</strong> detected but may be on other pages.
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                Single-page screenshot only captures visible elements. {showOverlays ? "Use 'Hide Overlays' to mask if needed." : "Overlays masked."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}; 