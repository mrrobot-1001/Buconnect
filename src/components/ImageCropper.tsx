"use client";

import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCw, Check, X } from "lucide-react";

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  aspectRatio?: number; // 1 for square, 16/9 for wide, etc.
  maxSizeKB?: number; // Max file size in KB
}

export function ImageCropper({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  maxSizeKB = 500,
}: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [baseZoom, setBaseZoom] = useState(1); // The zoom needed to fit image in container
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cropSize = 256; // Output size in pixels
  const containerSize = 280; // Size of the preview container

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const compressImage = async (canvas: HTMLCanvasElement, quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/jpeg",
        quality
      );
    });
  };

  const handleCrop = async () => {
    if (!imageRef.current || !canvasRef.current) return;

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = imageRef.current;
      
      // Set canvas size to desired output size
      canvas.width = cropSize;
      canvas.height = cropSize;

      // Clear canvas
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cropSize, cropSize);

      // Calculate the visible area dimensions
      const scale = zoom;
      
      // Calculate image dimensions at current zoom
      const imgDisplayWidth = img.naturalWidth * scale;
      const imgDisplayHeight = img.naturalHeight * scale;
      
      // Calculate the center of the container
      const centerX = containerSize / 2;
      const centerY = containerSize / 2;
      
      // The image center position in container coordinates
      // Image is centered with transform: translate(-50%, -50%) then offset by position
      const imgCenterX = centerX + position.x;
      const imgCenterY = centerY + position.y;
      
      // Calculate the top-left of the crop area in image coordinates
      // The crop area is centered at (centerX, centerY)
      const cropLeft = centerX - imgCenterX;
      const cropTop = centerY - imgCenterY;
      
      // Convert to source image coordinates
      const sourceX = (cropLeft + imgDisplayWidth / 2 - containerSize / 2) / scale;
      const sourceY = (cropTop + imgDisplayHeight / 2 - containerSize / 2) / scale;
      const sourceWidth = containerSize / scale;
      const sourceHeight = containerSize / scale;

      // Save context state
      ctx.save();
      
      // Apply rotation if needed
      if (rotation !== 0) {
        ctx.translate(cropSize / 2, cropSize / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-cropSize / 2, -cropSize / 2);
      }

      // Draw the cropped image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        cropSize,
        cropSize
      );

      ctx.restore();

      // Compress the image to meet size requirements
      let quality = 0.9;
      let blob = await compressImage(canvas, quality);
      
      // Reduce quality until file size is acceptable
      while (blob.size > maxSizeKB * 1024 && quality > 0.1) {
        quality -= 0.1;
        blob = await compressImage(canvas, quality);
      }

      onCropComplete(blob);
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imageRef.current = e.currentTarget;
    const img = e.currentTarget;
    
    // Calculate initial zoom to fit image within the container
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    // Calculate zoom to make the smaller dimension fit the container
    const fitZoom = containerSize / Math.min(imgWidth, imgHeight);
    
    // Reset position and set initial zoom to fit
    setBaseZoom(fitZoom);
    setPosition({ x: 0, y: 0 });
    setZoom(fitZoom);
    setRotation(0);
  };

  const handleReset = () => {
    setPosition({ x: 0, y: 0 });
    setZoom(baseZoom);
    setRotation(0);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Profile Photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Container */}
          <div
            ref={containerRef}
            className="relative mx-auto w-[280px] h-[280px] overflow-hidden rounded-full bg-gray-100 border-4 border-gray-200 cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {imageSrc && (
              <img
                src={imageSrc}
                alt="Crop preview"
                className="absolute select-none pointer-events-none"
                style={{
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center",
                  left: "50%",
                  top: "50%",
                  maxWidth: "none",
                  maxHeight: "none",
                }}
                onLoad={handleImageLoad}
                draggable={false}
              />
            )}
            {/* Crop overlay guide */}
            <div className="absolute inset-0 border-4 border-white/50 rounded-full pointer-events-none" />
          </div>

          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <ZoomOut className="h-4 w-4" />
                Zoom
              </span>
              <span className="flex items-center gap-1">
                <ZoomIn className="h-4 w-4" />
              </span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={baseZoom * 0.5}
              max={baseZoom * 3}
              step={baseZoom * 0.05}
              className="w-full"
            />
          </div>

          {/* Rotation Control */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => r - 90)}
              className="gap-1"
            >
              <RotateCw className="h-4 w-4 rotate-180" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => r + 90)}
              className="gap-1"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          {/* File size info */}
          <p className="text-xs text-center text-gray-500">
            Image will be resized to {cropSize}x{cropSize}px and compressed to max {maxSizeKB}KB
          </p>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleCrop} disabled={isProcessing}>
            {isProcessing ? (
              "Processing..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Apply
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
