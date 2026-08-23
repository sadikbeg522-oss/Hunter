import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Home, CheckCircle2, Compass, BarChart3, Plus, Menu, ChevronRight, ChevronLeft,
  Flame, Zap, Star, Award, Lock, X, Check, Camera, Gauge, LogOut, Mail, KeyRound, User,
  Leaf, Droplet, Gem, Crown,
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

/* ============================= design tokens ============================= */
const C = {
  bg: "#0B0D12", surface: "#12151C", surfaceAlt: "#171B24",
  border: "rgba(255,255,255,0.07)", text: "#EDEEF3", sub: "#8B90A3", faint: "#545A70",
  ember: "#E8873A", emberSoft: "rgba(232,135,58,0.14)", violet: "#8B7FD9",
  green: "#4ADE9A", red: "#FF5C7A",
};
const headFont = "'Sora', system-ui, sans-serif";
const bodyFont = "'Inter', system-ui, sans-serif";
const RANKS = ["E", "D", "C", "B", "A", "S"];
const STATUS_BY_RANK = { E: "Awakened", D: "Rising", C: "Empowered", B: "Ascending", A: "Transcendent", S: "Sovereign" };
const rankColor = (r) => ({ E: "#4ADE9A", D: "#5EA8FF", C: "#B98CFF", B: "#FFC24B", A: "#FF8A5B", S: "#FF5C7A" }[r] || C.ember);
const RANK_ICON = { E: Leaf, D: Droplet, C: Gem, B: Star, A: Flame, S: Crown };
const RANK_FIXED = { E: { days: 7, xp: 2500 }, D: { days: 21, xp: 7500 }, C: { days: 25, xp: 9000 }, B: { days: 30, xp: 10000 }, A: { days: 60, xp: 20000 }, S: { days: 90, xp: 40000 } };
const TAGS = ["Physical", "Mind", "Learning", "Routine", "Social", "Detox"];
const tagColor = { Physical: "#FF8A5B", Mind: "#5EA8FF", Learning: "#FFC24B", Routine: "#4ADE9A", Social: "#FF7FB0", Detox: "#B98CFF" };

/* ============================= helpers ============================= */
function todayStr(d = new Date()) { return d.toISOString().slice(0, 10); }
function addDays(dateStr, n) { const d = new Date(dateStr + "T00:00:00"); d.setDate(d.getDate() + n); return todayStr(d); }
function xpForLevelN(n) { return Math.round((500 * Math.pow(1.12, n - 1)) / 50) * 50; }
function rankForLevel(level) { const idx = Math.min(5, Math.floor(level / 17)); return RANKS[idx]; }
function totalXPEarned(state) { let t = 0; for (let l = 1; l <= state.level; l++) t += xpForLevelN(l); return t + state.xp; }
function cumulativeXpToLevel(level) { let t = 0; for (let l = 1; l <= level; l++) t += xpForLevelN(l); return t; }
function rankLevelRange(idx) { const start = idx * 17; const end = idx === 5 ? null : idx * 17 + 16; return { start, end }; }
function addXp(state, amount) {
  let level = state.level, xp = state.xp + amount;
  if (xp < 0) xp = 0;
  while (xp >= xpForLevelN(level + 1)) { xp -= xpForLevelN(level + 1); level += 1; }
  return { level, xp };
}
function resizeImageFile(file, maxSize = 240, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > height) { if (width > maxSize) { height = Math.round(height * (maxSize / width)); width = maxSize; } }
        else { if (height > maxSize) { width = Math.round(width * (maxSize / height)); height = maxSize; } }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ============================= dungeon library (144 seeds, ported from original) ============================= */
