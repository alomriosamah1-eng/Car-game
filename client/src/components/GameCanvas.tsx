import { useCallback, useEffect, useRef, useState } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Camera, CarFront, ChevronLeft, ChevronRight, Gauge, Headphones, Info, Languages, Pause, Play, RotateCcw, Settings2, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { createGameScene, type GameHandle } from "@/game/scene";
import { COLORS, DEFAULT_SNAPSHOT, formatDistance, formatRpm, formatSpeed, getVehicle, VEHICLES, type CameraMode, type CarId, type ControlMode, type GameSnapshot } from "@/game/types";

const copy = {
  ar: { drive: "قيادة هادئة. حضور قوي.", play: "ابدئي القيادة", garage: "المرآب", settings: "الإعدادات", music: "موسيقاي", map: "خريطة الساحل", explore: "جولة الغروب", controls: "أسلوب التحكم", buttons: "أزرار", wheel: "مقود", motion: "حركة الهاتف", speed: "السرعة", distance: "المسافة", camera: "الكاميرا", cockpit: "داخلية", chase: "خارجية", brake: "فرامل", throttle: "بنزين", selectCar: "اختاري سيارتك", close: "إغلاق", save: "حفظ", language: "العربية", engine: "صوت المحرك", effects: "المؤثرات", chooseMusic: "اختيار ملف صوتي", noMusic: "لم تختاري موسيقى بعد", reset: "إعادة الجولة", ready: "جاهزة للانطلاق", online: "تعمل محليًا بلا إنترنت", intro: "طريق ساحلي بإيقاعك الخاص" },
  en: { drive: "Quiet driving. Strong presence.", play: "Start driving", garage: "Garage", settings: "Settings", music: "My music", map: "Coastal route", explore: "Sunset loop", controls: "Control style", buttons: "Buttons", wheel: "Wheel", motion: "Motion", speed: "Speed", distance: "Distance", camera: "Camera", cockpit: "Cockpit", chase: "Exterior", brake: "Brake", throttle: "Throttle", selectCar: "Choose your car", close: "Close", save: "Save", language: "English", engine: "Engine sound", effects: "Effects", chooseMusic: "Choose audio file", noMusic: "No music selected", reset: "Reset drive", ready: "Ready to drive", online: "Offline by design", intro: "A coastal road at your own rhythm" },
};

type Panel = "home" | "garage" | "settings" | "music" | "info";

function sendInput(action: "throttle" | "brake" | "left" | "right", pressed: boolean) {
  window.dispatchEvent(new CustomEvent("veloura-input", { detail: { action, pressed } }));
}

function GlassButton({ children, onClick, active = false, className = "", ariaLabel }: { children: React.ReactNode; onClick?: () => void; active?: boolean; className?: string; ariaLabel?: string }) {
  return <button aria-label={ariaLabel} className={`glass-button ${active ? "is-active" : ""} ${className}`} onClick={onClick}>{children}</button>;
}

