"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { F1Images } from "@/lib/api/f1-client";
import { PageHeader } from "@/components/ui/page-header";
import { TEAM_CARS, DRIVER_PORTRAITS } from "@/lib/api/assets";
import { getTeamColor } from "@/lib/utils";
import { PageTransition } from "@/components/ui/page-transition";

interface Constructor {
    position: string;
    points: string;
    wins: string;
    Constructor: { constructorId: string; name: string };
}

interface DriverStanding {
    Driver: { driverId: string; code: string; givenName: string; familyName: string; permanentNumber: string; nationality: string };
    Constructors: { constructorId: string; name: string }[];
}

interface TeamsClientProps {
    initialConstructors: Constructor[];
    initialDrivers: DriverStanding[];
}

export default function TeamsClient({ initialConstructors, initialDrivers }: TeamsClientProps) {
    // Build the team drivers mapping from the initial drivers data
    const initialTeamDrivers: Record<string, string[]> = {};
    for (const drv of initialDrivers) {
        const tId = drv.Constructors?.[0]?.constructorId;
        if (tId) {
            if (!initialTeamDrivers[tId]) initialTeamDrivers[tId] = [];
            const code = drv.Driver.code || drv.Driver.familyName.substring(0, 3).toUpperCase();
            initialTeamDrivers[tId].push(code);
        }
    }

    const [constructors] = useState<Constructor[]>(initialConstructors);
    const [teamDrivers] = useState<Record<string, string[]>>(initialTeamDrivers);

    return (
        <PageTransition>
        <div className="bg-transparent font-display pb-20 relative overflow-hidden flex flex-col items-center">

            {/* Cinematic Background Glows */}
            <div className="absolute top-[20%] right-[-10%] w-[1000px] h-[1000px] bg-[#27F4D2]/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-[1600px] mx-auto w-full px-6 md:px-12 relative z-10 flex-1 flex flex-col overflow-hidden">
                
                <PageHeader title="CONSTRUCTOR" subtitle="CHAMPIONSHIP" />

                {(() => {
                    const maxPoints = Math.max(1, parseInt(constructors[0]?.points || "1"));
                    return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 gap-y-12 mt-8 pb-10 w-full">
                    {constructors.map((team, idx) => {
                        const teamColor = getTeamColor(team.Constructor.constructorId);
                        const isP1 = team.position === "1";
                        const isP2 = team.position === "2";
                        const isP3 = team.position === "3";
                        const drivers = teamDrivers[team.Constructor.constructorId] || [];
                        const carImg = TEAM_CARS[team.Constructor.constructorId] || TEAM_CARS["generic"];
                        
                        return (
                            <motion.div 
                                key={team.Constructor.constructorId}
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: Math.min(idx * 0.03, 0.5), duration: 0.6 }}
                                className={`glass carbon-card group relative border ${isP1 ? "border-[#D4AF37]/40" : "border-white/5"} rounded-3xl overflow-visible transition-all duration-500 hover:-translate-y-2`}
                                style={{ boxShadow: `0 8px 32px 0 rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 40px ${teamColor}33` }}
                            >
                                {/* Team Color Top Accent */}
                                <div className="absolute top-0 left-0 right-0 h-2 rounded-t-3xl shadow-[0_0_20px_currentColor]" style={{ backgroundColor: teamColor, color: teamColor }} />

                                {/* P1 LEADERS Badge */}
                                {isP1 && (
                                    <div className="absolute top-4 right-4 z-30">
                                        <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                            LEADERS
                                        </span>
                                    </div>
                                )}

                                {/* Position Medal */}
                                <div className={`absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center text-base font-black font-mono z-30 shadow-lg ${
                                    isP1 ? "bg-[#D4AF37] text-black" :
                                    isP2 ? "bg-[#C0C0C0] text-black" :
                                    isP3 ? "bg-[#CD7F32] text-black" :
                                    "bg-white/10 text-white/70"
                                }`}>
                                    {team.position}
                                </div>
                                
                                {/* Subtle Radial Gradient Overlay */}
                                <div className={`absolute inset-0 z-0 ${isP1 ? "opacity-20" : "opacity-10"} pointer-events-none rounded-3xl`} style={{ background: `radial-gradient(circle at 100% 50%, ${teamColor} 0%, transparent 60%)` }} />

                                <div className="p-10 relative z-10 flex flex-col h-full min-h-[280px] lg:min-h-[380px]">
                                    
                                    <div className="flex justify-between items-start mb-auto">
                                        <div>
                                            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-none shadow-black drop-shadow-lg font-f1">
                                                {team.Constructor.name}
                                            </h2>
                                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-3 font-f1">
                                                <span>POS {team.position}</span>
                                                <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: teamColor, color: teamColor }} />
                                                <span style={{ color: teamColor }}>{team.points} PTS</span>
                                                {parseInt(team.wins) > 0 && <>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffd700] shadow-[0_0_8px_#ffd700]" />
                                                    <span className="text-[#ffd700]">{team.wins} WIN{parseInt(team.wins) > 1 ? 'S' : ''}</span>
                                                </>}
                                            </div>
                                        </div>

                                        {/* Driver Portraits */}
                                        <div className="flex -space-x-4">
                                            {drivers.length > 0 ? drivers.map((drv, i) => (
                                                <div key={i} className="w-16 h-16 rounded-full border-2 border-white/20 shadow-[0_10px_20px_rgba(0,0,0,0.5)] overflow-hidden relative bg-[#111] transition-all duration-300 group-hover:border-white/60 group-hover:scale-125 group-hover:-translate-y-1" style={{ zIndex: 10 - i }}>
                                                    <img src={DRIVER_PORTRAITS[drv] || F1Images.getDriverHeadshot("generic")} alt={drv} className="w-full h-full object-cover object-top transform scale-125 translate-y-1" />
                                                </div>
                                            )) : (
                                                 <div className="w-16 h-16 rounded-full border-2 border-white/20 shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-center bg-[#111]">
                                                    <span className="material-symbols-outlined text-white/20">person</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Points Bar Visualization */}
                                    <div className="w-full h-1.5 rounded-full bg-white/5 mt-4 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${(parseInt(team.points) / maxPoints) * 100}%`,
                                                backgroundColor: teamColor,
                                            }}
                                        />
                                    </div>
                                    <div className="absolute bottom-6 right-[-5%] lg:right-[-10%] w-[110%] z-20 pointer-events-none h-64 flex items-center object-contain">
                                        <img 
                                            src={carImg} 
                                            alt={team.Constructor.name} 
                                            className="w-full h-full object-contain object-right origin-right filter drop-shadow-[0_30px_40px_rgba(0,0,0,0.8)] transition-transform duration-700 ease-out group-hover:translate-x-5 group-hover:scale-110 group-hover:-rotate-2" 
                                        />
                                    </div>
                                </div>
                                
                                {/* Large background position number */}
                                <div className="absolute bottom-4 left-6 text-[180px] font-black italic text-white/[0.03] leading-none pointer-events-none z-0 mix-blend-overlay font-f1 transition-opacity duration-500 group-hover:opacity-10">
                                    {team.position}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
                    );
                })()}
            </div>
        </div>
        </PageTransition>
    );
}