function mk(cat, i, title, desc, rank) {
  const { days, xp } = RANK_FIXED[rank];
  return { id: `${cat}-${i}`, title, desc, rank, days, xp, category: cat };
}
const CATEGORY_SEEDS = {
  Addiction: [
    ["Quit Vaping", "Zero vapes, zero exceptions. Log every urge you resist.", "E"],
    ["No Alcohol", "Complete abstinence from alcohol, every day.", "D"],
    ["Break the Sugar Chain", "Cut added sugar completely and track cravings.", "D"],
    ["No Junk Food Binges", "No fried or packaged snacks, whole foods only.", "C"],
    ["No Pornography for 30 Days", "Complete abstinence from pornography.", "B"],
    ["Quit Smoking Raid", "Zero cigarettes, log urges as they hit.", "B"],
    ["No Gambling", "Zero betting apps, zero wagers.", "A"],
    ["No Energy Drinks", "Cut energy drinks completely.", "E"],
    ["Digital Game Addiction Detox", "No mobile or console gaming.", "C"],
    ["No Late Night Snacking", "Kitchen closed after 8 PM.", "D"],
    ["Zero Caffeine", "No coffee, tea, or caffeinated soda.", "C"],
    ["Complete Substance Reset", "Full abstinence from all listed vices.", "S"],
  ],
  Dependency: [
    ["No Sleeping Pills for 14 Days", "Natural sleep only — no sleep aids.", "D"],
    ["No Painkillers Without Prescription", "Manage discomfort without reaching for pills.", "C"],
    ["Reduce Caffeine Dependency", "Taper daily caffeine intake step by step.", "D"],
    ["No Comfort Eating", "Eat only when physically hungry.", "C"],
    ["Break Validation-Seeking Habit", "Stop checking likes and comments obsessively.", "B"],
    ["No Impulse Shopping", "Zero unplanned purchases.", "D"],
    ["Reduce Screen Dependency at Night", "No screens 1 hour before bed.", "E"],
    ["No Relying on Others for Motivation", "Self-driven action only.", "B"],
    ["Break the Procrastination Loop", "Start every planned task within 5 minutes.", "C"],
    ["No Emotional Eating", "Pause and journal before eating out of emotion.", "C"],
    ["Independence From Energy Boosters", "No caffeine, sugar, or nicotine crutches.", "D"],
    ["Full Dependency Detox", "Break every crutch habit at once.", "A"],
  ],
  "Digital Detox": [
    ["Delete Social Media for 14 Days", "Remove all social media apps from your phone.", "D"],
    ["Screen Time Purge", "Cap total screen time and log it honestly.", "C"],
    ["No Short-Form Video", "No Reels, Shorts, or TikTok scrolling.", "D"],
    ["Phone-Free Mornings", "No phone for the first hour after waking.", "E"],
    ["No Scrolling Before Bed", "Phone stays outside the bedroom.", "E"],
    ["Digital Sunday", "One full day completely offline each week.", "D"],
    ["No Binge Watching", "Max one episode a day, no more.", "C"],
    ["Notification Silence", "All non-essential notifications off.", "E"],
    ["One Hour Screen Limit", "Total recreational screen time under 60 minutes.", "C"],
    ["No Phone in Bedroom", "Charge your phone outside the bedroom every night.", "D"],
    ["Full Digital Fast Weekend", "Zero screens every weekend this month.", "B"],
    ["30-Day Digital Reset", "A full month of disciplined, minimal screen use.", "A"],
  ],
  Emotional: [
    ["Daily Gratitude Practice", "Write down three things you're grateful for.", "E"],
    ["No Negative Self-Talk", "Catch and reframe every self-critical thought.", "D"],
    ["Journal Every Night", "Reflect on the day in writing before bed.", "E"],
    ["Anger Response Reset", "Pause 10 seconds before reacting when angry.", "C"],
    ["No Comparing Yourself to Others", "Catch comparison spirals and redirect.", "D"],
    ["Practice Radical Honesty", "Say the true thing, kindly, every time.", "C"],
    ["Forgive One Grudge", "Actively work through releasing one resentment.", "E"],
    ["No Complaining Challenge", "Replace complaints with a constructive action.", "C"],
    ["Emotional Regulation Training", "Name and sit with emotions before acting.", "B"],
    ["Build Unshakable Calm", "Practice composure under daily stress triggers.", "A"],
    ["Confront One Fear", "Do the thing you've been avoiding out of fear.", "B"],
    ["Master Your Emotions", "A full arc of emotional mastery training.", "S"],
  ],
  Extreme: [
    ["No Comfort Zone for 30 Days", "Do one uncomfortable thing every single day.", "S"],
    ["Cold Shower Every Day", "End every shower with cold water.", "D"],
    ["Ice Bath Challenge", "Regular cold exposure sessions.", "B"],
    ["5AM Wake Up Streak", "Out of bed at 5 AM, no snoozing.", "B"],
    ["No Excuses Month", "Execute the plan regardless of mood.", "A"],
    ["Silent Retreat Day", "One full day of intentional silence.", "C"],
    ["Extreme Fasting Discipline", "Structured extended fasting windows.", "A"],
    ["Distance Streak", "Cover serious distance on foot this month.", "S"],
    ["No Comfort Food Ever", "Zero indulgence foods, full discipline.", "B"],
    ["Sleep on the Floor", "Minimalist sleep setup to build toughness.", "C"],
    ["Push Past Every Limit", "Daily discomfort training, no plateaus.", "S"],
    ["75-Style Hard Challenge", "A full structured hard-mode month.", "S"],
  ],
  Finance: [
    ["No Impulse Purchases", "Every purchase must wait 24 hours.", "D"],
    ["Track Every Expense", "Log every rupee spent, no exceptions.", "E"],
    ["Save Daily", "Set aside a fixed amount every day.", "E"],
    ["No Eating Out", "Home-cooked meals only.", "C"],
    ["Build Emergency Fund", "Consistent contributions to a safety net.", "B"],
    ["Zero-Based Budgeting", "Every rupee assigned a job each month.", "C"],
    ["Cancel Unused Subscriptions", "Audit and cut what you don't use.", "D"],
    ["Investing Streak", "Consistent small investments, tracked daily.", "C"],
    ["Debt Free Sprint", "Aggressive, tracked debt paydown.", "A"],
    ["No Online Shopping", "Zero e-commerce purchases.", "D"],
    ["Side Income Hustle", "Daily action toward a second income stream.", "B"],
    ["Financial Freedom Sprint", "A full disciplined money-mastery arc.", "S"],
  ],
  Learning: [
    ["Read 10 Pages Daily", "Consistent daily reading, no skipping.", "E"],
    ["Learn a New Skill", "Deliberate daily practice on one new skill.", "C"],
    ["Language Streak", "Daily practice on a new language.", "E"],
    ["Finish an Online Course", "Steady daily progress to completion.", "B"],
    ["No Skipping Study Sessions", "Show up for every planned session.", "D"],
    ["Learn to Code", "Daily coding practice, real projects.", "B"],
    ["Memorize Something New Daily", "One new fact, word, or concept a day.", "D"],
    ["Deep Read One Book", "Slow, focused reading with notes.", "C"],
    ["Master Language Basics", "A full arc toward conversational basics.", "A"],
    ["Teach What You Learn", "Explain each day's learning to someone.", "C"],
    ["Complete a Certification", "Daily study toward a real credential.", "A"],
    ["Knowledge Mastery Sprint", "An intense full arc of study discipline.", "S"],
  ],
  Physical: [
    ["Sunrise Workout Streak", "Move your body for 20 minutes before 9 AM.", "E"],
    ["Daily Steps Goal", "Hit a consistent daily step target.", "E"],
    ["No Skipping Leg Day", "Full lower body training, no shortcuts.", "C"],
    ["Push-Up Progression", "Daily push-ups, building volume over time.", "D"],
    ["Run Every Day", "A daily run, distance doesn't matter — consistency does.", "C"],
    ["Yoga Every Morning", "Daily mobility and yoga practice.", "D"],
    ["Strength Training Streak", "Structured daily strength sessions.", "B"],
    ["No Sedentary Days", "Move meaningfully every single day.", "D"],
    ["Flexibility Challenge", "Daily stretching and mobility work.", "C"],
    ["Marathon Prep", "Progressive training toward race distance.", "A"],
    ["Body Transformation Sprint", "Full training and nutrition discipline.", "A"],
    ["Peak Physical Condition", "An elite full arc of physical training.", "S"],
  ],
  Mind: [
    ["Meditate for 21 Days", "Meditate for at least 10 minutes every day.", "D"],
    ["Deep Work Dungeon", "One uninterrupted 90-minute focus block a day.", "C"],
    ["No Multitasking", "Single-task everything, every day.", "D"],
    ["Focus Block Streak", "Daily distraction-free work sessions.", "C"],
    ["Mindfulness Practice", "Short daily mindfulness check-ins.", "E"],
    ["Brain Training Games", "Daily cognitive exercises.", "E"],
    ["No Distractions Challenge", "Phone away during all deep work.", "B"],
    ["Mental Clarity Sprint", "Daily practices to reduce mental clutter.", "C"],
    ["Visualization Practice", "Daily goal visualization sessions.", "D"],
    ["Master Your Attention", "A full arc of attention training.", "A"],
    ["Cognitive Overload Reset", "Systematic reduction of daily mental load.", "B"],
    ["Unbreakable Focus", "An elite full arc of focus mastery.", "S"],
  ],
  Routine: [
    ["Consistent Wake Time", "Wake up at the same time, every day.", "E"],
    ["Morning Routine Streak", "Complete your full morning routine daily.", "D"],
    ["Evening Wind-Down Ritual", "A consistent, screen-free wind-down.", "E"],
    ["No Skipping Routine", "Zero missed routine days.", "C"],
    ["Weekly Planning Streak", "Plan the week ahead, every week.", "D"],
    ["Consistent Bedtime", "Lights out at the same time nightly.", "D"],
    ["Meal Prep Sunday", "Prep meals for the week, every week.", "C"],
    ["Time Blocking Streak", "Plan your day in blocks, every day.", "B"],
    ["No Wasted Mornings", "Purposeful first hour, every day.", "C"],
    ["Perfect Routine Streak", "Flawless routine execution, long streak.", "A"],
    ["Discipline Over Motivation", "Show up regardless of how you feel.", "B"],
    ["Iron Routine Challenge", "An unbreakable full arc of routine.", "S"],
  ],
  Social: [
    ["Compliment Someone Daily", "Genuinely uplift one person each day.", "E"],
    ["Call a Friend Weekly", "Stay connected with real conversations.", "E"],
    ["No Gossiping", "Keep conversations constructive, not critical.", "D"],
    ["Reach Out to Old Friends", "Reconnect with someone from the past.", "C"],
    ["Practice Active Listening", "Fully listen without planning your reply.", "D"],
    ["No Cancelling Plans", "Show up for every commitment made.", "C"],
    ["Build One New Connection", "Meet someone new, deliberately.", "B"],
    ["No Isolating Yourself", "One real social interaction daily.", "C"],
    ["Improve Public Speaking", "Daily practice speaking in front of others.", "B"],
    ["Deepen Family Bonds", "Quality time with family, daily.", "D"],
    ["Network Building Sprint", "Deliberate daily outreach and follow-up.", "A"],
    ["Social Mastery Challenge", "A full arc of social confidence building.", "S"],
  ],
  Spiritual: [
    ["Daily Prayer or Reflection", "A quiet moment of reflection each day.", "E"],
    ["Gratitude Journaling", "Write down what you're thankful for.", "E"],
    ["Weekly Silence Hour", "One hour of intentional silence weekly.", "D"],
    ["Study Sacred Texts", "Daily reading and reflection.", "C"],
    ["Acts of Kindness Daily", "One deliberate kind act every day.", "D"],
    ["Digital Silence for Reflection", "A screen-free hour for reflection daily.", "C"],
    ["Meditative Walk Daily", "A slow, present walk each day.", "D"],
    ["Serve Others Weekly", "Volunteer or help someone every week.", "B"],
    ["Fast for Clarity", "Structured fasting for mental clarity.", "B"],
    ["Deepen Spiritual Practice", "Consistent daily practice, deepened weekly.", "A"],
    ["Inner Peace Sprint", "A full arc of calm-building practice.", "A"],
    ["Spiritual Awakening Journey", "An elite full arc of inner work.", "S"],
  ],
};
const DUNGEON_LIBRARY = Object.entries(CATEGORY_SEEDS).flatMap(([cat, items]) => items.map(([title, desc, rank], i) => mk(cat, i, title, desc, rank)));
const CATEGORIES = ["All", ...Object.keys(CATEGORY_SEEDS)];
const CATEGORY_MOOD = {
  Physical: "#FF5C7A", Mind: "#5EA8FF", Learning: "#FFC24B", Routine: "#4ADE9A",
  Social: "#FF7FB0", Extreme: "#FF8A5B", Finance: "#2DD4BF", Spiritual: "#B98CFF",
  Addiction: "#E14545", Dependency: "#9D7FE8", "Digital Detox": "#22D3EE", Emotional: "#FB7185",
};
const DUNGEON_TO_ARCHETYPE = { Physical: "Physical", Mind: "Mind", Learning: "Learning", Routine: "Routine", Social: "Social", Addiction: "Detox", Dependency: "Detox", "Digital Detox": "Detox", Emotional: "Mind", Extreme: "Physical", Finance: "Routine", Spiritual: "Mind" };
const BENEFITS_BY_CAT = {
  Addiction: ["Reduces cravings", "Restores dopamine balance", "Builds self-control", "Improves sleep quality"],
  Dependency: ["Builds independence", "Strengthens willpower", "Reduces reliance on crutches", "Increases self-trust"],
  "Digital Detox": ["Reduces anxiety", "Improves focus", "Restores attention span", "Improves sleep"],
  Emotional: ["Improves emotional control", "Reduces reactivity", "Builds resilience", "Strengthens relationships"],
  Extreme: ["Builds mental toughness", "Increases discipline", "Expands comfort zone", "Sharpens willpower"],
  Finance: ["Builds financial security", "Reduces money stress", "Increases savings", "Builds long-term wealth"],
  Learning: ["Expands knowledge", "Builds new skills", "Sharpens memory", "Increases confidence"],
  Physical: ["Builds strength", "Improves energy", "Boosts mood", "Improves long-term health"],
  Mind: ["Reduces anxiety", "Improves focus", "Builds emotional control", "Rewires stress response"],
  Routine: ["Builds consistency", "Reduces decision fatigue", "Increases productivity", "Creates stability"],
  Social: ["Deepens relationships", "Builds confidence", "Reduces loneliness", "Improves communication"],
  Spiritual: ["Builds inner peace", "Increases gratitude", "Deepens self-awareness", "Reduces stress"],
};