function SteeringWheel({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const update = useCallback((clientX: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const normalized = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width - 0.5) * 2));
    onChange(normalized);
  }, [onChange]);
  return <div ref={ref} className="steering-wheel" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); update(event.clientX); }} onPointerMove={(event) => { if (event.buttons) update(event.clientX); }} onPointerUp={() => onChange(0)} onPointerCancel={() => onChange(0)} style={{ transform: `rotate(${value * 34}deg)` }}><span className="wheel-spoke wheel-spoke-a" /><span className="wheel-spoke wheel-spoke-b" /><span className="wheel-center" /></div>;
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);
  const gameRef = useRef<GameHandle | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(DEFAULT_SNAPSHOT);
  const [panel, setPanel] = useState<Panel>("home");
  const [language, setLanguage] = useState<"ar" | "en">(() => (localStorage.getItem("veloura-language") as "ar" | "en" | null) ?? "ar");
  const [controlMode, setControlMode] = useState<ControlMode>(() => (localStorage.getItem("veloura-control") as ControlMode | null) ?? "buttons");
  const [camera, setCamera] = useState<CameraMode>(() => (localStorage.getItem("veloura-camera") as CameraMode | null) ?? "chase");
  const [carId, setCarId] = useState<CarId>(() => (localStorage.getItem("veloura-car") as CarId | null) ?? "aurelia");
  const [color, setColor] = useState(() => localStorage.getItem("veloura-color") ?? COLORS[0]);
  const [wheelValue, setWheelValue] = useState(0);
  const [engineOn, setEngineOn] = useState(true);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicName, setMusicName] = useState("");
  const [effectsVolume, setEffectsVolume] = useState(0.52);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const t = copy[language];
  const rtl = language === "ar";

  useEffect(() => { localStorage.setItem("veloura-language", language); }, [language]);
  useEffect(() => { localStorage.setItem("veloura-control", controlMode); }, [controlMode]);
  useEffect(() => { localStorage.setItem("veloura-camera", camera); }, [camera]);
  useEffect(() => { localStorage.setItem("veloura-car", carId); }, [carId]);
  useEffect(() => { localStorage.setItem("veloura-color", color); }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;
    const isMobile = window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false, adaptToDeviceRatio: !isMobile });
    if (isMobile) engine.setHardwareScalingLevel(1.35);
    let handle: GameHandle | null = null;
    createGameScene(engine, canvas, setSnapshot).then((created) => {
      handle = created;
      gameRef.current = created;
      created.setCar(carId, color);
      created.setControlMode(controlMode);
      created.setCamera(camera);
      engine.runRenderLoop(() => created.scene.render());
    });
    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      handle?.dispose();
      engine.dispose();
      startedRef.current = false;
      gameRef.current = null;
    };
  }, []);

  const changeControl = async (mode: ControlMode) => {
    setControlMode(mode);
    gameRef.current?.setControlMode(mode);
    if (mode === "motion") {
      const orientation = DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
      if (typeof orientation.requestPermission === "function") await orientation.requestPermission().catch(() => undefined);
    }
  };
  const changeCamera = () => { const next = camera === "chase" ? "cockpit" : "chase"; setCamera(next); gameRef.current?.setCamera(next); };
  const changeWheel = (value: number) => { setWheelValue(value); window.dispatchEvent(new CustomEvent("veloura-wheel", { detail: { value } })); };
  const chooseCar = (id: CarId) => { setCarId(id); gameRef.current?.setCar(id, color); };
  const chooseColor = (next: string) => { setColor(next); gameRef.current?.setCar(carId, next); };
  const unlock = () => {
    gameRef.current?.unlockAudio();
    const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
    if (typeof orientation?.lock === "function") void orientation.lock("landscape").catch(() => undefined);
  };
  const play = () => { setPanel("home"); gameRef.current?.startDrive(); unlock(); };
  const fileSelected = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; setMusicName(file.name); gameRef.current?.setMusicFile(file); setMusicPlaying(true); };
  const toggleMusic = () => { setMusicPlaying(gameRef.current?.toggleMusic() ?? false); };

  return <div className={`game-shell ${rtl ? "rtl" : "ltr"}`} dir={rtl ? "rtl" : "ltr"} onPointerDown={unlock}>
    <div className="portrait-warning"><div className="rotate-glyph">↻</div><strong>{language === "ar" ? "أديري الهاتف أفقيًا" : "Rotate your phone"}</strong><span>{language === "ar" ? "لأفضل تجربة قيادة" : "For the best driving experience"}</span></div>
    <canvas ref={canvasRef} className="game-canvas" style={{ touchAction: "none" }} />
    <div className="vignette" />
    <header className="top-bar">
      <div className="brand-lockup"><div className="brand-mark">V</div><div><div className="brand-name">VEL OURA</div><div className="brand-sub">DRIVE / 01</div></div></div>
      <div className="route-pill"><span className="status-dot" /> {t.map}<small>{t.explore}</small></div>
      <div className="top-actions"><GlassButton ariaLabel={t.settings} onClick={() => setPanel(panel === "settings" ? "home" : "settings")} active={panel === "settings"}><Settings2 size={17} /></GlassButton><GlassButton ariaLabel={t.language} onClick={() => setLanguage(language === "ar" ? "en" : "ar")}><Languages size={17} /></GlassButton></div>
    </header>

    <main className="hud" onPointerDown={unlock}>
      <section className="speed-cluster"><div className="eyebrow">{t.speed}</div><div className="speed-value">{formatSpeed(snapshot.speed)}<span>km/h</span></div><div className="rpm-track"><span style={{ width: `${Math.min(100, (snapshot.rpm / 6200) * 100)}%` }} /></div><div className="rpm-label"><span>RPM</span><span>{formatRpm(snapshot.rpm)}</span></div></section>
      <section className="status-cluster"><div className="status-card"><span className="card-icon"><Gauge size={16} /></span><div><strong>{formatDistance(snapshot.distance)}</strong><small>{t.distance}</small></div></div><div className="status-card"><span className="card-icon"><Sparkles size={16} /></span><div><strong>{getVehicle(carId).name}</strong><small>{getVehicle(carId).subtitle}</small></div></div></section>
    </main>

    <div className="right-rail"><GlassButton ariaLabel={t.camera} onClick={changeCamera} active><Camera size={19} /><span>{camera === "chase" ? t.chase : t.cockpit}</span></GlassButton><GlassButton ariaLabel={t.garage} onClick={() => setPanel("garage")}><CarFront size={19} /><span>{t.garage}</span></GlassButton></div>

    <footer className="bottom-controls">
      <div className="control-left">{controlMode === "wheel" && <SteeringWheel value={wheelValue} onChange={changeWheel} />}{controlMode !== "wheel" && <div className="direction-pad"><button onPointerDown={() => sendInput("left", true)} onPointerUp={() => sendInput("left", false)} onPointerLeave={() => sendInput("left", false)} aria-label="left"><ChevronLeft size={22} /></button><button onPointerDown={() => sendInput("right", true)} onPointerUp={() => sendInput("right", false)} onPointerLeave={() => sendInput("right", false)} aria-label="right"><ChevronRight size={22} /></button></div>}</div>
      <div className="mode-chip"><span className="mode-dot" />{controlMode === "motion" ? t.motion : controlMode === "wheel" ? t.wheel : t.buttons}</div>
      <div className="pedals"><button className="pedal brake" onPointerDown={() => sendInput("brake", true)} onPointerUp={() => sendInput("brake", false)} onPointerLeave={() => sendInput("brake", false)}><span>{t.brake}</span><strong>◼</strong></button><button className="pedal throttle" onPointerDown={() => sendInput("throttle", true)} onPointerUp={() => sendInput("throttle", false)} onPointerLeave={() => sendInput("throttle", false)}><span>{t.throttle}</span><strong>↥</strong></button></div>
    </footer>

    <nav className="bottom-nav"><button className={panel === "home" ? "selected" : ""} onClick={() => setPanel("home")}><Play size={16} /><span>{t.play}</span></button><button className={panel === "garage" ? "selected" : ""} onClick={() => setPanel("garage")}><CarFront size={16} /><span>{t.garage}</span></button><button className={panel === "music" ? "selected" : ""} onClick={() => setPanel("music")}><Headphones size={16} /><span>{t.music}</span></button><button className={panel === "info" ? "selected" : ""} onClick={() => setPanel("info")}><Info size={16} /><span>Info</span></button></nav>

    {panel !== "home" && <div className="panel-backdrop" onClick={() => setPanel("home")} />}
    {panel === "garage" && <section className="drawer" aria-label={t.garage}><div className="drawer-head"><div><div className="eyebrow">VEL OURA / GARAGE</div><h2>{t.selectCar}</h2></div><GlassButton ariaLabel={t.close} onClick={() => setPanel("home")}><X size={18} /></GlassButton></div><div className="car-preview"><img src={`${import.meta.env.BASE_URL}assets/veloura-car-cutout.webp`} alt="Premium coupe" /><div className="preview-label"><span>{getVehicle(carId).name}</span><small>{getVehicle(carId).subtitle}</small></div></div><div className="car-list">{VEHICLES.map((car) => <button key={car.id} className={`car-option ${car.id === carId ? "chosen" : ""}`} onClick={() => chooseCar(car.id)}><span className="car-swatch" style={{ background: car.defaultColor }} /><div><strong>{car.name}</strong><small>{car.subtitle}</small></div><span className="car-stat">{car.topSpeed}<small>km/h</small></span></button>)}</div><div className="color-row"><span>COLOR</span><div>{COLORS.map((item) => <button key={item} aria-label={item} className={`color-swatch ${item === color ? "picked" : ""}`} style={{ background: item }} onClick={() => chooseColor(item)} />)}</div></div><button className="primary-cta" onClick={play}>{t.play} <ChevronRight size={17} /></button></section>}
    {panel === "settings" && <section className="drawer settings-drawer" aria-label={t.settings}><div className="drawer-head"><div><div className="eyebrow">VEL OURA / SETTINGS</div><h2>{t.settings}</h2></div><GlassButton ariaLabel={t.close} onClick={() => setPanel("home")}><X size={18} /></GlassButton></div><div className="setting-group"><label>{t.controls}</label><div className="segmented">{([["buttons", t.buttons], ["wheel", t.wheel], ["motion", t.motion]] as [ControlMode, string][]).map(([mode, label]) => <button key={mode} className={controlMode === mode ? "active" : ""} onClick={() => changeControl(mode)}>{label}</button>)}</div>{controlMode === "motion" && <p className="hint">حرّكي الهاتف بلطف يمينًا ويسارًا. يعمل Motion عبر DeviceOrientation عند توفره.</p>}</div><div className="setting-group"><label>{t.engine}</label><div className="range-line"><button className="icon-toggle" onClick={() => { setEngineOn(!engineOn); gameRef.current?.setEngineEnabled(!engineOn); }}>{engineOn ? <Volume2 size={18} /> : <VolumeX size={18} />}</button><input type="range" min="0" max="1" step="0.01" value={effectsVolume} onChange={(event) => { const value = Number(event.target.value); setEffectsVolume(value); gameRef.current?.setEffectsVolume(value); }} /></div></div><div className="setting-group"><label>{t.effects}</label><input type="range" min="0" max="1" step="0.01" value={effectsVolume} onChange={(event) => { const value = Number(event.target.value); setEffectsVolume(value); gameRef.current?.setEffectsVolume(value); }} /></div><button className="secondary-cta" onClick={() => { gameRef.current?.reset(); setPanel("home"); }}><RotateCcw size={16} /> {t.reset}</button></section>}
    {panel === "music" && <section className="drawer music-drawer" aria-label={t.music}><div className="drawer-head"><div><div className="eyebrow">VEL OURA / LOCAL PLAYER</div><h2>{t.music}</h2></div><GlassButton ariaLabel={t.close} onClick={() => setPanel("home")}><X size={18} /></GlassButton></div><div className="music-card"><div className="vinyl"><div className="vinyl-core" /></div><div><strong>{musicName || t.noMusic}</strong><small>Offline audio player</small></div><button className="play-music" onClick={musicPlaying ? () => toggleMusic() : () => document.getElementById("music-file")?.click()}>{musicPlaying ? <Pause size={18} /> : <Play size={18} />}</button></div><input id="music-file" className="hidden-file" type="file" accept="audio/*" onChange={fileSelected} /><button className="secondary-cta" onClick={() => document.getElementById("music-file")?.click()}><Headphones size={16} /> {t.chooseMusic}</button><div className="setting-group"><label>{t.music}</label><div className="range-line"><Volume2 size={16} /><input type="range" min="0" max="1" step="0.01" value={musicVolume} onChange={(event) => { const value = Number(event.target.value); setMusicVolume(value); gameRef.current?.setMusicVolume(value); }} /></div></div></section>}
    {panel === "info" && <section className="drawer info-drawer" aria-label="Info"><div className="drawer-head"><div><div className="eyebrow">VEL OURA / ABOUT</div><h2>Veloura Drive</h2></div><GlassButton ariaLabel={t.close} onClick={() => setPanel("home")}><X size={18} /></GlassButton></div><p className="info-copy">{t.intro}. قيادة هادئة على طريق ساحلي صُمّم ليمنحك إحساسًا ناعمًا بالمسافة والسرعة، مع عالم ثلاثي الأبعاد إجرائي خفيف يعمل محليًا بلا خوادم.</p><div className="info-badges"><span>3D / Babylon.js</span><span>Offline first</span><span>{t.ready}</span></div><p className="hint">{t.online}. في نسخة المتصفح، الموسيقى تختار من ملفات الجهاز عبر File Picker، بينما Motion يحتاج صلاحية المتصفح/المستشعر عند توفرها.</p></section>}
  </div>;
}
