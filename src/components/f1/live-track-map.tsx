"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchCarLocations, fetchLiveDrivers } from "@/lib/api/openf1";
import type { OpenF1Location, OpenF1Driver } from "@/lib/api/openf1";

interface CarDot {
    driverNumber: number;
    acronym: string;
    color: string;
    x: number; // normalized 0-100
    y: number; // normalized 0-100
}

interface LiveTrackMapProps {
    isVisible?: boolean;
}

export default function LiveTrackMap({ isVisible = true }: LiveTrackMapProps) {
    const [cars, setCars] = useState<CarDot[]>([]);
    const [trackPath, setTrackPath] = useState<string>("");
    const [selectedCar, setSelectedCar] = useState<number | null>(null);
    const driversRef = useRef<OpenF1Driver[]>([]);
    // Accumulate location history to build the track outline
    const historyRef = useRef<Map<number, { x: number; y: number }[]>>(new Map());
    const boundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);

    // Fetch drivers once
    useEffect(() => {
        fetchLiveDrivers().then(d => { driversRef.current = d; });
    }, []);

    const normalizeCoords = useCallback((locations: OpenF1Location[]): CarDot[] => {
        if (locations.length === 0) return [];

        // Accumulate history for track outline
        for (const loc of locations) {
            if (!historyRef.current.has(loc.driver_number)) {
                historyRef.current.set(loc.driver_number, []);
            }
            const arr = historyRef.current.get(loc.driver_number)!;
            arr.push({ x: loc.x, y: loc.y });
            // Keep last 200 points per driver for track outline
            if (arr.length > 200) arr.shift();
        }

        // Compute bounds from all accumulated history
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const [, points] of historyRef.current) {
            for (const p of points) {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            }
        }

        // Also use current locations for bounds
        for (const loc of locations) {
            if (loc.x < minX) minX = loc.x;
            if (loc.x > maxX) maxX = loc.x;
            if (loc.y < minY) minY = loc.y;
            if (loc.y > maxY) maxY = loc.y;
        }

        boundsRef.current = { minX, maxX, minY, maxY };

        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;
        // Add 5% padding
        const padX = rangeX * 0.05;
        const padY = rangeY * 0.05;

        const normalize = (x: number, y: number) => ({
            nx: ((x - minX + padX) / (rangeX + padX * 2)) * 100,
            ny: ((y - minY + padY) / (rangeY + padY * 2)) * 100,
        });

        // Build track outline from the driver with the most history
        let longestHistory: { x: number; y: number }[] = [];
        for (const [, points] of historyRef.current) {
            if (points.length > longestHistory.length) longestHistory = points;
        }

        if (longestHistory.length > 5) {
            const pathPoints = longestHistory.map(p => {
                const { nx, ny } = normalize(p.x, p.y);
                return `${nx},${ny}`;
            });
            setTrackPath(`M${pathPoints.join(" L")}`);
        }

        return locations.map(loc => {
            const driver = driversRef.current.find(d => d.driver_number === loc.driver_number);
            const { nx, ny } = normalize(loc.x, loc.y);
            return {
                driverNumber: loc.driver_number,
                acronym: driver?.name_acronym || `${loc.driver_number}`,
                color: driver?.team_colour ? `#${driver.team_colour}` : "#ffffff",
                x: nx,
                y: ny,
            };
        });
    }, []);

    const loadLocations = useCallback(async () => {
        const locations = await fetchCarLocations();
        if (locations.length > 0) {
            setCars(normalizeCoords(locations));
        }
    }, [normalizeCoords]);

    useEffect(() => {
        loadLocations();
        const interval = setInterval(() => {
            if (isVisible) loadLocations();
        }, 2500);
        return () => clearInterval(interval);
    }, [isVisible, loadLocations]);

    if (cars.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3 py-8">
                <span className="material-symbols-outlined text-3xl animate-pulse">map</span>
                <span className="text-xs font-mono uppercase tracking-widest">Awaiting GPS data...</span>
            </div>
        );
    }

    return (
        <div className="relative w-full">
            <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-sm text-primary">map</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-f1">Live Track Map</span>
                <div className="flex-1" />
                <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </div>
                <span className="text-[9px] text-green-500 font-mono uppercase">GPS Live</span>
            </div>

            <svg
                viewBox="0 0 100 100"
                className="w-full aspect-square bg-black/40 rounded-xl border border-white/5"
                style={{ overflow: "visible" }}
            >
                {/* Track outline */}
                {trackPath && (
                    <path
                        d={trackPath}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {/* Car dots */}
                {cars.map(car => {
                    const isSelected = selectedCar === car.driverNumber;
                    return (
                        <g
                            key={car.driverNumber}
                            onClick={() => setSelectedCar(isSelected ? null : car.driverNumber)}
                            className="cursor-pointer"
                        >
                            {/* Glow ring */}
                            <circle
                                cx={car.x}
                                cy={car.y}
                                r={isSelected ? 3.5 : 2.2}
                                fill="none"
                                stroke={car.color}
                                strokeWidth={0.4}
                                opacity={isSelected ? 0.8 : 0.3}
                            />
                            {/* Car dot */}
                            <circle
                                cx={car.x}
                                cy={car.y}
                                r={isSelected ? 2 : 1.3}
                                fill={car.color}
                                className="transition-all duration-500"
                            >
                                <title>{car.acronym} #{car.driverNumber}</title>
                            </circle>
                            {/* Label on hover/select */}
                            {isSelected && (
                                <text
                                    x={car.x}
                                    y={car.y - 4}
                                    textAnchor="middle"
                                    fill={car.color}
                                    fontSize="2.8"
                                    fontWeight="bold"
                                    fontFamily="monospace"
                                    className="select-none"
                                >
                                    {car.acronym}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Car legend */}
            <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                {cars.map(car => (
                    <button
                        key={car.driverNumber}
                        onClick={() => setSelectedCar(selectedCar === car.driverNumber ? null : car.driverNumber)}
                        aria-pressed={selectedCar === car.driverNumber}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border transition-all min-h-[32px] min-w-[32px] ${
                            selectedCar === car.driverNumber
                                ? "border-white/30 bg-white/10 text-white"
                                : "border-transparent text-slate-500 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: car.color }} />
                        {car.acronym}
                    </button>
                ))}
            </div>
        </div>
    );
}