/* ============================= achievements (119, ported from original) ============================= */
const NAMED_LEVELS = { 5: "Novice", 10: "Rising Star", 20: "Ambitious", 30: "Champion", 50: "Elite Hunter", 75: "Master Hunter", 100: "Living Legend" };
function buildAchievements(state) {
  const list = [];
  for (let n = 1; n <= 100; n++) list.push({ id: "lvl-" + n, cat: "Level", title: NAMED_LEVELS[n] || `Level ${n}`, sub: `Reach Level ${n}`, xp: xpForLevelN(n), unlocked: state.level >= n });
  [[3, "Regular", 50], [7, "Week Regular", 100], [14, "Fortnight Focus", 250], [30, "Unstoppable", 500], [100, "Iron Will", 2000]]
    .forEach(([n, name, xp]) => list.push({ id: "streak-" + n, cat: "Streak", title: name, sub: `Be active for ${n} days`, xp, unlocked: state.bestStreak >= n }));
  const xpMiles = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 5000000];
  const xpNames = ["First Fortune", "XP Hoarder", "Grinder", "Relentless", "Overachiever", "XP Titan", "Colossus", "Ascendant", "Mythical", "Godlike"];
  const total = totalXPEarned(state);
  xpMiles.forEach((n, i) => list.push({ id: "xp-" + n, cat: "XP", title: xpNames[i], sub: `Earn ${n.toLocaleString()} total XP`, xp: Math.round(n * 0.02), unlocked: total >= n }));
  [[1, "First Blood"], [10, "Getting Started"], [50, "Veteran"], [100, "Unstoppable Machine"]]
    .forEach(([n, name]) => list.push({ id: "act-" + n, cat: "Activity", title: name, sub: `Complete ${n} tasks`, xp: n * 10, unlocked: state.completedCount >= n }));
  return list;
}
const ACH_CATS = ["All", "Level", "Streak", "XP", "Activity"];

/* ============================= default state ============================= */
const DEFAULT_STATE = {
  registered: false, email: "",
  name: "Orvix", photo: null, level: 0, xp: 0, currentStreak: 0, bestStreak: 0, lastActiveDate: null,
  completedCount: 0, quests: [], myDungeons: [], customDungeonDefs: [],
  archetypeCounts: { Physical: 0, Mind: 0, Learning: 0, Routine: 0, Social: 0, Detox: 0 },
  activity: {}, questActivity: {}, lastPenaltyCheckDate: null,
};

/* ============================= toasts ============================= */
let toastId = 0;
let emitToast = () => {};
function ToastLayer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    emitToast = (t) => { const id = ++toastId; setToasts((c) => [...c, { ...t, id }]); setTimeout(() => setToasts((c) => c.filter((x) => x.id !== id)), 2400); };
  }, []);
  return (
    <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, padding: "0 16px", zIndex: 100, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ background: C.surface, border: `1px solid ${t.kind === "milestone" ? C.ember : t.kind === "penalty" ? C.red : C.border}`, borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
          {t.kind === "milestone" ? <Award size={16} color={C.ember} /> : <Zap size={16} color={t.kind === "penalty" ? C.red : C.green} />}
          <span style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 13, color: C.text }}>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================= signature element ============================= */
function AuraRing({ level, xp, xpNeeded, rank, size = 168 }) {
  const stroke = 8, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const pct = Math.min(1, xp / xpNeeded);
  const color = rankColor(rank);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div className="auraGlow" style={{ position: "absolute", inset: -14, borderRadius: "50%", background: `radial-gradient(circle, ${color}33 0%, transparent 70%)` }} />
      <svg width={size} height={size} style={{ position: "relative", transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.surfaceAlt} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 42, color: C.text, lineHeight: 1 }}>{level}</div>
        <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.sub, marginTop: 4, letterSpacing: 0.5 }}>LEVEL</div>
      </div>
    </div>
  );
}

/* ============================= shared bits ============================= */
function Pill({ children, color }) { return <span style={{ display: "inline-flex", alignItems: "center", fontFamily: bodyFont, fontWeight: 600, fontSize: 11, color, background: `${color}1F`, padding: "4px 10px", borderRadius: 20 }}>{children}</span>; }
function Card({ children, style, onClick }) { return <div onClick={onClick} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 18, ...style }}>{children}</div>; }

