// data.ts — TangWong game data (typed)
// Animal-mascot avatars (emoji), players, games catalog, Avalon roles + quests, chat.
import type {
  Mascot, MascotKey, Player, Friend, Game, Role, RoleKey, Quest, ChatMessage,
} from './types/index.ts';

// Each mascot: emoji + a 2-stop gradient for the avatar disc
export const MASCOTS: Record<MascotKey, Mascot> = {
  fox:     { em: '🦊', g: ['#FF9F43', '#FF6B4D'] },
  owl:     { em: '🦉', g: ['#8B7BFF', '#6D5EF9'] },
  cat:     { em: '🐱', g: ['#FFC36B', '#FF8E53'] },
  raccoon: { em: '🦝', g: ['#7C8BA8', '#4B5876'] },
  panda:   { em: '🐼', g: ['#A9B4C9', '#6B7891'] },
  rabbit:  { em: '🐰', g: ['#FF9DC0', '#FF6FA3'] },
  bear:    { em: '🐻', g: ['#C98B5E', '#9B5E36'] },
  tiger:   { em: '🐯', g: ['#FFB14E', '#F97B2D'] },
  frog:    { em: '🐸', g: ['#5FD08A', '#2FA968'] },
  koala:   { em: '🐨', g: ['#9FB0C4', '#6E8099'] },
  wolf:    { em: '🐺', g: ['#7E8CA8', '#515f7d'] },
  lion:    { em: '🦁', g: ['#FFC861', '#F39A2B'] },
  deer:    { em: '🦌', g: ['#D9A36B', '#B07842'] },
  hamster: { em: '🐹', g: ['#FFCB91', '#FF9A57'] },
};

// The signed-in user
export const ME: Player = { id: 'me', name: 'คุณ', en: 'You', mascot: 'fox', online: true };

// Bots that can be added to fill empty room seats (distinct mascots).
export const BOT_POOL: { mascot: MascotKey; name: string }[] = [
  { mascot: 'wolf',    name: 'บอทหมาป่า' },
  { mascot: 'lion',    name: 'บอทสิงโต' },
  { mascot: 'koala',   name: 'บอทโคอาล่า' },
  { mascot: 'tiger',   name: 'บอทเสือ' },
  { mascot: 'deer',    name: 'บอทกวาง' },
  { mascot: 'frog',    name: 'บอทกบ' },
  { mascot: 'hamster', name: 'บอทแฮม' },
];

// Player roster for the demo room (7-player Avalon)
export const PLAYERS: Player[] = [
  ME,
  { id: 'p2', name: 'มิ้นท์',  en: 'Mint',   mascot: 'cat',     online: true },
  { id: 'p3', name: 'แบงค์',  en: 'Bank',    mascot: 'raccoon', online: true },
  { id: 'p4', name: 'แพรวา',  en: 'Praewa',  mascot: 'owl',     online: true },
  { id: 'p5', name: 'ต้น',    en: 'Ton',     mascot: 'panda',   online: true },
  { id: 'p6', name: 'ไนน์',   en: 'Nine',    mascot: 'rabbit',  online: true },
  { id: 'p7', name: 'กัน',    en: 'Gun',     mascot: 'bear',    online: true },
];

// Online friends (for home)
export const FRIENDS: Friend[] = [
  { id: 'f1', name: 'พลอย', en: 'Ploy',  mascot: 'frog',   status: 'in-room', online: true  },
  { id: 'f2', name: 'เจมส์', en: 'James', mascot: 'tiger',  status: 'online',  online: true  },
  { id: 'f3', name: 'มาย',  en: 'May',   mascot: 'rabbit', status: 'online',  online: true  },
  { id: 'f4', name: 'โอ๊ต',  en: 'Oat',   mascot: 'koala',  status: 'playing', online: true  },
  { id: 'f5', name: 'ฟ้า',  en: 'Fah',   mascot: 'deer',   status: 'online',  online: true  },
  { id: 'f6', name: 'บีม',  en: 'Beam',  mascot: 'wolf',   status: 'away',    online: false },
];

