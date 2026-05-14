// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Renderer, Program, Mesh, Triangle, Vec2, RenderTarget } from "ogl";
import Lenis from "lenis";
import { 
    Search, Shield, Cpu, ArrowRight, Activity, 
    Mail, User, MessageSquare, Database, Target, 
    Zap, Send, Check, Loader2, ChevronDown, Clock, Crosshair, MapPin
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILS ---
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const formatUnixDate = (timestamp: string) => {
    if (!timestamp) return "Unknown";
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString("en-US", { 
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

// --- 14KB IMAGE INTERCEPTOR ---
const SafeImage = ({ id, className }: { id: number | string, className?: string }) => {
    const [src, setSrc] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(true);

    useEffect(() => {
        if (!id) {
            setIsValid(false);
            return;
        }
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
            <div className={cn("bg-white/5 border border-white/10 rounded-xl animate-pulse flex items-center justify-center h-24", className)}>
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
        { name: "ABOUT", href: "#about" },
        { name: "CONTACT", href: "#contact" },
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
                        "relative px-4 md:px-6 py-2 text-xs tracking-widest font-bold uppercase transition-colors duration-300 rounded-full",
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
            clearTimeout(window.stopTimer);
            window.stopTimer = setTimeout(() => { isMoving = 0; }, 100);
        }
        window.addEventListener("mousemove", e => updateMouse(e.clientX, e.clientY));

        let lastScroll = window.scrollY;
        const handleScrollMove = () => {
            const current = window.scrollY;
            const delta = current - lastScroll;
            lastScroll = current;
            targetMouse.set(0.5, 0.5 + (delta * 0.002));
            isMoving = 1.0;
            clearTimeout(window.scrollTimer);
            window.scrollTimer = setTimeout(() => { isMoving = 0; }, 150);
        };
        window.addEventListener("scroll", handleScrollMove);

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

        return () => { 
            cancelAnimationFrame(animationId); 
            window.removeEventListener("resize", resize); 
            window.removeEventListener("scroll", handleScrollMove);
            gl.getExtension("WEBGL_lose_context")?.loseContext(); 
        };
    }, []);

    return <div ref={containerRef} className="absolute inset-0 z-0 opacity-50" />;
};

// --- CONTACT FORM W/ LIVE API FETCH ---
const ContactForm = () => {
    const [status, setStatus] = useState("idle");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status !== "idle") return;
        
        setStatus("loading");
        
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });

            if (response.ok) {
                setStatus("success");
                setName("");
                setEmail("");
                setMessage("");
                setTimeout(() => setStatus("idle"), 4000);
            } else {
                setStatus("idle");
                alert("Transmission Failed. Secure connection lost.");
            }
        } catch (error) {
            setStatus("idle");
            alert("Transmission Failed. Check network connection.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex justify-center mb-8">
                <div className="bg-white/10 p-4 rounded-full">
                    <MessageSquare className="w-8 h-8 text-white" />
                </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-8 text-center capitalize">Establish Secure Connection</h2>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input 
                        required 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="YOUR NAME" 
                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-cyan-400 transition-colors placeholder:text-neutral-600" 
                    />
                </div>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input 
                        required 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="YOUR EMAIL" 
                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-cyan-400 transition-colors placeholder:text-neutral-600" 
                    />
                </div>
                <textarea 
                    required 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="WRITE YOUR MESSAGE..." 
                    rows={5} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-cyan-400 transition-colors resize-none placeholder:text-neutral-600" 
                />
                
                <div className="flex justify-center pt-4">
                    <button
                        type="submit"
                        disabled={status !== "idle"}
                        className={cn(
                            "relative flex items-center justify-center h-14 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden",
                            status === "idle" ? "bg-white text-black w-full hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,255,255,0.4)]" :
                            status === "loading" ? "bg-zinc-800 text-white w-14 rounded-full" :
                            "bg-emerald-500 text-white w-full shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                        )}
                    >
                        <AnimatePresence mode="wait">
                            {status === "idle" && (
                                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                    <span>SEND MESSAGE</span> <Send size={18} />
                                </motion.div>
                            )}
                            {status === "loading" && (
                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <Loader2 size={20} className="animate-spin" />
                                </motion.div>
                            )}
                            {status === "success" && (
                                <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                    <span>SENT!</span> <Check size={18} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- MASTER APPLICATION ---
export default function FFInsights() {
    const [activeSection, setActiveSection] = useState("info");
    const [uid, setUid] = useState("");
    const [region, setRegion] = useState("IND");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [playerData, setPlayerData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [bgKey, setBgKey] = useState(0);

    // Forces WebGL to reboot perfectly if the user minimizes the browser
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                setBgKey(prev => prev + 1);
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    useEffect(() => {
        const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
        const onScroll = () => {
            const sections = ["info", "stats", "about", "contact"];
            const scrollPos = window.scrollY + window.innerHeight / 2;
            
            sections.forEach((id) => {
                const el = document.getElementById(id);
                if (el && scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight) {
                    setActiveSection(id);
                }
            });

            if ((window.innerHeight + Math.round(window.scrollY)) >= document.body.offsetHeight - 50) {
                setActiveSection("contact");
            }
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
            
            // CAPITAL D BUG FIX
            if (json.Data) {
                setPlayerData(json.Data);
            } else {
                alert("Data extraction failed or UID not found.");
            }
        } catch (error) {
            console.error("Extraction Failed", error);
            alert("API Connection Failed");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30">
            <AppleGlassNav activeSection={activeSection} />

            <section id="info" className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
                <BioFluidBackground key={bgKey} />
                <div className="relative z-10 flex flex-col items-center text-center px-6">
                    <p className="text-sm font-mono tracking-[0.5em] text-cyan-400 uppercase animate-pulse mb-6">Decode The Void</p>
                    <h1 className="text-6xl md:text-9xl font-black tracking-tighter">
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">
                            FF INSIGHTS
                        </span>
                    </h1>
                    <p className="mt-6 max-w-xl text-neutral-400 font-light">Harness The Raw Telemetry Of The Battlefield. Real Time Player Insights And Kinetic Data Analysis.</p>
                    
                    <div className="mt-12 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-[0_0_40px_rgba(0,255,255,0.05)] focus-within:shadow-[0_0_40px_rgba(0,255,255,0.2)] transition-all">
                        
                        <div className="relative flex items-center h-full border-r border-white/10">
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="bg-transparent text-white px-4 h-full flex items-center gap-2 outline-none uppercase font-bold text-sm tracking-widest"
                            >
                                {region}
                                <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                                    <ChevronDown className="w-4 h-4 text-cyan-400" />
                                </motion.div>
                            </button>
                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: -10 }} 
                                        className="absolute top-[120%] left-0 w-28 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 flex flex-col"
                                    >
                                        {["IND", "BD", "SG"].map((r) => (
                                            <button 
                                                key={r}
                                                onClick={() => { setRegion(r); setIsDropdownOpen(false); }}
                                                className={cn(
                                                    "px-4 py-3 text-left transition-colors uppercase font-bold tracking-widest text-sm hover:bg-white/5", 
                                                    region === r ? "text-cyan-400 bg-white/5" : "text-white"
                                                )}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <input value={uid} onChange={(e) => setUid(e.target.value)} type="number" placeholder="Enter Target UID" className="flex-1 bg-transparent px-4 outline-none placeholder:text-neutral-600 capitalize" />
                        <button onClick={fetchProfile} className="bg-white text-black p-4 rounded-xl hover:bg-cyan-400 transition-colors">
                            {loading ? <Cpu className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {playerData && (
                    <motion.section initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} className="relative z-20 max-w-7xl mx-auto px-6 py-24 pb-48 space-y-8">
                        
                        {/* CORE STATS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden">
                                <div className="absolute -right-10 -top-10 text-white/5 pointer-events-none">
                                    <User size={200} />
                                </div>
                                <h2 className="text-3xl font-bold mb-8 text-cyan-400">Player Identity</h2>
                                <div className="space-y-6 relative z-10">
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-neutral-500">Nickname</span>
                                        <span className="font-bold">{playerData.basicInfo?.nickname}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-neutral-500">UID</span>
                                        <span className="font-mono font-bold text-cyan-300">{playerData.basicInfo?.accountId}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-neutral-500">Region</span>
                                        <span className="font-bold uppercase">{playerData.basicInfo?.region}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-neutral-500">Created On</span>
                                        <span className="font-mono text-sm">{formatUnixDate(playerData.basicInfo?.createAt)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-neutral-500">Last Login</span>
                                        <span className="font-mono text-sm">{formatUnixDate(playerData.basicInfo?.lastLoginAt)} ({playerData.basicInfo?.releaseVersion})</span>
                                    </div>
                                    <div>
                                        <span className="text-neutral-500 block mb-2">Bio / Signature</span>
                                        <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-sm font-mono text-neutral-300 whitespace-pre-wrap">
                                            {playerData.socialInfo?.socialHighlight || "No Bio Available"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden">
                                <div className="absolute -right-10 -bottom-10 text-white/5 pointer-events-none">
                                    <Target size={200} />
                                </div>
                                <h2 className="text-3xl font-bold mb-8 text-indigo-400">Combat Metrics</h2>
                                <div className="grid grid-cols-2 gap-6 relative z-10">
                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                        <p className="text-neutral-500 text-sm mb-1">Level</p>
                                        <p className="text-3xl font-black">{playerData.basicInfo?.level}</p>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                        <p className="text-neutral-500 text-sm mb-1">Honor Score</p>
                                        <p className={cn("text-3xl font-black", playerData.creditScoreInfo?.score === 100 ? "text-emerald-400" : "text-yellow-400")}>
                                            {playerData.creditScoreInfo?.score || "N/A"}
                                        </p>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                        <p className="text-neutral-500 text-sm mb-1">BR Rank Points</p>
                                        <p className="text-2xl font-bold">{playerData.basicInfo?.rankingPoints}</p>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                        <p className="text-neutral-500 text-sm mb-1">CS Rank Points</p>
                                        <p className="text-2xl font-bold">{playerData.basicInfo?.csRankingPoints}</p>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                        <p className="text-neutral-500 text-sm mb-1">Likes</p>
                                        <p className="text-2xl font-bold text-pink-400">{playerData.basicInfo?.liked}</p>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                        <p className="text-neutral-500 text-sm mb-1">Pass Level</p>
                                        <p className="text-2xl font-bold">{playerData.basicInfo?.badgeCnt}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* LOADOUTS & VISUALS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                                <h2 className="text-xl font-bold mb-6 text-neutral-300">Active Outfit</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {playerData.profileInfo?.cosmeticItems?.map((id: number, i: number) => (
                                        <SafeImage key={`cosmetic-${i}`} id={id} className="w-full h-32 object-contain" />
                                    ))}
                                    {(!playerData.profileInfo?.cosmeticItems || playerData.profileInfo.cosmeticItems.length === 0) && (
                                        <p className="text-neutral-600 text-sm col-span-2 text-center py-8">No outfit data extracted.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                                <h2 className="text-xl font-bold mb-6 text-neutral-300">Equipped Skills</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {playerData.profileInfo?.equippedSkills?.map((id: number, i: number) => (
                                        <SafeImage key={`skill-${i}`} id={id} className="w-full h-24 object-contain" />
                                    ))}
                                    {(!playerData.profileInfo?.equippedSkills || playerData.profileInfo.equippedSkills.length === 0) && (
                                        <p className="text-neutral-600 text-sm col-span-2 text-center py-8">No skill data extracted.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                                <h2 className="text-xl font-bold mb-6 text-neutral-300">Weapon Loadout</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {playerData.basicInfo?.weaponSkinShows?.map((id: number, i: number) => (
                                        <SafeImage key={`weapon-${i}`} id={id} className="w-full h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                                    ))}
                                    {(!playerData.basicInfo?.weaponSkinShows || playerData.basicInfo.weaponSkinShows.length === 0) && (
                                        <p className="text-neutral-600 text-sm col-span-2 text-center py-8">No weapons extracted.</p>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* COMPANION & GUILD */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                                <h2 className="text-2xl font-bold mb-6 text-yellow-400">Companion</h2>
                                {playerData.petInfo ? (
                                    <>
                                        <div className="flex justify-between items-end mb-6">
                                            <div>
                                                <p className="text-neutral-500 text-sm">Name</p>
                                                <p className="text-xl font-bold">{playerData.petInfo.petName || "Unnamed"}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-neutral-500 text-sm">Level</p>
                                                <p className="text-xl font-bold">{playerData.petInfo.level}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-center gap-6 mt-4">
                                            {playerData.petInfo.skinId && <SafeImage id={playerData.petInfo.skinId} className="w-32 h-32 object-contain drop-shadow-2xl" />}
                                            {playerData.petInfo.selectedSkillId && <SafeImage id={playerData.petInfo.selectedSkillId} className="w-16 h-16 object-contain self-end" />}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-neutral-600 text-center py-10">No active companion.</p>
                                )}
                            </div>
                            
                            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-md">
                                <h2 className="text-2xl font-bold mb-8 text-indigo-400">Guild Architecture</h2>
                                {playerData.clanBasicInfo ? (
                                    <>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                                            <div className="md:col-span-2">
                                                <p className="text-neutral-500 text-sm">Clan Name</p>
                                                <p className="text-3xl font-black text-white drop-shadow-md">{playerData.clanBasicInfo.clanName}</p>
                                            </div>
                                            <div>
                                                <p className="text-neutral-500 text-sm">Level</p>
                                                <p className="text-2xl font-bold">{playerData.clanBasicInfo.clanLevel}</p>
                                            </div>
                                            <div>
                                                <p className="text-neutral-500 text-sm">Capacity</p>
                                                <p className="text-2xl font-bold text-cyan-300">{playerData.clanBasicInfo.currentMembers} / {playerData.clanBasicInfo.maxMembers}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-black/30 rounded-2xl p-6 border border-white/5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Shield className="w-5 h-5 text-indigo-400" />
                                                <h3 className="text-lg font-bold text-neutral-200">Captain's Intel</h3>
                                            </div>
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div>
                                                    <p className="text-neutral-400">Name: <span className="text-white font-bold">{playerData.captainBasicInfo?.nickname}</span></p>
                                                    <p className="text-neutral-400">UID: <span className="text-white font-mono">{playerData.captainBasicInfo?.accountId}</span></p>
                                                </div>
                                                <div className="flex gap-3">
                                                    {playerData.captainBasicInfo?.weaponSkinShows?.map((id: number, i: number) => (
                                                        <SafeImage key={`capt-weap-${i}`} id={id} className="w-16 h-16 object-contain bg-white/5 rounded-lg p-2 border border-white/10" />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-neutral-600 text-center py-20">Player is a lone wolf (No Guild).</p>
                                )}
                            </div>
                        </div>

                    </motion.section>
                )}
            </AnimatePresence>

            <section id="stats" className="relative py-48 bg-[#050505] overflow-hidden border-y border-white/5 flex flex-col items-center justify-center">
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
                <h2 className="text-5xl font-black tracking-tight text-white mb-8 capitalize">Combat Statistics</h2>
                <div className="w-full max-w-3xl bg-black/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent animate-pulse" />
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h3 className="text-3xl font-bold text-white mb-2 capitalize">Endpoint Restricted</h3>
                    <p className="text-neutral-400 capitalize">The Advanced Telemetry Endpoint Is Currently Undergoing Encryption Upgrades. Standby For Future Deployment.</p>
                </div>
            </section>

            <section id="about" className="py-32 px-6 relative z-10 bg-[#050505]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 capitalize">What Is Special In This Tool?</h2>
                        <p className="text-neutral-400 max-w-2xl mx-auto text-lg capitalize">Players Can Gain Deep Information Via UID Of An User By Accessing This Tool. Just Visit This Page, Type The UID You Want To Inspect, And Click Submit. Account Details Will Appear Instantly.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: <User className="w-6 h-6 text-cyan-400" />, title: "Basic Identity", desc: "Nickname, Level, Experience, And Custom Bio Information." },
                            { icon: <Target className="w-6 h-6 text-indigo-400" />, title: "Combat Ranks", desc: "Current Battle Royale And Clash Squad Ranks With Precision Points." },
                            { icon: <Zap className="w-6 h-6 text-purple-400" />, title: "Account Status", desc: "Honor Score, Last Login Time, And Exact Account Creation Date." },
                            { icon: <Database className="w-6 h-6 text-emerald-400" />, title: "Assets & Guild", desc: "Booyah Pass Level, Equipped Pet Details, And Full Guild Information." }
                        ].map((item, i) => (
                            <motion.div key={i} whileHover={{ y: -10 }} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm hover:bg-white/10 transition-colors">
                                <div className="bg-black/50 rounded-2xl p-4 inline-block mb-6 border border-white/5">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 capitalize">{item.title}</h3>
                                <p className="text-neutral-400 text-sm capitalize">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="contact" className="py-32 px-6 relative z-10 bg-[#050505]">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-widest uppercase">CONTACT US</h2>
                </div>
                <ContactForm />
            </section>

            <footer className="bg-[#050505] pt-16 pb-12 px-6 border-t border-white/5 text-center relative z-10">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-6 py-2">
                        <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                        <span className="text-emerald-500 font-mono text-sm capitalize">Server Status: Operational</span>
                    </div>
                </div>
                <p className="text-white font-medium text-sm mb-4">© 2026 FF INSIGHTS. All Rights Reserved.</p>
                <p className="text-neutral-600 text-xs max-w-2xl mx-auto leading-relaxed capitalize">Disclaimer: This Is An Unofficial API And Is Not Affiliated With, Endorsed, Sponsored, Or Specifically Approved By Garena.</p>
            </footer>
        </div>
    );
}