/* ============================= rank banners ============================= */
function RankBanner({ rank, active, index }) {
  const color = rankColor(rank);
  const Icon = RANK_ICON[rank];
  const w = active ? 50 : 40;
  const h = active ? 70 : 56;
  return (
    <div
      className="rankBanner"
      style={{
        width: w, marginLeft: index === 0 ? 0 : -16, zIndex: active ? 10 : index,
        animationDelay: `${index * 70}ms`,
        filter: active ? `drop-shadow(0 2px 5px ${color}4D)` : `drop-shadow(0 2px 6px rgba(0,0,0,0.5))`,
        transition: "width 0.4s, height 0.4s, filter 0.4s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", marginBottom: -3, zIndex: 2 }}>
        <span style={{ width: 8, height: 8, background: "linear-gradient(135deg,#F3DCA0,#B9903F)", clipPath: "polygon(100% 0, 0 50%, 100% 100%)" }} />
        <div style={{ flex: 1, height: 6, background: "linear-gradient(180deg,#F3DCA0,#B9903F)", boxShadow: "inset 0 -1px 1px rgba(0,0,0,0.35)" }} />
        <span style={{ width: 8, height: 8, background: "linear-gradient(225deg,#F3DCA0,#B9903F)", clipPath: "polygon(0 0, 100% 50%, 0 100%)" }} />
      </div>
      <div
        style={{
          width: "100%", height: h, background: `linear-gradient(150deg, ${color} 0%, ${color}D9 45%, ${color}88 100%)`,
          clipPath: "polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%)",
          position: "relative", border: `1.5px solid #E8CD8F`,
        }}
      >
        <div style={{ position: "absolute", inset: 3, clipPath: "polygon(0 0, 100% 0, 100% 78%, 50% 98%, 0 78%)", border: `1px solid rgba(255,255,255,0.35)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-58%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
          <Icon size={active ? 20 : 15} color="rgba(11,13,18,0.85)" strokeWidth={2.3} />
          <span style={{ fontFamily: headFont, fontWeight: 800, fontSize: active ? 11 : 9, color: "rgba(11,13,18,0.85)", lineHeight: 1 }}>{rank}</span>
        </div>
        <span style={{ position: "absolute", bottom: 5, left: "50%", transform: "translate(-50%, 0) rotate(45deg)", width: active ? 7 : 5, height: active ? 7 : 5, background: "linear-gradient(135deg,#FFF,#E8CD8F)", border: "0.5px solid #B9903F" }} />
      </div>
    </div>
  );
}
function RankBannerStack({ rank }) {
  const idx = RANKS.indexOf(rank);
  const achieved = RANKS.slice(0, idx + 1);
  return (
    <div style={{ position: "absolute", top: -6, right: 16, display: "flex", alignItems: "flex-end" }}>
      {achieved.map((r, i) => (
        <RankBanner key={r} rank={r} index={i} active={r === rank} />
      ))}
    </div>
  );
}
function RankMedal({ rank, size = 160 }) {
  const color = rankColor(rank);
  const Icon = RANK_ICON[rank];
  const isTop = rank === "S";
  const uid = `medal-${rank}`;
  return (
    <div style={{ position: "relative", width: size, height: size * 0.6, marginTop: isTop ? 18 : 4 }}>
      <svg viewBox="0 0 220 130" width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id={`ribL-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <linearGradient id={`ribR-${uid}`} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <radialGradient id={`coin-${uid}`} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}AA`} />
          </radialGradient>
        </defs>

        {[0, 1, 2, 3].map((i) => (
          <ellipse key={"l" + i} cx={60 - i * 10} cy={95 + i * 3} rx="9" ry="4.3" fill="#D9B978" opacity={0.85 - i * 0.1} transform={`rotate(${-20 - i * 14} ${60 - i * 10} ${95 + i * 3})`} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <ellipse key={"r" + i} cx={160 + i * 10} cy={95 + i * 3} rx="9" ry="4.3" fill="#D9B978" opacity={0.85 - i * 0.1} transform={`rotate(${20 + i * 14} ${160 + i * 10} ${95 + i * 3})`} />
        ))}

        <polygon points="100,40 100,84 55,84 20,96 35,62 20,28 55,40" fill={`url(#ribL-${uid})`} stroke="#E8CD8F" strokeWidth="1" />
        <polygon points="120,40 120,84 165,84 200,96 185,62 200,28 165,40" fill={`url(#ribR-${uid})`} stroke="#E8CD8F" strokeWidth="1" />

        {isTop && <path d="M92,20 L98,4 L110,16 L122,4 L128,20 Z" fill="#F3DCA0" stroke="#B9903F" strokeWidth="1.2" />}

        <circle cx="110" cy="62" r="34" fill="#E8CD8F" />
        <circle cx="110" cy="62" r="30" fill={`url(#coin-${uid})`} />
        <circle cx="110" cy="62" r="30" fill="none" stroke="#F3DCA0" strokeWidth="1.6" />
      </svg>
      <div style={{ position: "absolute", top: "44%", left: "50%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
        <Icon size={16} color="rgba(11,13,18,0.85)" strokeWidth={2.3} />
        <span style={{ fontFamily: headFont, fontWeight: 800, fontSize: 15, color: "rgba(11,13,18,0.85)", lineHeight: 1, marginTop: 1 }}>{rank}-RANK</span>
      </div>
    </div>
  );
}
function Sheet({ title, onClose, onBack, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 90, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto", background: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, border: `1px solid ${C.border}`, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {onBack && <button onClick={onBack} style={{ background: C.surface, border: "none", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronLeft size={17} color={C.sub} /></button>}
            <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 18, color: C.text }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ background: C.surface, border: "none", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color={C.sub} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Input(props) { return <input {...props} style={{ width: "100%", boxSizing: "border-box", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontFamily: bodyFont, fontSize: 14, color: C.text, marginBottom: 12 }} />; }

function GlobalStyles() {
  return (
    <style>{`
      @media (prefers-reduced-motion: reduce) { .auraGlow { animation: none !important; } .rankBanner { animation: none !important; } .rankBannerFloat { animation: none !important; } }
      .auraGlow { animation: pulse 3.2s ease-in-out infinite; }
      @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
      .rankBanner { animation: bannerDropIn 0.6s cubic-bezier(.22,1.4,.4,1) both; transform-origin: top center; }
      @keyframes bannerDropIn { 0% { opacity: 0; transform: translateY(-26px) scale(0.4) rotate(-10deg); } 60% { opacity: 1; transform: translateY(4px) scale(1.08) rotate(3deg); } 100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); } }
      .rankBannerFloat { animation: bannerFloat 6.5s ease-in-out infinite; transform-origin: top center; }
      @keyframes bannerFloat { 0%,100% { transform: scale(1.9) translateY(0); filter: drop-shadow(0 6px 14px rgba(0,0,0,0.35)); } 50% { transform: scale(1.9) translateY(-7px); filter: drop-shadow(0 13px 18px rgba(0,0,0,0.25)); } }
      html, body { touch-action: manipulation; overscroll-behavior: none; }
      * { -webkit-tap-highlight-color: transparent; }
      .no-select, .no-select * { -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-touch-callout: none; }
      .no-select input, .no-select textarea { -webkit-user-select: text; user-select: text; -webkit-touch-callout: default; }
    `}</style>
  );
}
/* ============================= Auth (Login / Sign up) ============================= */
const HUNTER_LOGO = "data:image/webp;base64,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";
function isGmail(email) { return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.trim()); }
function loadUsers() { try { return JSON.parse(localStorage.getItem("hunterAppUsers") || "[]"); } catch { return []; } }
function saveUsers(list) { try { localStorage.setItem("hunterAppUsers", JSON.stringify(list)); } catch {} }
function AuthScreen({ onAuth }) {
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    const desired = "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover";
    if (!meta) { meta = document.createElement("meta"); meta.name = "viewport"; document.head.appendChild(meta); }
    meta.setAttribute("content", desired);
  }, []);
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const canSubmit = mode === "login" ? email.trim() && password : username.trim() && email.trim() && password && password === confirm;

  const handleSubmit = () => {
    setError("");
    if (!isGmail(email)) { setError("Please enter a valid Gmail address (e.g. name@gmail.com)"); return; }
    const users = loadUsers();
    if (mode === "signup") {
      const uname = username.trim();
      if (uname.length < 3) { setError("Username must be at least 3 characters"); return; }
      if (users.some((u) => u.username.toLowerCase() === uname.toLowerCase())) { setError("That username is already taken"); return; }
      if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) { setError("An account with this Gmail already exists"); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
      if (password !== confirm) { setError("Passwords do not match"); return; }
      saveUsers([...users, { username: uname, email: email.trim(), password }]);
      onAuth({ name: uname, email: email.trim() });
    } else {
      const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!match) { setError("No account found with this Gmail"); return; }
      if (match.password !== password) { setError("Incorrect password"); return; }
      onAuth({ name: match.username, email: match.email });
    }
  };

  return (
    <div className="no-select" style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 24px 40px", touchAction: "manipulation" }}>
      <GlobalStyles />
      <div className="auraGlow" style={{ width: 84, height: 84, borderRadius: 22, background: "#0B0D12", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, boxShadow: `0 10px 30px ${C.emberSoft}`, overflow: "hidden" }}>
        <img src={HUNTER_LOGO} alt="Hunter" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 4 }}>Hunter</div>
      <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.sub, marginBottom: 30 }}>Level up your real life.</div>

      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ display: "flex", background: C.surface, borderRadius: 14, padding: 4, marginBottom: 22, border: `1px solid ${C.border}` }}>
          {["login", "signup"].map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", background: mode === m ? C.emberSoft : "transparent", color: mode === m ? C.ember : C.sub, fontFamily: headFont, fontWeight: 700, fontSize: 13.5 }}>{m === "login" ? "Login" : "Sign up"}</button>
          ))}
        </div>

        {mode === "signup" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
            <User size={16} color={C.faint} />
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: bodyFont, fontSize: 14, color: C.text }} />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
          <Mail size={16} color={C.faint} />
          <input placeholder="Gmail address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: bodyFont, fontSize: 14, color: C.text }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
          <KeyRound size={16} color={C.faint} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: bodyFont, fontSize: 14, color: C.text }} />
        </div>
        {mode === "signup" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
            <KeyRound size={16} color={C.faint} />
            <input placeholder="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: bodyFont, fontSize: 14, color: C.text }} />
          </div>
        )}

        {error && <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.red, marginBottom: 12, lineHeight: 1.4 }}>{error}</div>}

        <button disabled={!canSubmit} onClick={handleSubmit} style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 16, marginTop: 10, cursor: canSubmit ? "pointer" : "default", background: canSubmit ? C.ember : C.surfaceAlt, color: canSubmit ? C.bg : C.faint, fontFamily: headFont, fontWeight: 700, fontSize: 14.5 }}>{mode === "login" ? "Login" : "Sign up"}</button>
      </div>
    </div>
  );
}

/* ============================= Home ============================= */
function HomeScreen({ state, completeQuest, onAvatar }) {
  const rank = rankForLevel(state.level);
  const status = STATUS_BY_RANK[rank];
  const xpNeeded = xpForLevelN(state.level + 1);
  const today = todayStr();
  const doneToday = state.quests.filter((q) => q.lastCompletedDate === today).length;
  const xpToday = Object.entries(state.activity).length ? (state.quests.filter((q) => q.lastCompletedDate === today).reduce((a, q) => a + q.xp, 0)) : 0;
  return (
    <div style={{ padding: "22px 18px 110px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onAvatar} style={{ width: 46, height: 46, borderRadius: 14, border: `1px solid ${C.border}`, background: state.photo ? `url(${state.photo})` : C.surfaceAlt, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
            {!state.photo && <Camera size={17} color={C.faint} />}
          </button>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.sub }}>Welcome back, Hunter</div>
            <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 24, color: C.text }}>{state.name}</div>
          </div>
        </div>
        <button style={{ width: 42, height: 42, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Menu size={18} color={C.sub} /></button>
      </div>

      <Card style={{ marginBottom: 16, position: "relative", overflow: "visible" }}>
        <div style={{ position: "absolute", top: -6, right: 16 }}>
          <RankBanner key={rank} rank={rank} active index={0} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <AuraRing level={state.level} xp={state.xp} xpNeeded={xpNeeded} rank={rank} />
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ height: 9, background: C.surfaceAlt, borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}` }}>
            <div style={{ height: "100%", width: `${(state.xp / xpNeeded) * 100}%`, background: `linear-gradient(90deg, ${rankColor(rank)}AA, ${rankColor(rank)})`, borderRadius: 20, transition: "width 0.8s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontFamily: bodyFont, fontSize: 11, color: C.sub, letterSpacing: 0.6 }}>XP TO NEXT LEVEL</span>
            <span style={{ fontFamily: bodyFont, fontSize: 12, color: C.text }}><b style={{ color: rankColor(rank) }}>{state.xp}</b>/{xpNeeded}</span>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[{ icon: Zap, label: "XP Today", value: `+${xpToday}`, color: C.ember }, { icon: Flame, label: "Streak", value: `${state.currentStreak}d`, color: "#FF8A5B" }, { icon: Star, label: "Best Streak", value: `${state.bestStreak}d`, color: C.violet }].map((s, i) => (
          <Card key={i} style={{ padding: 14, textAlign: "center" }}>
            <s.icon size={18} color={s.color} style={{ marginBottom: 6 }} />
            <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 17, color: C.text }}>{s.value}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 10.5, color: C.sub, marginTop: 2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 16, color: C.text }}>Today's Quests</div>
        <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.sub }}>{doneToday}/{state.quests.length}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {state.quests.length === 0 && <div style={{ textAlign: "center", color: C.faint, fontFamily: bodyFont, fontSize: 13.5, padding: 26 }}>No quests yet. Tap + to create one.</div>}
        {state.quests.map((q) => {
          const done = q.lastCompletedDate === today;
          return (
            <div key={q.id} onClick={() => completeQuest(q.id)} style={{ display: "flex", alignItems: "center", gap: 12, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "12px 14px", cursor: "pointer" }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${done ? C.green : C.faint}`, background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{done && <Check size={14} color={C.bg} strokeWidth={3} />}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 14, color: done ? C.sub : C.text, textDecoration: done ? "line-through" : "none" }}>{q.title}</div>
                <div style={{ marginTop: 3 }}><Pill color={tagColor[q.tag]}>{q.tag}</Pill></div>
              </div>
              <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 12.5, color: C.ember }}>+{q.xp}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================= Quests ============================= */
