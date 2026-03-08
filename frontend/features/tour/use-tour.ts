"use client";

import { useEffect, useCallback, useRef } from "react";
import { driver, type DriveStep, type Config } from "driver.js";

const TOUR_STORAGE_KEY = "baws-tour-completed";

type TourPage = "projects" | "conversations";

function getTourFlag(page: TourPage): string {
  return `${TOUR_STORAGE_KEY}-${page}`;
}

function isTourCompleted(page: TourPage): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(getTourFlag(page)) === "true";
}

function markTourCompleted(page: TourPage): void {
  localStorage.setItem(getTourFlag(page), "true");
}

export function resetTourFlag(page: TourPage): void {
  localStorage.removeItem(getTourFlag(page));
}

export function resetAllTourFlags(): void {
  resetTourFlag("projects");
  resetTourFlag("conversations");
}

interface UseTourOptions {
  page: TourPage;
  steps: DriveStep[];
  /** Delay in ms before auto-starting the tour (default: 800) */
  autoStartDelay?: number;
  /** Extra driver.js config overrides */
  config?: Partial<Config>;
}

export function useTour({
  page,
  steps,
  autoStartDelay = 800,
  config,
}: UseTourOptions) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const startTour = useCallback(() => {
    // Destroy any existing tour instance
    driverRef.current?.destroy();

    const driverInstance = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: "rgba(0, 0, 0, 0.5)",
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: "baws-tour-popover",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Done ✓",
      ...config,
      steps,
      onDestroyed: (...args) => {
        markTourCompleted(page);
        config?.onDestroyed?.(...args);
      },
    });

    driverRef.current = driverInstance;
    driverInstance.drive();
  }, [page, steps, config]);

  // Auto-start on first visit
  useEffect(() => {
    if (isTourCompleted(page)) return;

    const timer = setTimeout(() => {
      startTour();
    }, autoStartDelay);

    return () => clearTimeout(timer);
  }, [page, autoStartDelay, startTour]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
    };
  }, []);

  return { startTour };
}
