'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface SwipeToCompleteProps {
  onComplete: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const SwipeToComplete: React.FC<SwipeToCompleteProps> = ({ 
  onComplete, 
  children, 
  disabled = false,
  className = ''
}) => {
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const threshold = 150; // Distance to trigger completion

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isCompleting) return;
    
    setIsActive(true);
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isActive || disabled || isCompleting) return;

    currentXRef.current = e.touches[0].clientX;
    const distance = Math.min(Math.max(0, startXRef.current - currentXRef.current), threshold);
    setSwipeDistance(distance);
  };

  const handleTouchEnd = () => {
    if (!isActive || disabled || isCompleting) return;

    setIsActive(false);
    
    if (swipeDistance >= threshold) {
      setIsCompleting(true);
      onComplete();
    } else {
      // Animate back to original position
      setSwipeDistance(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isCompleting) return;
    
    setIsActive(true);
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isActive || disabled || isCompleting) return;
      
      currentXRef.current = e.clientX;
      const distance = Math.min(Math.max(0, startXRef.current - currentXRef.current), threshold);
      setSwipeDistance(distance);
    };

    const handleMouseUp = () => {
      if (!isActive || disabled || isCompleting) return;
      
      setIsActive(false);
      
      if (swipeDistance >= threshold) {
        setIsCompleting(true);
        onComplete();
      } else {
        setSwipeDistance(0);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Reset state when disabled prop changes
  useEffect(() => {
    if (disabled) {
      setSwipeDistance(0);
      setIsActive(false);
      setIsCompleting(false);
    }
  }, [disabled]);

  const progress = swipeDistance / threshold;
  const showAction = swipeDistance > 10;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Action Panel (Complete) */}
      <div 
        className="absolute inset-0 bg-green-500 flex items-center justify-end pr-4 z-10"
        style={{
          transform: `translateX(${100 - (progress * 100)}%)`,
          opacity: progress
        }}
      >
        <div className="flex flex-col items-center text-white">
          <CheckCircle size={20} />
          <span className="text-xs mt-1 font-medium">Complete</span>
        </div>
      </div>

      {/* Main Content */}
      <div
        ref={containerRef}
        className={`relative z-20 transition-transform ${
          isActive ? '' : 'duration-300 ease-out'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'}`}
        style={{
          transform: `translateX(-${swipeDistance}px)`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>
    </div>
  );
};