function QuestsScreen({ state, completeQuest }) {
  const [tab, setTab] = useState("active");
  const today = todayStr();
  const list = state.quests.filter((q) => (tab === "active" ? q.lastCompletedDate !== today : q.lastCompletedDate === today));
  return (
    <div style={{ padding: "22px 18px 110px" }}>
      <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 16 }}>Quests</div>
      <div style={{ display: "flex", background: C.surface, borderRadius: 14, padding: 4, marginBottom: 18, border: `1px solid ${C.border}` }}>
        {["active", "done"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", background: tab === t ? C.emberSoft : "transparent", color: tab === t ? C.ember : C.sub, fontFamily: bodyFont, fontWeight: 700, fontSize: 13, textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((q) => {
          const done = q.lastCompletedDate === today;
          return (
            <Card key={q.id} onClick={() => completeQuest(q.id)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, border: `2px solid ${done ? C.green : C.faint}`, background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{done && <Check size={15} color={C.bg} strokeWidth={3} />}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 14.5, color: C.text }}>{q.title}</div>
                <div style={{ marginTop: 4 }}><Pill color={tagColor[q.tag]}>{q.tag}</Pill></div>
              </div>
              <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 13, color: C.ember }}>+{q.xp}</div>
            </Card>
          );
        })}
        {list.length === 0 && <div style={{ textAlign: "center", color: C.faint, fontFamily: bodyFont, fontSize: 13.5, padding: 30 }}>Nothing here yet.</div>}
      </div>
    </div>
  );
}

/* ============================= Dungeons ============================= */
function DungeonPreview({ def, onClose, onJoin, joined }) {
  const color = rankColor(def.rank);
  const { days, xp } = RANK_FIXED[def.rank];
  const benefits = BENEFITS_BY_CAT[def.category] || [];
  return (
    <Sheet title={def.title} onClose={onClose}>
      <Pill color={color}>{def.rank}-RANK · {def.category}</Pill>
      <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.sub, margin: "12px 0 16px", lineHeight: 1.5 }}>{def.desc}</div>
      <Card style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.sub, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>QUEST REWARD</div>
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 22, color: C.ember }}>+{xp} XP</div>
        <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.sub, marginTop: 2 }}>over {days} days</div>
      </Card>
      <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 14.5, color: C.text, marginBottom: 10 }}>Benefits</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
        {benefits.map((b) => (
          <div key={b} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: `${C.green}22`, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={12} color={C.green} strokeWidth={3} /></div>
            <div style={{ fontFamily: bodyFont, fontSize: 13.5, color: C.sub }}>{b}</div>
          </div>
        ))}
      </div>
      <button disabled={joined} onClick={onJoin} style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 16, cursor: joined ? "default" : "pointer", background: joined ? C.surfaceAlt : color, color: joined ? C.sub : C.bg, fontFamily: headFont, fontWeight: 700, fontSize: 14.5 }}>{joined ? "Already Joined" : "Join Dungeon"}</button>
    </Sheet>
  );
}
function DungeonDetail({ dungeon, def, onClose, onCheckIn }) {
  const color = rankColor(def.rank);
  const { days, xp } = RANK_FIXED[def.rank];
  const pct = Math.round((dungeon.checkins.length / days) * 100);
  const today = todayStr();
  const doneToday = dungeon.checkins.includes(today);
  return (
    <Sheet title={def.title} onClose={onClose}>
      <Pill color={color}>{def.rank}-RANK · {def.category}</Pill>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "18px 0 20px" }}>
        <div style={{ position: "relative", width: 140, height: 140 }}>
          <svg width={140} height={140} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={70} cy={70} r={62} stroke={C.surfaceAlt} strokeWidth={8} fill="none" />
            <circle cx={70} cy={70} r={62} stroke={color} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 62} strokeDashoffset={2 * Math.PI * 62 * (1 - pct / 100)} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 26, color: C.text }}>{pct}%</div>
            <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.sub }}>complete</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Card style={{ flex: 1, textAlign: "center", padding: 12 }}><div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 16, color: C.text }}>{dungeon.checkins.length}/{days}</div><div style={{ fontFamily: bodyFont, fontSize: 11, color: C.sub }}>Progress</div></Card>
        <Card style={{ flex: 1, textAlign: "center", padding: 12 }}><div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 16, color: C.text }}>{dungeon.streak} 🔥</div><div style={{ fontFamily: bodyFont, fontSize: 11, color: C.sub }}>Streak</div></Card>
      </div>
      <button onClick={() => onCheckIn(dungeon.dungeonId)} disabled={doneToday} style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 16, cursor: doneToday ? "default" : "pointer", background: doneToday ? C.surfaceAlt : color, color: doneToday ? C.sub : C.bg, fontFamily: headFont, fontWeight: 700, fontSize: 14.5 }}>{doneToday ? "Checked in for today" : `Check In · +${Math.round(xp / days)} XP`}</button>
    </Sheet>
  );
}
function CreateDungeonForm({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("Physical");
  const [rank, setRank] = useState("D");
  const catColor = CATEGORY_MOOD[category];
  return (
    <Sheet title="Create Dungeon" onClose={onClose}>
      <Input placeholder="Dungeon name" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input placeholder="Short description" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.sub, marginBottom: 8, fontWeight: 600 }}>CATEGORY</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {Object.keys(CATEGORY_SEEDS).map((c) => {
          const mood = CATEGORY_MOOD[c];
          const active = category === c;
          return <button key={c} onClick={() => setCategory(c)} style={{ padding: "8px 14px", borderRadius: 12, border: `1px solid ${active ? mood : C.border}`, background: active ? `${mood}22` : C.surface, color: active ? mood : C.sub, fontFamily: bodyFont, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{c}</button>;
        })}
      </div>
      <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.sub, marginBottom: 8, fontWeight: 600 }}>RANK</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {RANKS.map((r) => (
          <button key={r} onClick={() => setRank(r)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: `1px solid ${rank === r ? rankColor(r) : C.border}`, background: rank === r ? `${rankColor(r)}22` : C.surface, color: rank === r ? rankColor(r) : C.sub, fontFamily: headFont, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{r}</button>
        ))}
      </div>
      <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.sub, marginBottom: 18 }}>{RANK_FIXED[rank].days} days · +{RANK_FIXED[rank].xp} XP total</div>
      <button disabled={!title.trim()} onClick={() => onCreate({ title: title.trim(), desc: desc.trim() || "Custom hunter dungeon.", category, rank })} style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 16, cursor: title.trim() ? "pointer" : "default", background: title.trim() ? catColor : C.surfaceAlt, color: title.trim() ? C.bg : C.faint, fontFamily: headFont, fontWeight: 700, fontSize: 14.5 }}>Create & Join</button>
    </Sheet>
  );
}
function DungeonsScreen({ state, allDefs, checkIn, joinDungeon, subTab, setSubTab }) {
  const [open, setOpen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cat, setCat] = useState("All");
  const joinedIds = state.myDungeons.map((d) => d.dungeonId);
  const filtered = cat === "All" ? allDefs : allDefs.filter((d) => d.category === cat);
  return (
    <div style={{ padding: "22px 18px 110px" }}>
      <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 16 }}>Dungeons</div>
      <div style={{ display: "flex", background: C.surface, borderRadius: 14, padding: 4, marginBottom: 18, border: `1px solid ${C.border}` }}>
        {[["explore", "Explore Dungeons"], ["active", "Active Dungeons"]].map(([id, label]) => (
          <button key={id} onClick={() => setSubTab(id)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", background: subTab === id ? C.emberSoft : "transparent", color: subTab === id ? C.ember : C.sub, fontFamily: bodyFont, fontWeight: 700, fontSize: 12.5 }}>{label}</button>
        ))}
      </div>

      {subTab === "explore" && (
        <>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
            {CATEGORIES.map((c) => {
              const mood = c === "All" ? C.ember : CATEGORY_MOOD[c];
              const active = cat === c;
              return <button key={c} onClick={() => setCat(c)} style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: `1px solid ${active ? mood : C.border}`, background: active ? `${mood}22` : C.surface, color: active ? mood : C.sub, fontFamily: bodyFont, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{c}</button>;
            })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((d) => {
              const color = rankColor(d.rank);
              const joined = joinedIds.includes(d.id);
              return (
                <Card key={d.id} onClick={() => setPreview(d)} style={{ borderColor: `${color}33`, cursor: "pointer" }}>
                  <Pill color={color}>{d.rank}-RANK</Pill>
                  <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 15, color: C.text, marginTop: 8 }}>{d.title}</div>
                  <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.sub, marginTop: 4, lineHeight: 1.4 }}>{d.desc}</div>
                  {joined && <div style={{ marginTop: 10 }}><Pill color={C.green}>Joined</Pill></div>}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {subTab === "active" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {state.myDungeons.length === 0 && <div style={{ textAlign: "center", color: C.faint, fontFamily: bodyFont, fontSize: 13.5, padding: 26 }}>No dungeons joined yet. Explore to get started.</div>}
          {state.myDungeons.map((d) => {
            const def = allDefs.find((x) => x.id === d.dungeonId);
            if (!def) return null;
            const color = rankColor(def.rank);
            const { days } = RANK_FIXED[def.rank];
            const pct = Math.round((d.checkins.length / days) * 100);
            return (
              <Card key={d.dungeonId} onClick={() => setOpen(d)} style={{ borderColor: `${color}33`, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <Pill color={color}>{def.rank}-RANK</Pill>
                    <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 16, color: C.text, marginTop: 8 }}>{def.title}</div>
                    <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.sub, marginTop: 2 }}>{def.category} · Day {d.checkins.length}/{days}</div>
                  </div>
                  <ChevronRight size={18} color={C.faint} />
                </div>
                <div style={{ height: 6, background: C.surfaceAlt, borderRadius: 4, marginTop: 14, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4 }} /></div>
              </Card>
            );
          })}
        </div>
      )}

      {open && <DungeonDetail dungeon={open} def={allDefs.find((x) => x.id === open.dungeonId)} onClose={() => setOpen(null)} onCheckIn={(id) => { checkIn(id); setOpen((o) => o && { ...o, checkins: [...o.checkins, todayStr()] }); }} />}
      {preview && <DungeonPreview def={preview} joined={joinedIds.includes(preview.id)} onClose={() => setPreview(null)} onJoin={() => { joinDungeon(preview.id); setPreview(null); setSubTab("active"); }} />}
    </div>
  );
}

