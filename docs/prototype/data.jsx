// data.jsx — TangWong game data
// Animal-mascot avatars (emoji), players, games catalog, Avalon roles + quests, chat.

// Each mascot: emoji + a 2-stop gradient for the avatar disc
const MASCOTS = {
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
const ME = { id: 'me', name: 'คุณ', en: 'You', mascot: 'fox', online: true };

// Player roster for the demo room (7-player Avalon)
const PLAYERS = [
  ME,
  { id: 'p2', name: 'มิ้นท์',  en: 'Mint',   mascot: 'cat',     online: true },
  { id: 'p3', name: 'แบงค์',  en: 'Bank',    mascot: 'raccoon', online: true },
  { id: 'p4', name: 'แพรวา',  en: 'Praewa',  mascot: 'owl',     online: true },
  { id: 'p5', name: 'ต้น',    en: 'Ton',     mascot: 'panda',   online: true },
  { id: 'p6', name: 'ไนน์',   en: 'Nine',    mascot: 'rabbit',  online: true },
  { id: 'p7', name: 'กัน',    en: 'Gun',     mascot: 'bear',    online: true },
];

// Online friends (for home)
const FRIENDS = [
  { id: 'f1', name: 'พลอย', en: 'Ploy', mascot: 'frog',  status: 'in-room',  online: true },
  { id: 'f2', name: 'เจมส์', en: 'James', mascot: 'tiger', status: 'online',  online: true },
  { id: 'f3', name: 'มาย',  en: 'May',  mascot: 'rabbit', status: 'online',  online: true },
  { id: 'f4', name: 'โอ๊ต',  en: 'Oat',  mascot: 'koala', status: 'playing', online: true },
  { id: 'f5', name: 'ฟ้า',  en: 'Fah',  mascot: 'deer',  status: 'online',  online: true },
  { id: 'f6', name: 'บีม',  en: 'Beam', mascot: 'wolf',  status: 'away',    online: false },
];

// Games catalog
const GAMES = [
  {
    id: 'avalon', name: 'Avalon', th: 'อาวาลอน', tag: 'Social Deduction', th_tag: 'เกมจับโกหก',
    emoji: '🛡️', players: '5–10', mins: '20–30', heat: 'HOT',
    g: ['#6D5EF9', '#3B2C9E'], accent: '#9C8BFF',
    desc: 'ภารกิจลับของอัศวินโต๊ะกลม สืบหาคนทรยศก่อนสายเกินไป',
    rules: {
      goal: 'ฝ่ายดีต้องทำภารกิจสำเร็จ 3 ครั้ง · ฝ่ายชั่วต้องทำลายภารกิจ 3 ครั้ง หรือลอบสังหารเมอร์ลินได้สำเร็จ',
      steps: [
        ['🎴', 'รับบทบาทลับ', 'ทุกคนจับบทบาทเป็นฝ่ายดีหรือฝ่ายชั่ว เมอร์ลินรู้ว่าใครคือฝ่ายชั่ว'],
        ['👑', 'หัวหน้าจัดทีม', 'หัวหน้าเลือกผู้เล่นไปทำภารกิจ ตามจำนวนที่กำหนด'],
        ['🗳️', 'โหวตทีม', 'ทุกคนโหวตเห็นชอบหรือปฏิเสธทีม ถ้าผ่านเกินครึ่งจึงออกภารกิจ'],
        ['⚔️', 'ทำภารกิจ', 'สมาชิกในทีมเลือกสำเร็จหรือทรยศแบบลับ ฝ่ายดีต้องทำสำเร็จเสมอ'],
        ['🗡️', 'ลอบสังหาร', 'หากฝ่ายดีชนะ 3 ภารกิจ ฝ่ายชั่วมีโอกาสสุดท้ายในการชี้ตัวเมอร์ลิน'],
      ],
      tips: ['อย่าเปิดเผยว่าเป็นเมอร์ลินเร็วเกินไป', 'สังเกตว่าใครโหวตผ่านทีมที่มีคนน่าสงสัย'],
    },
  },
  {
    id: 'werewolf', name: 'Werewolf', th: 'มนุษย์หมาป่า', tag: 'Social Deduction', th_tag: 'เกมจับโกหก',
    emoji: '🐺', players: '6–16', mins: '15–40', heat: '',
    g: ['#FF5C6C', '#7A1F35'], accent: '#FF8A96',
    desc: 'กลางคืนหมาป่าออกล่า กลางวันชาวบ้านโหวตจับ',
    rules: {
      goal: 'ชาวบ้านต้องกำจัดหมาป่าให้หมด · หมาป่าต้องล่าชาวบ้านจนมีจำนวนเท่าหรือมากกว่า',
      steps: [
        ['🌙', 'กลางคืน', 'ทุกคนหลับตา หมาป่าตื่นมาเลือกเหยื่อ ผู้มีพลังพิเศษใช้ความสามารถ'],
        ['☀️', 'กลางวัน', 'ทุกคนตื่น ประกาศว่าใครถูกล่าในคืนที่ผ่านมา'],
        ['💬', 'ถกเถียง', 'ชาวบ้านพูดคุยหาเบาะแส กล่าวหาผู้ที่น่าสงสัย'],
        ['🗳️', 'โหวตประหาร', 'โหวตเลือกผู้ที่จะถูกกำจัด คนที่ได้คะแนนมากที่สุดออกจากเกม'],
      ],
      tips: ['ผู้พยากรณ์ควรปกปิดตัวตนไว้ก่อน', 'ฟังน้ำเสียงและจังหวะการโหวตของแต่ละคน'],
    },
  },
  {
    id: 'coup', name: 'Coup', th: 'รัฐประหาร', tag: 'Bluffing', th_tag: 'เกมบลัฟ',
    emoji: '🎭', players: '2–6', mins: '10–15', heat: 'NEW',
    g: ['#FF9F43', '#9E4E12'], accent: '#FFC07A',
    desc: 'โกหก ขู่ และกำจัดคู่แข่งให้เหลือคนเดียว',
    rules: {
      goal: 'เป็นผู้เล่นคนสุดท้ายที่ยังมีอิทธิพล (การ์ด) เหลืออยู่บนโต๊ะ',
      steps: [
        ['🃏', 'รับการ์ดอิทธิพล', 'ทุกคนถือการ์ดตัวละครลับ 2 ใบ แต่ละตัวมีความสามารถต่างกัน'],
        ['💰', 'เก็บเหรียญ', 'ผลัดกันทำแอ็กชัน เก็บเหรียญหรือใช้ความสามารถของตัวละคร'],
        ['🎭', 'บลัฟได้', 'อ้างว่าถือตัวละครใดก็ได้ แม้ไม่ได้ถือจริง เสี่ยงถูกจับโกหก'],
        ['⚔️', 'ท้าทาย', 'ถ้าคิดว่าใครโกหก ท้าได้ ผู้แพ้เสียการ์ด 1 ใบ'],
      ],
      tips: ['เก็บ 7 เหรียญเพื่อทำรัฐประหารที่บล็อกไม่ได้', 'บลัฟอย่างมั่นใจ แต่อย่าบ่อยเกินไป'],
    },
  },
  {
    id: 'dixit', name: 'Dixit', th: 'ดิกซิท', tag: 'Storytelling', th_tag: 'เล่าเรื่อง',
    emoji: '🎨', players: '3–8', mins: '20–30', heat: '',
    g: ['#00D4FF', '#0A6E8C'], accent: '#7DE8FF',
    desc: 'เล่าเรื่องจากภาพปริศนา ทายให้ถูกแต่อย่าชัดเกินไป',
    rules: {
      goal: 'สะสมแต้มให้มากที่สุดจากการทายภาพและหลอกให้คนอื่นทายผิด',
      steps: [
        ['🖼️', 'ผู้เล่าเลือกภาพ', 'ผู้เล่าเลือกการ์ดภาพ 1 ใบ แล้วบอกคำใบ้ (คำ ประโยค หรือเสียง)'],
        ['🎴', 'ส่งภาพหลอก', 'ผู้เล่นคนอื่นเลือกภาพที่เข้ากับคำใบ้ที่สุดเพื่อหลอก'],
        ['🔍', 'ทายภาพจริง', 'ทุกคนทายว่าใบไหนคือภาพของผู้เล่า'],
        ['⭐', 'นับแต้ม', 'ได้แต้มเมื่อทายถูก หรือเมื่อมีคนทายภาพของคุณผิด'],
      ],
      tips: ['คำใบ้ที่ดีต้องไม่ชัดเกินไปและไม่คลุมเครือเกินไป', 'ถ้าทุกคนทายถูกหมด ผู้เล่าไม่ได้แต้ม'],
    },
  },
];

// games coming soon — teaser cards (no rules yet)
const UPCOMING = [
  { id: 'salem', name: 'Salem 1692', th: 'เซเลม 1692', th_tag: 'เกมจับโกหก', emoji: '🕯️', players: '4–12', mins: '20–45', g: ['#8B5CF6', '#3B2363'], when: 'ก.ค. 2026' },
  { id: 'sheriff', name: 'Sheriff', th: 'นายอำเภอ', th_tag: 'เกมบลัฟ', emoji: '🤠', players: '3–5', mins: '20–30', g: ['#E0A03A', '#7A4A12'], when: 'ส.ค. 2026' },
  { id: 'spyfall', name: 'Spyfall', th: 'สายลับ', th_tag: 'เกมจับโกหก', emoji: '🕵️', players: '3–8', mins: '10–15', g: ['#34A0A4', '#0B4A4D'], when: 'เร็วๆ นี้' },
];

// ─── Avalon model ───
const ROLES = {
  merlin:   { name: 'Merlin',         th: 'เมอร์ลิน',     side: 'good', em: '🧙', desc: 'รู้ว่าใครคือฝ่ายชั่ว แต่ต้องปกปิดตัวตน มิฉะนั้นจะถูกลอบสังหาร' },
  percival: { name: 'Percival',       th: 'เพอร์ซิวาล',   side: 'good', em: '🔮', desc: 'รู้ว่าใครคือเมอร์ลิน (และมอร์กานา) ปกป้องเขาไว้' },
  servant:  { name: 'Loyal Servant',  th: 'ข้ารับใช้ผู้ภักดี', side: 'good', em: '⚔️', desc: 'อัศวินผู้ซื่อสัตย์ ทำภารกิจให้สำเร็จ 3 ครั้ง' },
  morgana:  { name: 'Morgana',        th: 'มอร์กานา',     side: 'evil', em: '🌙', desc: 'ปลอมตัวเป็นเมอร์ลินเพื่อหลอกเพอร์ซิวาล' },
  assassin: { name: 'Assassin',       th: 'นักลอบสังหาร', side: 'evil', em: '🗡️', desc: 'หากฝ่ายดีชนะ 3 ภารกิจ เจ้าได้ลอบสังหารเมอร์ลิน' },
  mordred:  { name: 'Mordred',        th: 'มอร์เดร็ด',    side: 'evil', em: '👁️', desc: 'เมอร์ลินมองไม่เห็นเจ้า ซ่อนเร้นในเงามืด' },
  minion:   { name: 'Minion',         th: 'สมุนมอร์เดร็ด', side: 'evil', em: '💀', desc: 'รับใช้ฝ่ายมืด ทำภารกิจให้ล้มเหลว' },
};

// role assignment for the 7 players (you are Merlin)
const ROLE_OF = {
  me: 'merlin', p2: 'servant', p3: 'morgana', p4: 'percival',
  p5: 'assassin', p6: 'servant', p7: 'mordred',
};

// quest sizes for 7 players; q4 needs 2 fails
const QUESTS = [
  { size: 2, fails: 1 },
  { size: 3, fails: 1 },
  { size: 3, fails: 1 },
  { size: 4, fails: 2 },
  { size: 4, fails: 1 },
];

// pre-seeded lobby chat
const LOBBY_CHAT = [
  { who: 'p4', text: 'พร้อมยัง เริ่มเลยมั้ย 😆', t: '20:14' },
  { who: 'p3', text: 'รอบนี้ห้ามทรยศนะ555', t: '20:14' },
  { who: 'me', text: 'จัด Avalon เลย', t: '20:15' },
];

// bots to fill a room
const BOT_POOL = [
  { mascot: 'wolf',    name: 'บอทหมาป่า' },
  { mascot: 'lion',    name: 'บอทสิงโต' },
  { mascot: 'koala',   name: 'บอทโคอาล่า' },
  { mascot: 'tiger',   name: 'บอทเสือ' },
  { mascot: 'deer',    name: 'บอทกวาง' },
  { mascot: 'frog',    name: 'บอทกบ' },
  { mascot: 'hamster', name: 'บอทแฮม' },
];

Object.assign(window, { MASCOTS, ME, PLAYERS, FRIENDS, GAMES, UPCOMING, BOT_POOL, ROLES, ROLE_OF, QUESTS, LOBBY_CHAT });
