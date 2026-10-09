/* ===================================================================
   Reading Boost — Curriculum Data
   A structured-literacy (Orton-Gillingham style) scope & sequence.
   Each level introduces a small set of sound patterns, then practices
   them through decodable words, heart (irregular) words, sentences,
   and a short story. Levels build on each other in order.

   words: [word, emoji, graphemes]  — graphemes are the sound chunks
          used for the "sound boxes" (e.g. "sh|i|p", "c|a_e|k").
   =================================================================== */

const READING_LEVELS = [
  {
    id: 1,
    title: 'Short A',
    icon: '🍎',
    focus: 'Letters a, m, s, t, p, n, c and the short "a" sound',
    sounds: [
      { g: 'a', key: 'apple',  emoji: '🍎' },
      { g: 'm', key: 'moon',   emoji: '🌙' },
      { g: 's', key: 'sun',    emoji: '☀️' },
      { g: 't', key: 'tiger',  emoji: '🐯' },
      { g: 'p', key: 'pig',    emoji: '🐷' },
      { g: 'n', key: 'nest',   emoji: '🪺' },
      { g: 'c', key: 'cat',    emoji: '🐱' },
    ],
    words: [
      ['cat', '🐱', 'c|a|t'], ['map', '🗺️', 'm|a|p'], ['pan', '🍳', 'p|a|n'],
      ['man', '👨', 'm|a|n'], ['nap', '😴', 'n|a|p'], ['mat', '🟫', 'm|a|t'],
      ['cap', '🧢', 'c|a|p'], ['can', '🥫', 'c|a|n'],
    ],
    heartWords: ['the', 'a', 'I', 'is'],
    sentences: ['Sam sat.', 'The cat sat.', 'A man can nap.', 'Pam can tap the pan.'],
    story: {
      title: 'Sam the Cat',
      text: 'Sam is a cat. Sam sat on a mat. Sam can nap. The man can pat Sam.',
      question: 'Who is Sam?',
      choices: ['A cat', 'A man', 'A map'],
      answer: 0,
    },
  },
  {
    id: 2,
    title: 'Short I',
    icon: '🐷',
    focus: 'Short "i" plus f, d, h, g',
    sounds: [
      { g: 'i', key: 'igloo',  emoji: '🛖' },
      { g: 'f', key: 'fish',   emoji: '🐟' },
      { g: 'd', key: 'dog',    emoji: '🐶' },
      { g: 'h', key: 'hat',    emoji: '🎩' },
      { g: 'g', key: 'goat',   emoji: '🐐' },
    ],
    words: [
      ['pig', '🐷', 'p|i|g'], ['dig', '⛏️', 'd|i|g'], ['fin', '🦈', 'f|i|n'],
      ['hat', '🎩', 'h|a|t'], ['pin', '📌', 'p|i|n'], ['sit', '🪑', 's|i|t'],
      ['fan', '🪭', 'f|a|n'], ['hid', '🙈', 'h|i|d'],
    ],
    heartWords: ['has', 'to', 'was', 'his'],
    sentences: ['The pig is big.', 'Tim hid the hat.', 'A fish has a fin.', 'Dad can dig a pit.'],
    story: {
      title: 'The Big Pig',
      text: 'Tim has a big pig. The pig can dig a pit. The pig sat in the pit. Tim was mad!',
      question: 'What did the pig dig?',
      choices: ['A hat', 'A pit', 'A map'],
      answer: 1,
    },
  },
  {
    id: 3,
    title: 'Short O',
    icon: '🐶',
    focus: 'Short "o" plus b, l, r',
    sounds: [
      { g: 'o', key: 'octopus', emoji: '🐙' },
      { g: 'b', key: 'ball',    emoji: '⚽' },
      { g: 'l', key: 'lion',    emoji: '🦁' },
      { g: 'r', key: 'rabbit',  emoji: '🐰' },
    ],
    words: [
      ['dog', '🐶', 'd|o|g'], ['log', '🪵', 'l|o|g'], ['pot', '🍲', 'p|o|t'],
      ['mop', '🧹', 'm|o|p'], ['top', '🔝', 't|o|p'], ['rob', '🦹', 'r|o|b'],
      ['hot', '🔥', 'h|o|t'], ['bat', '🦇', 'b|a|t'],
    ],
    heartWords: ['you', 'said', 'what', 'of'],
    sentences: ['The dog is on a log.', 'Bob has a hot pot.', 'Rob got a mop.', 'The cat is not on top.'],
    story: {
      title: 'Bob and the Hot Pot',
      text: 'Bob has a dog. The dog sat on a log. Bob got a hot pot. The dog did not sit on the pot!',
      question: 'Where did the dog sit?',
      choices: ['On the pot', 'On a log', 'On a bed'],
      answer: 1,
    },
  },
  {
    id: 4,
    title: 'Short U & E',
    icon: '🐛',
    focus: 'Short "u" and short "e" plus j, w, k',
    sounds: [
      { g: 'u', key: 'umbrella', emoji: '☂️' },
      { g: 'e', key: 'egg',      emoji: '🥚' },
      { g: 'j', key: 'jam',      emoji: '🍓' },
      { g: 'w', key: 'web',      emoji: '🕸️' },
      { g: 'k', key: 'kite',     emoji: '🪁' },
    ],
    words: [
      ['bug', '🐛', 'b|u|g'], ['sun', '☀️', 's|u|n'], ['cup', '☕', 'c|u|p'],
      ['bed', '🛏️', 'b|e|d'], ['net', '🥅', 'n|e|t'], ['web', '🕸️', 'w|e|b'],
      ['jet', '✈️', 'j|e|t'], ['red', '🔴', 'r|e|d'],
    ],
    heartWords: ['are', 'they', 'do', 'he'],
    sentences: ['The bug is in the web.', 'Ted has a red cup.', 'The sun is hot.', 'Jen can get the net.'],
    story: {
      title: 'Ted and the Bug',
      text: 'Ted has a red net. A bug is on a web. Ted can get the bug in his net. The bug is his pet!',
      question: 'What color is the net?',
      choices: ['Red', 'Tan', 'Pink'],
      answer: 0,
    },
  },
  {
    id: 5,
    title: 'Digraphs',
    icon: '🐟',
    focus: 'Two letters, one sound: sh, ch, th, ck',
    sounds: [
      { g: 'sh', key: 'ship',  emoji: '🚢' },
      { g: 'ch', key: 'chick', emoji: '🐥' },
      { g: 'th', key: 'thumb', emoji: '👍' },
      { g: 'ck', key: 'duck',  emoji: '🦆' },
    ],
    words: [
      ['ship', '🚢', 'sh|i|p'], ['fish', '🐟', 'f|i|sh'], ['chin', '🧔', 'ch|i|n'],
      ['duck', '🦆', 'd|u|ck'], ['bath', '🛁', 'b|a|th'], ['shell', '🐚', 'sh|e|ll'],
      ['chick', '🐥', 'ch|i|ck'], ['sock', '🧦', 's|o|ck'],
    ],
    heartWords: ['there', 'where', 'come', 'went'],
    sentences: ['The duck is in the bath.', 'A fish is in the shell.', 'Chad has a red sock.', 'The ship is on the dock.'],
    story: {
      title: 'The Fish Shop',
      text: 'Chad and Beth went to a fish shop. Chad got a thin fish. Beth got a chip. Then they sat on the deck.',
      question: 'What did Beth get?',
      choices: ['A fish', 'A chip', 'A shell'],
      answer: 1,
    },
  },
  {
    id: 6,
    title: 'Blends',
    icon: '🐸',
    focus: 'Two consonants, two sounds: st, fl, tr, cr, fr, nd, mp',
    sounds: [
      { g: 'st', key: 'star',  emoji: '⭐' },
      { g: 'fl', key: 'flag',  emoji: '🚩' },
      { g: 'tr', key: 'tree',  emoji: '🌳' },
      { g: 'cr', key: 'crab',  emoji: '🦀' },
      { g: 'fr', key: 'frog',  emoji: '🐸' },
      { g: 'nd', key: 'hand',  emoji: '✋' },
      { g: 'mp', key: 'lamp',  emoji: '💡' },
    ],
    words: [
      ['frog', '🐸', 'f|r|o|g'], ['crab', '🦀', 'c|r|a|b'], ['flag', '🚩', 'f|l|a|g'],
      ['hand', '✋', 'h|a|n|d'], ['lamp', '💡', 'l|a|m|p'], ['drum', '🥁', 'd|r|u|m'],
      ['tent', '⛺', 't|e|n|t'], ['plant', '🪴', 'p|l|a|n|t'],
    ],
    heartWords: ['some', 'one', 'from', 'want'],
    sentences: ['The frog can jump.', 'The crab has a flag.', 'Stan sat in the tent.', 'Fran has a drum.'],
    story: {
      title: 'Frog on a Trip',
      text: 'A frog went on a trip. The frog had to jump from a plant to a log. The frog met a crab. The crab had a flag. The frog and the crab had a grand trip!',
      question: 'Who had a flag?',
      choices: ['The frog', 'The crab', 'The plant'],
      answer: 1,
    },
  },
  {
    id: 7,
    title: 'Magic E',
    icon: '🪁',
    focus: 'Silent "e" makes the vowel say its name: a_e, i_e, o_e, u_e',
    sounds: [
      { g: 'a_e', key: 'cake', emoji: '🎂' },
      { g: 'i_e', key: 'kite', emoji: '🪁' },
      { g: 'o_e', key: 'rose', emoji: '🌹' },
      { g: 'u_e', key: 'cube', emoji: '🧊' },
    ],
    words: [
      ['cake', '🎂', 'c|a_e|k'], ['kite', '🪁', 'k|i_e|t'], ['bike', '🚲', 'b|i_e|k'],
      ['rose', '🌹', 'r|o_e|s'], ['bone', '🦴', 'b|o_e|n'], ['cube', '🧊', 'c|u_e|b'],
      ['lake', '🏞️', 'l|a_e|k'], ['home', '🏠', 'h|o_e|m'],
    ],
    heartWords: ['water', 'would', 'could', 'were'],
    sentences: ['Mike has a kite.', 'Jane ate the cake.', 'The dog has a bone.', 'We rode bikes home.'],
    story: {
      title: 'Kite at the Lake',
      text: 'Jane and Mike rode bikes to the lake. Mike had a kite. The wind made the kite rise up, up, up! Jane ate cake on the dock. It was a fine time.',
      question: 'What did Mike have?',
      choices: ['A cake', 'A bike bell', 'A kite'],
      answer: 2,
    },
  },
  {
    id: 8,
    title: 'Vowel Teams',
    icon: '⛵',
    focus: 'Two vowels work together: ai, ay, ee, ea, oa',
    sounds: [
      { g: 'ai', key: 'rain',  emoji: '🌧️' },
      { g: 'ay', key: 'hay',   emoji: '🌾' },
      { g: 'ee', key: 'tree',  emoji: '🌳' },
      { g: 'ea', key: 'leaf',  emoji: '🍃' },
      { g: 'oa', key: 'boat',  emoji: '⛵' },
    ],
    words: [
      ['rain', '🌧️', 'r|ai|n'], ['tree', '🌳', 't|r|ee'], ['boat', '⛵', 'b|oa|t'],
      ['seal', '🦭', 's|ea|l'], ['goat', '🐐', 'g|oa|t'], ['bee', '🐝', 'b|ee'],
      ['snail', '🐌', 's|n|ai|l'], ['tray', '🍱', 't|r|ay'],
    ],
    heartWords: ['people', 'been', 'their', 'many'],
    sentences: ['The bee is in the tree.', 'A goat is on the boat.', 'The snail is in the rain.', 'We play at the beach.'],
    story: {
      title: 'A Day at the Beach',
      text: 'It was a hot day. Dee and Ray went to the beach. They played in the sea. Ray had a toy boat. A seal swam up to the boat! They had a great day.',
      question: 'What swam up to the boat?',
      choices: ['A goat', 'A seal', 'A bee'],
      answer: 1,
    },
  },
  {
    id: 9,
    title: 'Bossy R',
    icon: '🌟',
    focus: 'R changes the vowel: ar, or, er, ir, ur',
    sounds: [
      { g: 'ar', key: 'car',   emoji: '🚗' },
      { g: 'or', key: 'corn',  emoji: '🌽' },
      { g: 'er', key: 'fern',  emoji: '🌿' },
      { g: 'ir', key: 'bird',  emoji: '🐦' },
      { g: 'ur', key: 'turtle', emoji: '🐢' },
    ],
    words: [
      ['car', '🚗', 'c|ar'], ['star', '⭐', 's|t|ar'], ['corn', '🌽', 'c|or|n'],
      ['fork', '🍴', 'f|or|k'], ['bird', '🐦', 'b|ir|d'], ['shirt', '👕', 'sh|ir|t'],
      ['farm', '🚜', 'f|ar|m'], ['purse', '👛', 'p|ur|s'],
    ],
    heartWords: ['laugh', 'eye', 'busy', 'only'],
    sentences: ['The bird is on the barn.', 'Carl ate the corn.', 'The car is dark.', 'Her shirt has a star.'],
    story: {
      title: 'The Farm',
      text: 'Carl has a farm. On the farm there is a barn and lots of corn. A bird sat on the barn. A girl named Fern fed the hens. At dark, the stars came out.',
      question: 'What sat on the barn?',
      choices: ['A bird', 'A hen', 'A star'],
      answer: 0,
    },
  },
  {
    id: 10,
    title: 'Big Words',
    icon: '🌈',
    focus: 'Two-syllable and compound words — chunk it, then read it',
    sounds: [
      { g: 'sun·set',  key: 'sunset',  emoji: '🌅' },
      { g: 'rab·bit',  key: 'rabbit',  emoji: '🐇' },
      { g: 'cup·cake', key: 'cupcake', emoji: '🧁' },
      { g: 'rain·bow', key: 'rainbow', emoji: '🌈' },
    ],
    words: [
      ['sunset', '🌅', 'sun|set'], ['rabbit', '🐇', 'rab|bit'], ['cupcake', '🧁', 'cup|cake'],
      ['rainbow', '🌈', 'rain|bow'], ['basket', '🧺', 'bas|ket'], ['picnic', '🧺', 'pic|nic'],
      ['napkin', '🧻', 'nap|kin'], ['football', '🏈', 'foot|ball'],
    ],
    heartWords: ['because', 'friend', 'again', 'sister'],
    sentences: ['The rabbit ate a cupcake.', 'We had a picnic at sunset.', 'Kim got a basket.', 'Look at the rainbow!'],
    story: {
      title: 'The Picnic',
      text: 'Max and his sister had a picnic in the garden. They packed a basket with cupcakes and napkins. A rabbit hopped up to the blanket. After the picnic, they saw a rainbow at sunset.',
      question: 'What hopped up to the blanket?',
      choices: ['A rabbit', 'A frog', 'A bird'],
      answer: 0,
    },
  },
];

/* Short movement breaks — help kids with ADHD (and everyone!) reset focus */
const BRAIN_BREAKS = [
  { emoji: '🐸', text: 'Do 5 frog jumps!' },
  { emoji: '🐱', text: 'Stretch up tall like a cat, then touch your toes.' },
  { emoji: '🌬️', text: 'Smell the flower, blow out the candle. Breathe in… and out. 3 times.' },
  { emoji: '🐝', text: 'Buzz like a bee and flap your arms 10 times!' },
  { emoji: '🧘', text: 'Squeeze your hands into fists… now let go. Do it 5 times.' },
  { emoji: '🦩', text: 'Stand on one foot like a flamingo. Count to 10!' },
  { emoji: '🙆', text: 'Give yourself a big hug and say "I can do hard things!"' },
];

/* Encouragement that praises effort, not just correctness (growth mindset) */
const PRAISE = [
  'You worked hard on that!', 'Great focus!', 'You kept trying — that is how brains grow!',
  'Super reading!', 'Nice sounding out!', 'You are getting stronger every day!',
];
const GENTLE_RETRY = [
  'Almost! Let\'s try again together.', 'Good try! Listen and try once more.',
  'Mistakes help us learn. Try again!', 'Take a breath — you\'ve got this.',
];