// Games catalog
export const GAMES: Game[] = [
  {
    id: 'avalon', name: 'Avalon', th: 'อาวาลอน', tag: 'Social Deduction', th_tag: 'เกมจับโกหก',
    emoji: '🛡️', players: '5–10', minPlayers: 5, maxPlayers: 10, mins: '20–30', heat: 'HOT',
    g: ['#6D5EF9', '#3B2C9E'], accent: '#9C8BFF', available: true,
    desc: 'ภารกิจลับของอัศวินโต๊ะกลม สืบหาคนทรยศก่อนสายเกินไป',
  },
  {
    id: 'werewolf', name: 'Werewolf', th: 'มนุษย์หมาป่า', tag: 'Social Deduction', th_tag: 'เกมจับโกหก',
    emoji: '🐺', players: '6–16', minPlayers: 6, maxPlayers: 16, mins: '15–40', heat: '',
    g: ['#FF5C6C', '#7A1F35'], accent: '#FF8A96', available: false,
    desc: 'กลางคืนหมาป่าออกล่า กลางวันชาวบ้านโหวตจับ',
  },
  {
    id: 'coup', name: 'Coup', th: 'รัฐประหาร', tag: 'Bluffing', th_tag: 'เกมบลัฟ',
    emoji: '🎭', players: '2–6', minPlayers: 2, maxPlayers: 6, mins: '10–15', heat: 'NEW',
    g: ['#FF9F43', '#9E4E12'], accent: '#FFC07A', available: false,
    desc: 'โกหก ขู่ และกำจัดคู่แข่งให้เหลือคนเดียว',
  },
  {
    id: 'dixit', name: 'Dixit', th: 'ดิกซิท', tag: 'Storytelling', th_tag: 'เล่าเรื่อง',
    emoji: '🎨', players: '3–8', minPlayers: 3, maxPlayers: 8, mins: '20–30', heat: '',
    g: ['#00D4FF', '#0A6E8C'], accent: '#7DE8FF', available: false,
    desc: 'เล่าเรื่องจากภาพปริศนา ทายให้ถูกแต่อย่าชัดเกินไป',
  },
];

// ─── Avalon model ───────────────────────────────────────────────────────────

export const ROLES: Record<RoleKey, Role> = {
  merlin:   { name: 'Merlin',         th: 'เมอร์ลิน',          side: 'good', em: '🧙', desc: 'รู้ว่าใครคือฝ่ายชั่ว แต่ต้องปกปิดตัวตน มิฉะนั้นจะถูกลอบสังหาร' },
  percival: { name: 'Percival',       th: 'เพอร์ซิวาล',        side: 'good', em: '🔮', desc: 'รู้ว่าใครคือเมอร์ลิน (และมอร์กานา) ปกป้องเขาไว้' },
  servant:  { name: 'Loyal Servant',  th: 'ข้ารับใช้ผู้ภักดี', side: 'good', em: '⚔️', desc: 'อัศวินผู้ซื่อสัตย์ ทำภารกิจให้สำเร็จ 3 ครั้ง' },
  morgana:  { name: 'Morgana',        th: 'มอร์กานา',          side: 'evil', em: '🌙', desc: 'ปลอมตัวเป็นเมอร์ลินเพื่อหลอกเพอร์ซิวาล' },
  assassin: { name: 'Assassin',       th: 'นักลอบสังหาร',      side: 'evil', em: '🗡️', desc: 'หากฝ่ายดีชนะ 3 ภารกิจ เจ้าได้ลอบสังหารเมอร์ลิน' },
  mordred:  { name: 'Mordred',        th: 'มอร์เดร็ด',         side: 'evil', em: '👁️', desc: 'เมอร์ลินมองไม่เห็นเจ้า ซ่อนเร้นในเงามืด' },
  minion:   { name: 'Minion',         th: 'สมุนมอร์เดร็ด',     side: 'evil', em: '💀', desc: 'รับใช้ฝ่ายมืด ทำภารกิจให้ล้มเหลว' },
};

// role assignment for the 7 players (you are Merlin)
export const ROLE_OF: Record<string, RoleKey> = {
  me: 'merlin', p2: 'servant', p3: 'morgana', p4: 'percival',
  p5: 'assassin', p6: 'servant', p7: 'mordred',
};

// quest sizes for 7 players; q4 needs 2 fails
export const QUESTS: Quest[] = [
  { size: 2, fails: 1 },
  { size: 3, fails: 1 },
  { size: 3, fails: 1 },
  { size: 4, fails: 2 },
  { size: 4, fails: 1 },
];

// pre-seeded lobby chat (demo seed; real chat flows through the useChat store)
export const LOBBY_CHAT: ChatMessage[] = [
  { id: 'seed_1', kind: 'user', who: 'p4', text: 'พร้อมยัง เริ่มเลยมั้ย 😆', ts: 0, reactions: [] },
  { id: 'seed_2', kind: 'user', who: 'p3', text: 'รอบนี้ห้ามทรยศนะ555',       ts: 0, reactions: [] },
  { id: 'seed_3', kind: 'user', who: 'me', text: 'จัด Avalon เลย',             ts: 0, reactions: [] },
];