/* ============================= Achievements screen ============================= */
function AchievementsScreen({ state, onClose }) {
  const [cat, setCat] = useState("All");
  const all = buildAchievements(state);
  const filtered = cat === "All" ? all : all.filter((a) => a.cat === cat);
  const unlockedCount = all.filter((a) => a.unlocked).length;
  return (
    <Sheet title={`Achievements · ${unlockedCount}/${all.length}`} onClose={onClose}>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {ACH_CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: `1px solid ${cat === c ? C.ember : C.border}`, background: cat === c ? C.emberSoft : C.surface, color: cat === c ? C.ember : C.sub, fontFamily: bodyFont, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{c}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {filtered.map((a) => (
          <Card key={a.id} style={{ padding: 14, opacity: a.unlocked ? 1 : 0.55 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: a.unlocked ? C.emberSoft : C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              {a.unlocked ? <Award size={17} color={C.ember} /> : <Lock size={14} color={C.faint} />}
            </div>
            <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 12.5, color: a.unlocked ? C.text : C.sub }}>{a.title}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 10, color: C.faint, marginTop: 2 }}>{a.sub}</div>
            <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 10.5, color: C.ember, marginTop: 6 }}>+{a.xp} XP</div>
          </Card>
        ))}
      </div>
    </Sheet>
  );
}

/* ============================= Stats ============================= */
function ActivityHeatmap({ activity }) {
  const days = [];
  for (let i = 69; i >= 0; i--) days.push(addDays(todayStr(), -i));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 5 }}>
      {days.map((d) => {
        const c = activity[d] || 0;
        const opacity = c === 0 ? 0.08 : Math.min(1, 0.3 + c * 0.2);
        return <div key={d} style={{ aspectRatio: "1", borderRadius: 5, background: C.ember, opacity }} />;
      })}
    </div>
  );
}
function StatsScreen({ state }) {
  const [showAch, setShowAch] = useState(false);
  const totalXP = totalXPEarned(state);
  const ach = buildAchievements(state);
  const unlockedCount = ach.filter((a) => a.unlocked).length;
  const radarData = TAGS.map((t) => ({ subject: t, value: state.archetypeCounts[t] || 0 }));
  const maxArch = Math.max(1, ...TAGS.map((t) => state.archetypeCounts[t] || 0));
  return (
    <div style={{ padding: "22px 18px 110px" }}>
      <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 16 }}>Stats</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[{ label: "Total XP", value: totalXP, color: C.ember }, { label: "Best Streak", value: `${state.bestStreak}d`, color: "#FF8A5B" }, { label: "Completed", value: state.completedCount, color: "#5EA8FF" }, { label: "Level", value: state.level, color: C.violet }].map((t, i) => (
          <Card key={i}><div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 24, color: t.color }}>{t.value}</div><div style={{ fontFamily: bodyFont, fontSize: 12, color: C.sub, marginTop: 4 }}>{t.label}</div></Card>
        ))}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>Archetype Distribution</div>
        <div style={{ height: 190 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: C.sub, fontSize: 10, fontFamily: bodyFont }} />
              <Radar dataKey="value" stroke={C.ember} fill={C.ember} fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 12 }}>Annual Activity</div>
        <ActivityHeatmap activity={state.activity} />
      </Card>

      <Card onClick={() => setShowAch(true)} style={{ cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Award size={18} color={C.ember} />
            <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 15, color: C.text }}>Achievements</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.sub }}>{unlockedCount}/{ach.length}</span>
            <ChevronRight size={16} color={C.faint} />
          </div>
        </div>
      </Card>
      {showAch && <AchievementsScreen state={state} onClose={() => setShowAch(false)} />}
    </div>
  );
}

