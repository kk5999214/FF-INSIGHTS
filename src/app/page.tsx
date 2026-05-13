"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Renderer, Program, Mesh, Triangle, Vec2, RenderTarget } from "ogl";
import Lenis from "lenis";
import { Search, Shield, Zap, Cpu, ArrowRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILS ---
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- 14KB IMAGE INTERCEPTOR ---
const SafeImage = ({ id, className }: { id: number | string, className?: string }) => {
    const [src, setSrc] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(true);

    useEffect(() => {
        const checkImage = async () => {
            const url = `https://iconapi.wasmer.app/${id}`;
            try {
                const res = await fetch(url, { method: "HEAD" });
                const size = res.headers.get("content-length");
                if (size === "14498") {
                    setIsValid(false);
                } else {
                    setSrc(url);
                }
            } catch (error) {
                setSrc(url); 
            }
        };
        checkImage();
    }, [id]);

    if (!isValid || !src) {
        return (
            <div className={cn("bg-white/5 border border-white/10 rounded-xl animate-pulse flex items-center justify-center", className)}>
                <Shield className="w-6 h-6 text-white/20" />
            </div>
        );
    }

    return (
        <motion.img 
            src={src} 
            className={className} 
            onError={() => setIsValid(false)}
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            whileHover={{ scale: 1.1, rotateX: 15, rotateY: 15 }}
            style={{ transformStyle: "preserve-3d" }}
        />
    );
};

// --- NAVIGATION ---
const AppleGlassNav = ({ activeSection }: { activeSection: string }) => {
    const items = [
        { name: "INFO", href: "#info" },
        { name: "STATS", href: "#stats" },
        { name: "ABOUT US", href: "#about" },
        { name: "CONTACT US", href: "#contact" },
    ];

    const handleScroll = (id: string) => {
        const element = document.querySelector(id);
        if (element) element.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex p-1.5 gap-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
            {items.map((item) => (
                <button
                    key={item.name}
                    onClick={() => handleScroll(item.href)}
                    className={cn(
                        "relative px-6 py-2 text-xs tracking-widest font-bold uppercase transition-colors duration-300 rounded-full",
                        activeSection === item.name.toLowerCase() ? "text-black" : "text-white/60 hover:text-white"
                    )}
                >
                    {activeSection === item.name.toLowerCase() && (
                        <motion.div
                            layoutId="glass-active"
                            className="absolute inset-0 bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)] rounded-full"
                            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                        />
                    )}
                    <span className="relative z-10">{item.name}</span>
                </button>
            ))}
        </nav>
    );
};

// --- WEBGL BACKGROUND ---
const BioFluidBackground = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const renderer = new Renderer({ alpha: false, dpr: Math.min(window.devicePixelRatio, 2) });
        const gl = renderer.gl;

        gl.getExtension("OES_texture_float");
        gl.getExtension("OES_texture_float_linear");

        const simFragment = `
            precision highp float;
            uniform sampler2D uTexture;
            uniform float uTime;
            uniform vec2 uMouse;
            uniform float uMouseActive;
            uniform vec2 uResolution;
            uniform float uAspect;
            varying vec2 vUv;
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);
                vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
                i = mod289(i);
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m ; m = m*m ;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }
            vec2 curl(vec2 p) {
                float eps = 0.001; float n1, n2, a, b;
                n1 = snoise(p + vec2(0, eps)); n2 = snoise(p - vec2(0, eps)); a = (n1 - n2) / (2.0 * eps);
                n1 = snoise(p + vec2(eps, 0)); n2 = snoise(p - vec2(eps, 0)); b = (n1 - n2) / (2.0 * eps);
                return vec2(a, -b);
            }
            void main() {
                vec2 uv = vUv;
                vec2 flow = curl(uv * 3.0 + uTime * 0.1);
                vec2 newUv = uv - flow * 0.004; 
                newUv -= 0.5; newUv *= 0.998; newUv += 0.5;
                vec4 advected = texture2D(uTexture, newUv);
                vec2 mouse = uMouse; mouse.x *= uAspect;
                vec2 curUv = uv; curUv.x *= uAspect;
                float d = length(curUv - mouse);
                float brush = smoothstep(0.04, 0.0, d) * uMouseActive;
                vec3 inkColor = 0.5 + 0.5 * cos(uTime + uv.xyx + vec3(0, 2, 4));
                vec3 finalColor = advected.rgb + (inkColor * brush * 2.5);
                finalColor *= 0.98;
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        const displayFragment = `
            precision highp float;
            uniform sampler2D uTexture;
            varying vec2 vUv;
            void main() {
                vec4 color = texture2D(uTexture, vUv);
                vec3 c = pow(color.rgb, vec3(1.2)); 
                float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
                c += noise * 0.01;
                gl_FragColor = vec4(c, 1.0);
            }
        `;

        const geometry = new Triangle(gl);
        const simProgram = new Program(gl, {
            vertex: `attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 0, 1); }`,
            fragment: simFragment,
            uniforms: { uTexture: { value: null }, uTime: { value: 0 }, uMouse: { value: new Vec2(0, 0) }, uMouseActive: { value: 0 }, uResolution: { value: new Vec2(0, 0) }, uAspect: { value: 1 } },
        });

        const displayProgram = new Program(gl, {
            vertex: `attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 0, 1); }`,
            fragment: displayFragment,
            uniforms: { uTexture: { value: null } },
        });

        const simMesh = new Mesh(gl, { geometry, program: simProgram });
        const displayMesh = new Mesh(gl, { geometry, program: displayProgram });

        let fboRead = new RenderTarget(gl, { width: window.innerWidth >> 1, height: window.innerHeight >> 1, type: gl.HALF_FLOAT || gl.FLOAT, internalFormat: gl.RGBA16F || gl.RGBA, minFilter: gl.LINEAR, magFilter: gl.LINEAR });
        let fboWrite = new RenderTarget(gl, { width: window.innerWidth >> 1, height: window.innerHeight >> 1, type: gl.HALF_FLOAT || gl.FLOAT, internalFormat: gl.RGBA16F || gl.RGBA, minFilter: gl.LINEAR, magFilter: gl.LINEAR });

        const mouse = new Vec2(0, 0);
        const targetMouse = new Vec2(0, 0);
        let isMoving = 0;

        function resize() {
            const w = container.offsetWidth; const h = container.offsetHeight;
            renderer.setSize(w, h);
            fboRead.setSize(w >> 1, h >> 1); fboWrite.setSize(w >> 1, h >> 1);
            simProgram.uniforms.uResolution.value.set(w, h); simProgram.uniforms.uAspect.value = w / h;
        }
        window.addEventListener("resize", resize); resize();

        function updateMouse(x: number, y: number) {
            targetMouse.set(x / gl.canvas.width, 1.0 - y / gl.canvas.height);
            isMoving = 1.0;
            clearTimeout((window as any).stopTimer);
            (window as any).stopTimer = setTimeout(() => { isMoving = 0; }, 100);
        }
        window.addEventListener("mousemove", e => updateMouse(e.clientX, e.clientY));

        let animationId: number;
        function update(t: number) {
            animationId = requestAnimationFrame(update);
            mouse.lerp(targetMouse, 0.2);
            simProgram.uniforms.uTime.value = t * 0.001;
            simProgram.uniforms.uMouse.value.copy(mouse);
            simProgram.uniforms.uMouseActive.value += (isMoving - simProgram.uniforms.uMouseActive.value) * 0.1;
            simProgram.uniforms.uTexture.value = fboRead.texture;
            renderer.render({ scene: simMesh, target: fboWrite });
            displayProgram.uniforms.uTexture.value = fboWrite.texture;
            renderer.render({ scene: displayMesh });
            const temp = fboRead; fboRead = fboWrite; fboWrite = temp;
        }
        animationId = requestAnimationFrame(update);
        container.appendChild(gl.canvas);

        return () => { cancelAnimationFrame(animationId); window.removeEventListener("resize", resize); gl.getExtension("WEBGL_lose_context")?.loseContext(); };
    }, []);

    return <div ref={containerRef} className="absolute inset-0 z-0 opacity-50" />;
};

// --- MASTER APPLICATION ---
export default function FFInsights() {
    const [activeSection, setActiveSection] = useState("info");
    const [uid, setUid] = useState("");
    const [region, setRegion] = useState("IND");
    const [playerData, setPlayerData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
        const onScroll = () => {
            const sections = ["info", "stats", "about", "contact"];
            const scrollPos = window.scrollY + 300;
            sections.forEach((id) => {
                const el = document.getElementById(id);
                if (el && scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight) {
                    setActiveSection(id);
                }
            });
        };
        window.addEventListener("scroll", onScroll);
        function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
        return () => { lenis.destroy(); window.removeEventListener("scroll", onScroll); };
    }, []);

    const fetchProfile = async () => {
        if (!uid) return;
        setLoading(true);
        try {
            const res = await fetch(`https://floating-savannah-82139-2308889ea31f.herokuapp.com/api/info?uid=${uid}&region=${region}`);
            const json = await res.json();
            if (json.data) setPlayerData(json.data);
        } catch (error) {
            console.error("Extraction Failed");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30">
            <AppleGlassNav activeSection={activeSection} />

            {/* HERO & SEARCH MODULE */}
            <section id="info" className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
                <BioFluidBackground />
                <div className="relative z-10 flex flex-col items-center text-center px-6">
                    <p className="text-sm font-mono tracking-[0.5em] text-cyan-400 uppercase animate-pulse mb-6">Decode The Void</p>
                    <h1 className="text-6xl md:text-9xl font-black tracking-tighter">FF <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">INSIGHTS</span></h1>
                    <p className="mt-6 max-w-xl text-neutral-400 font-light">Harness The Raw Telemetry Of The Battlefield. Real Time Player Insights And Kinetic Data Analysis.</p>
                    
                    <div className="mt-12 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-[0_0_40px_rgba(0,255,255,0.05)] focus-within:shadow-[0_0_40px_rgba(0,255,255,0.2)] transition-all">
                        <select value={region} onChange={(e) => setRegion(e.target.value)} className="bg-transparent text-white border-r border-white/10 px-4 outline-none appearance-none">
                            <option value="IND">IND</option><option value="BD">BD</option><option value="SG">SG</option>
                        </select>
                        <input value={uid} onChange={(e) => setUid(e.target.value)} type="number" placeholder="Enter Target UID" className="flex-1 bg-transparent px-4 outline-none placeholder:text-neutral-600" />
                        <button onClick={fetchProfile} className="bg-white text-black p-4 rounded-xl hover:bg-cyan-400 transition-colors">
                            {loading ? <Cpu className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </section>

            {/* DATA GRID (BENTO BOX LAYOUT) */}
            <AnimatePresence>
                {playerData && (
                    <motion.section initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} className="relative z-20 max-w-7xl mx-auto px-6 py-24 pb-48 space-y-8">
                        
                        {/* ROW 1: IDENTITY */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                            <h2 className="text-3xl font-bold mb-6 text-cyan-400">Player Identity</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div><p className="text-neutral-500 text-sm">Nickname</p><p className="text-xl font-bold">{playerData.basicInfo?.nickname}</p></div>
                                <div><p className="text-neutral-500 text-sm">Level</p><p className="text-xl font-bold">{playerData.basicInfo?.level}</p></div>
                                <div><p className="text-neutral-500 text-sm">Likes</p><p className="text-xl font-bold">{playerData.basicInfo?.liked}</p></div>
                                <div><p className="text-neutral-500 text-sm">BR Rank</p><p className="text-xl font-bold">{playerData.basicInfo?.rankingPoints}</p></div>
                            </div>
                        </div>

                        {/* ROW 2: OUTFITS & EQUIPMENT */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                                <h2 className="text-2xl font-bold mb-6">Active Outfit</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    {playerData.profileInfo?.cosmeticItems?.map((id: number, i: number) => (
                                        <SafeImage key={i} id={id} className="w-full h-32 object-contain" />
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                                <h2 className="text-2xl font-bold mb-6">Weapon Loadout</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {playerData.basicInfo?.weaponSkinShows?.map((id: number, i: number) => (
                                        <SafeImage key={i} id={id} className="w-full h-32 object-contain" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ROW 3 & 4: COMPANIONS & GUILD */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                                <h2 className="text-2xl font-bold mb-4">Companion</h2>
                                <p className="text-neutral-400">Name: {playerData.petInfo?.petName}</p>
                                <p className="text-neutral-400">Level: {playerData.petInfo?.level}</p>
                                <div className="flex gap-4 mt-4">
                                    <SafeImage id={playerData.petInfo?.skinId} className="w-24 h-24 object-contain" />
                                    <SafeImage id={playerData.petInfo?.petId} className="w-24 h-24 object-contain" />
                                </div>
                            </div>
                            
                            <div className="col-span-2 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-md">
                                <h2 className="text-2xl font-bold mb-6 text-indigo-400">Guild Architecture</h2>
                                <div className="flex justify-between items-center mb-6">
                                    <div><p className="text-neutral-500 text-sm">Clan Name</p><p className="text-2xl font-black">{playerData.clanBasicInfo?.clanName}</p></div>
                                    <div className="text-right"><p className="text-neutral-500 text-sm">Capacity</p><p className="text-2xl font-black">{playerData.clanBasicInfo?.currentMembers} / {playerData.clanBasicInfo?.maxMembers}</p></div>
                                </div>
                                <div className="w-full h-px bg-white/10 my-4" />
                                <h3 className="text-lg font-bold text-neutral-300">Captain Arsenal</h3>
                                <div className="flex gap-4 mt-4">
                                    {playerData.captainBasicInfo?.weaponSkinShows?.map((id: number, i: number) => (
                                        <SafeImage key={i} id={id} className="w-24 h-24 object-contain" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* DUMMY STATS SECTION */}
            <section id="stats" className="relative py-48 bg-[#050505] overflow-hidden border-y border-white/5 flex flex-col items-center justify-center">
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
                <h2 className="text-5xl font-black tracking-tight text-white mb-8">Combat Statistics</h2>
                <div className="w-full max-w-3xl bg-black/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent animate-pulse" />
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h3 className="text-3xl font-bold text-white mb-2">Endpoint Restricted</h3>
                    <p className="text-neutral-400">The Advanced Telemetry Endpoint Is Currently Undergoing Encryption Upgrades. Standby For Future Deployment.</p>
                </div>
            </section>

            {/* ABOUT US SECTION */}
            <section id="about" className="py-48 px-6 text-center">
                <h2 className="text-4xl md:text-6xl font-light tracking-tight text-white">
                    <span className="text-neutral-500">We Do Not Just Display Data.</span> <br />
                    We Decode The Matrix. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 font-bold">Welcome To The Empire.</span>
                </h2>
            </section>

            {/* CONTACT US SECTION */}
            <footer id="contact" className="bg-[#050505] pt-32 pb-12 px-6 relative border-t border-white/10 text-center">
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-[15vw] font-black uppercase tracking-tighter text-white/[0.02] pointer-events-none">INSIGHTS</span>
                <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
                    <h2 className="text-4xl font-bold text-white mb-8">Establish Neural Link</h2>
                    <button className="group relative flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-black transition-all hover:bg-neutral-200">
                        <span className="font-semibold">Join Telegram Network</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    <div className="w-full h-px bg-white/10 my-16" />
                    <p className="text-sm font-medium text-neutral-500 tracking-wider uppercase">Engineered By Bittu Dev 👑</p>
                </div>
            </footer>
        </div>
    );
}