/* ============================= Profile ============================= */
function ProfileScreen({ state, onClose, onPhoto, onNameChange, onLogout }) {
  const fileRef = useRef(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(state.name);
  const [showRanks, setShowRanks] = useState(false);
  const rank = rankForLevel(state.level);
  const rankIdx = RANKS.indexOf(rank);
  const status = STATUS_BY_RANK[rank];
  const xpNeeded = xpForLevelN(state.level + 1);
  const totalXP = totalXPEarned(state);
  const isMaxRank = rankIdx === 5;
  const nextRankXP = isMaxRank ? null : cumulativeXpToLevel(rankLevelRange(rankIdx + 1).start);
  const rankProgressPct = isMaxRank ? 100 : Math.min(100, (totalXP / nextRankXP) * 100);
  const ach = buildAchievements(state);
  const unlockedCount = ach.filter((a) => a.unlocked).length;
  return (
    <Sheet title="Profile" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22 }}>
        <button onClick={() => fileRef.current?.click()} style={{ position: "relative", width: 96, height: 96, borderRadius: "50%", border: `2px solid ${rankColor(rank)}`, background: state.photo ? `url(${state.photo})` : C.surfaceAlt, backgroundSize: "cover", backgroundPosition: "center", cursor: "pointer", padding: 0, marginBottom: 12 }}>
          {!state.photo && <Camera size={26} color={C.faint} style={{ position: "absolute", inset: 0, margin: "auto" }} />}
          <div style={{ position: "absolute", bottom: -2, right: -2, width: 30, height: 30, borderRadius: "50%", background: C.ember, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${C.bg}` }}><Camera size={13} color={C.bg} /></div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => { const f = e.target.files?.[0]; if (f) onPhoto(await resizeImageFile(f)); }} />
        {editingName ? (
          <input autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} onBlur={() => { onNameChange(nameDraft.trim() || state.name); setEditingName(false); }} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} style={{ background: "transparent", border: "none", borderBottom: `1px solid ${C.border}`, textAlign: "center", fontFamily: headFont, fontWeight: 800, fontSize: 20, color: C.text, padding: 4, outline: "none" }} />
        ) : (
          <div onClick={() => setEditingName(true)} style={{ fontFamily: headFont, fontWeight: 800, fontSize: 20, color: C.text, cursor: "pointer" }}>{state.name}</div>
        )}

        <button onClick={() => setShowRanks(true)} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, padding: "10px 16px", borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", width: "100%", maxWidth: 280 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: `${rankColor(rank)}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {(() => { const RIcon = RANK_ICON[rank]; return <RIcon size={14} color={rankColor(rank)} />; })()}
          </div>
          <span style={{ fontFamily: headFont, fontWeight: 700, fontSize: 14, color: C.text, flex: 1, textAlign: "left" }}>{rank}-Rank</span>
          <ChevronRight size={16} color={C.sub} style={{ transform: "rotate(90deg)" }} />
        </button>

        <div style={{ position: "relative", height: 150, width: "100%", marginTop: 34 }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)" }}>
            <div className="rankBannerFloat" style={{ transform: "scale(1.9)", transformOrigin: "top center" }}>
              <RankBanner rank={rank} active index={0} />
            </div>
          </div>
        </div>

        <div style={{ width: "100%", marginTop: 16 }}>
          <div style={{ height: 9, background: C.surfaceAlt, borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}` }}>
            <div style={{ height: "100%", width: `${rankProgressPct}%`, background: `linear-gradient(90deg, ${rankColor(rank)}AA, ${rankColor(rank)})`, borderRadius: 20, transition: "width 0.8s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontFamily: bodyFont, fontSize: 11, color: C.sub, letterSpacing: 0.6 }}>RANK RATING</span>
            <span style={{ fontFamily: bodyFont, fontSize: 12, color: C.text }}>{isMaxRank ? <b style={{ color: rankColor(rank) }}>MAX RANK</b> : <><b style={{ color: rankColor(rank) }}>{totalXP.toLocaleString()}</b>/{nextRankXP.toLocaleString()}</>}</span>
          </div>
        </div>
      </div>

      {showRanks && <AllRanksSheet currentRank={rank} onClose={() => setShowRanks(false)} />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <Card style={{ textAlign: "center" }}><div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 26, color: C.text }}>{state.level}</div><div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.sub, marginTop: 4 }}>LEVEL</div></Card>
        <Card style={{ textAlign: "center" }}><div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 26, color: C.ember }}>{totalXP.toLocaleString()}</div><div style={{ fontFamily: bodyFont, fontSize: 11.5, color: C.sub, marginTop: 4 }}>TOTAL XP</div></Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.sub, marginBottom: 6 }}>{state.xp} / {xpNeeded} XP to next level</div>
        <div style={{ height: 6, background: C.surfaceAlt, borderRadius: 4, overflow: "hidden" }}><div style={{ height: "100%", width: `${(state.xp / xpNeeded) * 100}%`, background: rankColor(rank), borderRadius: 4 }} /></div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Card style={{ textAlign: "center", padding: 12 }}><Award size={18} color={C.ember} style={{ marginBottom: 6 }} /><div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 15, color: C.text }}>{unlockedCount}/{ach.length}</div><div style={{ fontFamily: bodyFont, fontSize: 10, color: C.sub, marginTop: 2 }}>Achievements</div></Card>
        <Card style={{ textAlign: "center", padding: 12 }}><Flame size={18} color="#FF8A5B" style={{ marginBottom: 6 }} /><div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 15, color: C.text }}>{state.bestStreak}d</div><div style={{ fontFamily: bodyFont, fontSize: 10, color: C.sub, marginTop: 2 }}>Best Streak</div></Card>
        <Card style={{ textAlign: "center", padding: 12 }}><Gauge size={18} color={C.violet} style={{ marginBottom: 6 }} /><div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 15, color: C.text }}>{state.completedCount}</div><div style={{ fontFamily: bodyFont, fontSize: 10, color: C.sub, marginTop: 2 }}>Completed</div></Card>
      </div>

      <button onClick={onLogout} style={{ width: "100%", marginTop: 22, padding: "13px 0", borderRadius: 14, border: `1px solid ${C.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
        <LogOut size={15} color={C.red} />
        <span style={{ fontFamily: headFont, fontWeight: 700, fontSize: 13.5, color: C.red }}>Log Out</span>
      </button>
    </Sheet>
  );
}
function AllRanksSheet({ currentRank, onClose }) {
  return (
    <Sheet title="All Ranks" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {RANKS.map((r, i) => {
          const isCurrent = r === currentRank;
          const color = rankColor(r);
          const Icon = RANK_ICON[r];
          const { start, end } = rankLevelRange(i);
          const levelLabel = end === null ? `Level ${start}+` : `Level ${start}–${end}`;
          const xpToUnlock = cumulativeXpToLevel(start);
          return (
            <div key={r} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 16, background: isCurrent ? `${color}14` : C.surface, border: `1px solid ${isCurrent ? color : C.border}` }}>
              <div style={{ transform: "scale(0.62)", transformOrigin: "center" }}><RankBanner rank={r} active index={0} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: headFont, fontWeight: 800, fontSize: 15, color: C.text }}>{r}-Rank</span>
                  {isCurrent && <Pill color={color}>Current</Pill>}
                </div>
                <div style={{ fontFamily: bodyFont, fontSize: 12.5, color, marginTop: 2 }}>{STATUS_BY_RANK[r]}</div>
                <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.sub, marginTop: 2 }}>{levelLabel} · {i === 0 ? "Start" : `${xpToUnlock.toLocaleString()} XP to unlock`}</div>
              </div>
              <Icon size={16} color={color} />
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

/* ============================= Create sheets ============================= */
function CreateQuestSheet({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("Physical");
  const [xp, setXp] = useState(15);
  return (
    <Sheet title="New Quest" onClose={onClose}>
      <Input placeholder="Quest name" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.sub, marginBottom: 8, fontWeight: 600 }}>ARCHETYPE</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {TAGS.map((t) => (
          <button key={t} onClick={() => setTag(t)} style={{ padding: "8px 14px", borderRadius: 12, border: `1px solid ${tag === t ? tagColor[t] : C.border}`, background: tag === t ? `${tagColor[t]}22` : C.surface, color: tag === t ? tagColor[t] : C.sub, fontFamily: bodyFont, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>{t}</button>
        ))}
      </div>
      <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: C.sub, marginBottom: 8, fontWeight: 600 }}>XP REWARD</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[10, 15, 20, 25, 30].map((v) => (
          <button key={v} onClick={() => setXp(v)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: `1px solid ${xp === v ? C.ember : C.border}`, background: xp === v ? C.emberSoft : C.surface, color: xp === v ? C.ember : C.sub, fontFamily: headFont, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{v}</button>
        ))}
      </div>
      <button disabled={!title.trim()} onClick={() => onCreate({ title: title.trim(), tag, xp })} style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 16, cursor: title.trim() ? "pointer" : "default", background: title.trim() ? C.ember : C.surfaceAlt, color: title.trim() ? C.bg : C.faint, fontFamily: headFont, fontWeight: 700, fontSize: 14.5 }}>Create Quest</button>
    </Sheet>
  );
}

/* ============================= Bottom Nav ============================= */
function BottomNav({ tab, setTab, onAdd }) {
  const items = [{ id: "home", icon: Home }, { id: "quests", icon: CheckCircle2 }, { id: "add", icon: Plus }, { id: "dungeons", icon: Compass }, { id: "stats", icon: BarChart3 }];
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 460, padding: "0 16px 20px", zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", background: "rgba(18,21,28,0.9)", backdropFilter: "blur(14px)", border: `1px solid ${C.border}`, borderRadius: 26, padding: "10px 8px" }}>
        {items.map((it) => {
          const Icon = it.icon;
          if (it.id === "add") return <button key={it.id} onClick={onAdd} style={{ width: 52, height: 52, minWidth: 52, borderRadius: "50%", border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${C.ember}, #C96A22)`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: -18, boxShadow: `0 6px 18px ${C.emberSoft}` }}><Icon size={22} color="#0B0D12" strokeWidth={2.5} /></button>;
          const active = tab === it.id;
          return <button key={it.id} onClick={() => setTab(it.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "8px 16px", borderRadius: 14 }}><Icon size={20} color={active ? C.ember : C.faint} /></button>;
        })}
      </div>
    </div>
  );
}

/* ============================= persistence ============================= */
function useAppState() {
  const [state, setState] = useState(() => {
    try { const saved = localStorage.getItem("hunterapp_state"); return saved ? { ...DEFAULT_STATE, ...JSON.parse(saved) } : DEFAULT_STATE; } catch { return DEFAULT_STATE; }
  });
  useEffect(() => { try { localStorage.setItem("hunterapp_state", JSON.stringify(state)); } catch {} }, [state]);
  return [state, setState];
}

/* ============================= App ============================= */
export default function App() {
  const [state, setState] = useAppState();
  const [tab, setTab] = useState("home");
  const [sheet, setSheet] = useState(null);
  const [dungeonSubTab, setDungeonSubTab] = useState("active");
  const allDefs = useRef([...DUNGEON_LIBRARY, ...state.customDungeonDefs]).current;
  const prevUnlocked = useRef(null);

  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    const desired = "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover";
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    const prevContent = meta.getAttribute("content");
    meta.setAttribute("content", desired);
    const blockGesture = (e) => e.preventDefault();
    document.addEventListener("gesturestart", blockGesture);
    let lastTouchEnd = 0;
    const blockDoubleTapZoom = (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    };
    document.addEventListener("touchend", blockDoubleTapZoom, { passive: false });
    return () => {
      if (prevContent !== null) meta.setAttribute("content", prevContent); else meta.remove();
      document.removeEventListener("gesturestart", blockGesture);
      document.removeEventListener("touchend", blockDoubleTapZoom);
    };
  }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    const ach = buildAchievements(state);
    const unlockedIds = new Set(ach.filter((a) => a.unlocked).map((a) => a.id));
    if (prevUnlocked.current === null) { prevUnlocked.current = unlockedIds; return; }
    ach.filter((a) => a.unlocked && !prevUnlocked.current.has(a.id)).forEach((a) => emitToast({ kind: "milestone", text: `Unlocked: ${a.title}` }));
    prevUnlocked.current = unlockedIds;
  }, [state]);

  useEffect(() => {
    const today = todayStr();
    if (state.lastPenaltyCheckDate === today) return;
    const yesterday = addDays(today, -1);
    if (state.lastPenaltyCheckDate !== null && Object.keys(state.questActivity).length > 0) {
      const doneYesterday = state.questActivity[yesterday] || 0;
      if (doneYesterday < 1) { setState((s) => { const { level, xp } = addXp(s, -50); emitToast({ kind: "penalty", text: "-50 XP — missed quests yesterday" }); return { ...s, level, xp, lastPenaltyCheckDate: today }; }); return; }
    }
    setState((s) => ({ ...s, lastPenaltyCheckDate: today }));
    // eslint-disable-next-line
  }, []);

  function completeQuest(id) {
    const today = todayStr();
    setState((s) => {
      const q = s.quests.find((x) => x.id === id);
      if (!q) return s;
      const alreadyDone = q.lastCompletedDate === today;
      const delta = alreadyDone ? -q.xp : q.xp;
      const { level, xp } = addXp(s, delta);
      const streakInfo = (() => {
        if (alreadyDone || s.lastActiveDate === today) return { currentStreak: s.currentStreak, bestStreak: s.bestStreak };
        const yesterday = addDays(today, -1);
        const cur = s.lastActiveDate === yesterday ? s.currentStreak + 1 : 1;
        return { currentStreak: cur, bestStreak: Math.max(s.bestStreak, cur) };
      })();
      if (!alreadyDone) emitToast({ kind: "xp", text: `+${q.xp} XP earned` });
      return {
        ...s, level, xp, ...streakInfo,
        lastActiveDate: alreadyDone ? s.lastActiveDate : today,
        completedCount: s.completedCount + (alreadyDone ? -1 : 1),
        activity: { ...s.activity, [today]: Math.max(0, (s.activity[today] || 0) + (alreadyDone ? -1 : 1)) },
        archetypeCounts: { ...s.archetypeCounts, [q.tag]: Math.max(0, (s.archetypeCounts[q.tag] || 0) + (alreadyDone ? -1 : 1)) },
        quests: s.quests.map((x) => x.id === id ? { ...x, lastCompletedDate: alreadyDone ? null : today, timesCompleted: (x.timesCompleted || 0) + (alreadyDone ? -1 : 1) } : x),
        questActivity: { ...s.questActivity, [today]: Math.max(0, (s.questActivity[today] || 0) + (alreadyDone ? -1 : 1)) },
      };
    });
  }
  function createQuest(data) { setState((s) => ({ ...s, quests: [...s.quests, { id: "q" + Date.now(), ...data, lastCompletedDate: null, timesCompleted: 0 }] })); setSheet(null); setTab("quests"); }
  function joinDungeon(id, customDef) {
    setState((s) => {
      let defId = id;
      let newCustom = s.customDungeonDefs;
      if (customDef) { defId = "custom-" + Date.now(); newCustom = [...s.customDungeonDefs, { ...customDef, id: defId, days: RANK_FIXED[customDef.rank].days, xp: RANK_FIXED[customDef.rank].xp }]; allDefs.push(newCustom[newCustom.length - 1]); }
      if (s.myDungeons.some((d) => d.dungeonId === defId)) return s;
      return { ...s, customDungeonDefs: newCustom, myDungeons: [...s.myDungeons, { dungeonId: defId, joinedAt: todayStr(), checkins: [], streak: 0 }] };
    });
    setTab("dungeons");
    setDungeonSubTab("active");
  }
  function checkIn(id) {
    const today = todayStr();
    setState((s) => {
      const d = s.myDungeons.find((x) => x.dungeonId === id);
      if (!d || d.checkins.includes(today)) return s;
      const def = allDefs.find((x) => x.id === id);
      const { days, xp } = RANK_FIXED[def.rank];
      const perDay = Math.round(xp / days);
      const { level, xp: newXp } = addXp(s, perDay);
      const arch = DUNGEON_TO_ARCHETYPE[def.category];
      emitToast({ kind: "xp", text: `+${perDay} XP — checked in` });
      return {
        ...s, level, xp: newXp,
        completedCount: s.completedCount + 1,
        activity: { ...s.activity, [today]: (s.activity[today] || 0) + 1 },
        archetypeCounts: arch ? { ...s.archetypeCounts, [arch]: (s.archetypeCounts[arch] || 0) + 1 } : s.archetypeCounts,
        myDungeons: s.myDungeons.map((x) => x.dungeonId === id ? { ...x, checkins: [...x.checkins, today], streak: x.streak + 1 } : x),
      };
    });
  }

  if (!state.registered) {
    return <AuthScreen onAuth={({ name, email }) => setState((s) => ({ ...s, registered: true, email, ...(name ? { name } : {}) }))} />;
  }

  return (
    <div className="no-select" style={{ minHeight: "100vh", background: C.bg, display: "flex", justifyContent: "center", touchAction: "manipulation" }}>
      <GlobalStyles />
      <ToastLayer />
      <div style={{ width: "100%", maxWidth: 460, minHeight: "100vh" }}>
        {tab === "home" && <HomeScreen state={state} completeQuest={completeQuest} onAvatar={() => setSheet("profile")} />}
        {tab === "quests" && <QuestsScreen state={state} completeQuest={completeQuest} />}
        {tab === "dungeons" && <DungeonsScreen state={state} allDefs={allDefs} checkIn={checkIn} joinDungeon={joinDungeon} subTab={dungeonSubTab} setSubTab={setDungeonSubTab} />}
        {tab === "stats" && <StatsScreen state={state} />}
        <BottomNav tab={tab} setTab={setTab} onAdd={() => setSheet("pick")} />
      </div>

      {sheet === "pick" && (
        <Sheet title="Create New" onClose={() => setSheet(null)}>
          <button onClick={() => setSheet("quest")} style={{ width: "100%", textAlign: "left", padding: "16px", borderRadius: 16, border: `1px solid ${C.border}`, background: C.surface, marginBottom: 10, cursor: "pointer", fontFamily: headFont, fontWeight: 700, fontSize: 14.5, color: C.text }}>New Quest</button>
          <button onClick={() => { setSheet(null); setTab("dungeons"); setDungeonSubTab("explore"); }} style={{ width: "100%", textAlign: "left", padding: "16px", borderRadius: 16, border: `1px solid ${C.border}`, background: C.surface, marginBottom: 10, cursor: "pointer", fontFamily: headFont, fontWeight: 700, fontSize: 14.5, color: C.text }}>Explore Dungeons</button>
          <button onClick={() => setSheet("dungeon-create")} style={{ width: "100%", textAlign: "left", padding: "16px", borderRadius: 16, border: `1px solid ${C.ember}55`, background: C.emberSoft, cursor: "pointer", fontFamily: headFont, fontWeight: 700, fontSize: 14.5, color: C.ember }}>Create Dungeon</button>
        </Sheet>
      )}
      {sheet === "quest" && <CreateQuestSheet onClose={() => setSheet(null)} onCreate={createQuest} />}
      {sheet === "dungeon-create" && <CreateDungeonForm onClose={() => setSheet(null)} onCreate={(def) => { joinDungeon(null, def); setSheet(null); setTab("dungeons"); }} />}
      {sheet === "profile" && <ProfileScreen state={state} onClose={() => setSheet(null)} onPhoto={(photo) => setState((s) => ({ ...s, photo }))} onNameChange={(name) => setState((s) => ({ ...s, name }))} onLogout={() => { setState((s) => ({ ...s, registered: false })); setSheet(null); }} />}
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
