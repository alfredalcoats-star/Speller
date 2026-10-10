/* ===================================================================
   Story Library — built-in read-for-fun stories, one for each grade K–8.
   Questions use the shared comprehension format (comprehension.js):
     choice: { skill, text?, q, choices, answer, why, clue? }
     order:  { skill, q, items (in order), why }
   An inference question's `text` is the part of the story that holds
   the clue, so the detective check can highlight it.
   =================================================================== */

const LIBRARY_STORIES = [
  {
    id: 'lib-k', grade: 'K', genre: 'Funny', icon: '🐻', title: 'Bam Bakes a Cake',
    paragraphs: [
      'Bam is a big brown bear. Bam wants to bake a cake.',
      'He gets eggs. He gets milk. He mixes and mixes.',
      'Oh no! Flour is on his nose. Flour is on his feet.',
      'Bam\'s friends come in. They laugh and laugh. Then they all eat cake!',
    ],
    questions: [
      { skill: 'wh', q: 'What does Bam want to make?', choices: ['A cake', 'A hat', 'A boat'], answer: 0, why: '"Bam wants to bake a cake."' },
      { skill: 'infer', text: 'Oh no! Flour is on his nose. Flour is on his feet. Bam\'s friends come in. They laugh and laugh.', q: 'Why do Bam\'s friends laugh?', choices: ['Bam is covered in flour', 'Bam fell asleep', 'Bam sang a song'], answer: 0, why: 'Flour on his nose and feet would look funny!', clue: { choices: ['Flour is on his nose', 'Bam\'s friends come in', 'They laugh and laugh'], answer: 0 } },
      { skill: 'sequence', q: 'Put the story in order.', items: ['Bam gets eggs and milk.', 'Bam mixes and mixes.', 'They all eat cake.'], why: 'First Bam gets what he needs, then he mixes, and last they eat.' },
    ],
  },
  {
    id: 'lib-1', grade: '1', genre: 'Real life', icon: '🦷', title: 'Lulu\'s Wiggly Tooth',
    paragraphs: [
      'Lulu had a wiggly tooth. She wiggled it at breakfast. She wiggled it on the bus.',
      'At lunch, Lulu took a big bite of her sandwich. Crunch! Her tooth was gone!',
      'Lulu looked in her sandwich. There it was, tiny and white. She wrapped it in a napkin and kept it safe all day.',
      'That night, she put the tooth under her pillow. In the morning, Lulu ran to her room and lifted her pillow before she even brushed her hair. There was a shiny coin and a tiny note!',
    ],
    questions: [
      { skill: 'wh', q: 'Where did Lulu find her tooth?', choices: ['On the bus', 'In her sandwich', 'Under her bed'], answer: 1, why: '"Lulu looked in her sandwich. There it was."' },
      { skill: 'infer', text: 'In the morning, Lulu ran to her room and lifted her pillow before she even brushed her hair.', q: 'How does Lulu feel in the morning?', choices: ['Excited', 'Sleepy', 'Grumpy'], answer: 0, why: 'She runs to check her pillow before doing anything else. She can\'t wait!', clue: { choices: ['ran to her room and lifted her pillow', 'In the morning', 'brushed her hair'], answer: 0 } },
      { skill: 'sequence', q: 'Put what happened in order.', items: ['Lulu wiggled her tooth.', 'The tooth came out at lunch.', 'She put it under her pillow.', 'She found a coin and a note.'], why: 'The story goes from breakfast, to lunch, to night, to morning.' },
    ],
  },
  {
    id: 'lib-2', grade: '2', genre: 'Mystery', icon: '🐢', title: 'The Case of the Missing Turtle',
    paragraphs: [
      'On Monday morning, the class turtle, Shelly, was not in her tank. The lid was pushed to one side.',
      '"Shelly is gone!" cried Omar. Everyone looked under desks and behind the bookshelf. Ms. Reed even checked the coat closet.',
      'Then Priya noticed something on the floor. Small wet footprints led away from the tank, past the reading rug, all the way to the art corner.',
      'The class tiptoed over and peered into the art sink. There was Shelly, happily paddling in the water left from Friday\'s painting project.',
      'That afternoon, the class built Shelly a bigger tank with a tiny pool. They also added a heavier lid.',
    ],
    questions: [
      { skill: 'main', q: 'What is this story mostly about?', choices: ['A class finds their missing turtle', 'How to paint a picture', 'A trip to the zoo'], answer: 0, why: 'The whole story follows the search for Shelly.' },
      { skill: 'infer', text: 'Small wet footprints led away from the tank, past the reading rug, all the way to the art corner.', q: 'Why did the footprints lead to the art corner?', choices: ['Shelly walked there looking for water', 'Omar spilled his juice', 'Ms. Reed was painting'], answer: 0, why: 'Shelly ended up in the art sink water, so she must have followed her nose to the water.', clue: { choices: ['Small wet footprints', 'past the reading rug', 'away from the tank'], answer: 0 } },
      { skill: 'context', q: 'The class "peered into the art sink." What does "peered" mean?', choices: ['Looked closely', 'Jumped into', 'Shouted at'], answer: 0, why: 'They tiptoed over and looked carefully to see what was inside.' },
    ],
  },
  {
    id: 'lib-3', grade: '3', genre: 'Science', icon: '🤖', title: 'Grandpa\'s Garden Robot',
    paragraphs: [
      'Grandpa had hurt his knee, and the doctor said he couldn\'t kneel in the garden for six weeks. "My tomatoes will dry up," he sighed, looking out the kitchen window.',
      'Dev had an idea. He gathered an old remote-control car, a plastic bottle, some tubing, and a timer from the junk drawer. For three days he tinkered at the kitchen table.',
      'On the first test, the robot rolled down the row and sprayed water everywhere, including all over Grandpa\'s cat, Pepper. Pepper streaked across the yard and hid under the porch for an hour.',
      'Dev lowered the nozzle and slowed the wheels. On the second test, the water landed right at the roots of each plant.',
      'By August, Grandpa\'s tomatoes were the biggest on the block. At the county fair, they won a blue ribbon. Grandpa pinned the ribbon to the robot.',
    ],
    questions: [
      { skill: 'cause', q: 'Why did Dev build the robot?', choices: ['Grandpa hurt his knee and could not care for the garden', 'Dev wanted to scare the cat', 'The fair asked for robots', 'The hose was broken'], answer: 0, why: 'Grandpa couldn\'t kneel in the garden, so Dev built a robot to help.' },
      { skill: 'infer', text: 'Pepper streaked across the yard and hid under the porch for an hour.', q: 'How did Pepper feel about getting sprayed?', choices: ['Upset and scared', 'Happy and playful', 'Sleepy', 'Hungry'], answer: 0, why: 'Racing away and hiding for an hour shows Pepper did not like it.', clue: { choices: ['hid under the porch for an hour', 'across the yard', 'Pepper'], answer: 0 } },
      { skill: 'sequence', q: 'Put the events in order.', items: ['Grandpa hurt his knee.', 'Dev built the robot.', 'The robot sprayed the cat.', 'The tomatoes won a ribbon.'], why: 'The problem comes first, then the invention, the test, and the happy ending.' },
      { skill: 'context', q: 'Dev "tinkered" at the kitchen table. What does "tinkered" mean?', choices: ['Tried to fix or build something by trying different things', 'Slept', 'Ate a snack', 'Cleaned up'], answer: 0, why: 'He spent three days putting parts together and adjusting them.' },
    ],
  },
  {
    id: 'lib-4', grade: '4', genre: 'Real life', icon: '🥟', title: 'Rain at the Night Market',
    paragraphs: [
      'Every Friday, Mei helped her grandmother sell dumplings at the night market. Mei folded the dumplings; Nai Nai steamed them in tall bamboo baskets that puffed clouds into the cool evening air.',
      'This Friday, the sky was the color of a bruise. "Rain is coming," Nai Nai said, glancing up, but she kept folding.',
      'Just after sunset, the storm hit. Shoppers scattered, and the other sellers rushed to pack up. A family with two small children ducked under Nai Nai\'s big blue awning, shivering.',
      'Without a word, Nai Nai handed each of them a paper boat of hot dumplings. "No charge," she said. More people crowded under the awning, and soon it was the warmest, loudest place in the market.',
      'When the rain stopped, the baskets were empty. Mei counted the money box and frowned. "We gave away half our dumplings." Nai Nai just smiled. "And next Friday," she said, "we will have twice as many customers."',
    ],
    questions: [
      { skill: 'wh', q: 'What does Mei do to help at the stall?', choices: ['She folds the dumplings', 'She steams the baskets', 'She counts customers', 'She paints signs'], answer: 0, why: '"Mei folded the dumplings; Nai Nai steamed them."' },
      { skill: 'infer', text: '"We gave away half our dumplings." Nai Nai just smiled. "And next Friday," she said, "we will have twice as many customers."', q: 'Why is Nai Nai not worried about giving away dumplings?', choices: ['She believes her kindness will bring people back', 'She has extra money hidden', 'She plans to stop selling', 'She didn\'t notice'], answer: 0, why: 'She expects the people she helped to return as loyal customers.', clue: { choices: ['we will have twice as many customers', 'Nai Nai just smiled', 'next Friday'], answer: 0 } },
      { skill: 'context', q: 'The sky was "the color of a bruise." What does this tell you about the sky?', choices: ['It was dark purple and gray, like a storm', 'It was bright blue', 'It was full of stars', 'It was pink and sunny'], answer: 0, why: 'Bruises are dark purple and gray, like heavy storm clouds.' },
      { skill: 'main', q: 'What is a theme (lesson) of the story?', choices: ['Kindness can pay off in the long run', 'Never sell food outside', 'Storms are dangerous', 'Money is all that matters'], answer: 0, why: 'Nai Nai\'s generosity turns a bad night into the warmest place in the market.' },
    ],
  },
  {
    id: 'lib-5', grade: '5', genre: 'Adventure', icon: '🌲', title: 'Fog on Eagle Ridge',
    paragraphs: [
      'Andre and his cousin Talia were halfway up Eagle Ridge when the fog rolled in. Within minutes, the trail ahead disappeared into a gray wall. Even the tall pines looked like ghosts.',
      '"Which way did we come from?" Talia asked. Andre turned in a slow circle. Every direction looked the same. He felt disoriented, as if the mountain had spun around while he blinked.',
      'Then he remembered what the ranger had taught them that morning: STOP. Stop, Think, Observe, Plan. They sat on a rock, drank some water, and took slow breaths.',
      'Observing carefully, Talia noticed orange paint marks on a few tree trunks. Andre heard the faint rush of the stream they had crossed earlier. "The trail follows the stream down," he said.',
      'Moving from one orange mark to the next and keeping the sound of water on their left, they inched down the mountain. An hour later, they stepped out of the fog into the parking lot, where the ranger was just lacing up her boots to come find them.',
    ],
    questions: [
      { skill: 'context', q: 'Andre felt "disoriented." What does that mean?', choices: ['Confused about where he was', 'Very hungry', 'Proud of himself', 'Ready to sleep'], answer: 0, why: 'Every direction looked the same, and he felt like the mountain had spun around.' },
      { skill: 'cause', q: 'What helped Andre and Talia find their way down?', choices: ['Orange trail marks and the sound of the stream', 'A phone map', 'A helicopter', 'Shouting for help'], answer: 0, why: 'They followed the paint marks and kept the stream on their left.' },
      { skill: 'infer', text: 'An hour later, they stepped out of the fog into the parking lot, where the ranger was just lacing up her boots to come find them.', q: 'What can you infer about the ranger?', choices: ['She was worried and about to search for them', 'She was going home for the day', 'She didn\'t know they were hiking', 'She was angry at the fog'], answer: 0, why: 'Lacing up her boots "to come find them" shows she was getting ready to search.', clue: { choices: ['lacing up her boots to come find them', 'stepped out of the fog', 'An hour later'], answer: 0 } },
      { skill: 'sequence', q: 'Put the steps of STOP in order.', items: ['Stop', 'Think', 'Observe', 'Plan'], why: 'The ranger\'s rule spells STOP: Stop, Think, Observe, Plan.' },
    ],
  },
  {
    id: 'lib-6', grade: '6', genre: 'Real life', icon: '🎤', title: 'Rebuttal',
    paragraphs: [
      'Sam had joined the debate team because his older sister said it would "fix his shyness." So far, it had only given him stomachaches. For six weeks he had done research, written notecards, and carefully avoided speaking.',
      'Then, at the regional tournament, their rebuttal speaker came down with the flu. Coach Alvarez looked down the row of chairs and stopped at Sam. "You know this topic better than anyone," she said. "You\'re up."',
      'Sam\'s mouth went dry. When he reached the podium, the room seemed to tilt. He opened his mouth and nothing came out. Someone in the audience coughed. His face burned.',
      'Then he looked down at his notecards, the ones he had rewritten four times. The first line said, in his own neat handwriting: "Their plan sounds good, but it costs more than it saves." He read it out loud. Then the next card. Then the next. Somewhere around the third card, he stopped reading and started talking.',
      'The team lost the round by a single point. On the bus home, Sam\'s sister texted: "Heard you spoke!!" Sam looked out the window at the passing lights and typed back one word: "Yeah."',
    ],
    questions: [
      { skill: 'cause', q: 'Why does Sam have to give the rebuttal?', choices: ['The usual speaker is sick with the flu', 'He volunteered', 'His sister asked the coach', 'He won a coin toss'], answer: 0, why: 'The rebuttal speaker came down with the flu, so the coach chose Sam.' },
      { skill: 'infer', text: 'Somewhere around the third card, he stopped reading and started talking.', q: 'What does this sentence suggest about Sam?', choices: ['He was gaining confidence', 'He lost his notecards', 'He forgot the topic', 'He was about to give up'], answer: 0, why: 'Moving from reading to talking naturally shows he relaxed and grew more confident.', clue: { choices: ['stopped reading and started talking', 'Somewhere around', 'the third card'], answer: 0 } },
      { skill: 'main', q: 'Which statement BEST expresses a theme of the story?', choices: ['Preparation can help you face your fears', 'Winning is the only goal', 'Shy people should avoid debate', 'Coaches should not pick students'], answer: 0, why: 'Sam\'s carefully rewritten notecards carry him through his fear, even though the team loses.' },
      { skill: 'infer', text: 'Sam looked out the window at the passing lights and typed back one word: "Yeah."', q: 'How does Sam MOST LIKELY feel at the end?', choices: ['Quietly proud', 'Furious', 'Bored', 'Embarrassed and upset'], answer: 0, why: 'His calm, simple reply after a big moment suggests quiet pride rather than disappointment about the loss.', clue: { choices: ['typed back one word: "Yeah."', 'passing lights', 'looked out the window'], answer: 0 } },
    ],
  },
  {
    id: 'lib-7', grade: '7', genre: 'Adventure', icon: '📻', title: 'Channel 16',
    paragraphs: [
      'Jonah had built his first radio receiver from a kit when he was ten. By thirteen, he could recognize the crackle of a cargo ship\'s radio from a hundred miles away. Most nights he just listened: weather reports, fishermen joking, the steady beep of navigation beacons.',
      'On a windy Tuesday in October, a voice broke through on Channel 16, the emergency channel. It was faint and kept cutting out. "...Sea Lark... taking on water... two aboard... near Gull Point..."',
      'Jonah\'s hands went cold. He waited, but no one answered the call. The Coast Guard station was on the far side of the bay, and the hills, he knew, sometimes blocked weak signals.',
      'He grabbed a notebook and wrote down every word, the time, and the exact frequency. Then he called the Coast Guard on his mother\'s phone, reading his notes in a voice that shook only a little.',
      'Two hours later, a helicopter lifted two soaked but healthy sailors off the rocks near Gull Point. The next week, a letter arrived from the Coast Guard thanking Jonah for his "clear and accurate report." His mother framed it. Jonah tucked the notebook back on the shelf next to his radio, where it belonged.',
    ],
    questions: [
      { skill: 'wh', q: 'What is Channel 16 used for?', choices: ['Emergency calls', 'Weather music', 'Fishing contests', 'Cargo schedules'], answer: 0, why: 'The story calls it "the emergency channel."' },
      { skill: 'infer', text: 'He waited, but no one answered the call. The Coast Guard station was on the far side of the bay, and the hills, he knew, sometimes blocked weak signals.', q: 'Why does Jonah decide to call the Coast Guard himself?', choices: ['He suspects the Coast Guard didn\'t hear the weak signal', 'He wants to be on the news', 'His mother tells him to', 'The sailors call him directly'], answer: 0, why: 'No one answered, and he knows hills can block weak signals, so the Coast Guard may not have heard.', clue: { choices: ['the hills, he knew, sometimes blocked weak signals', 'on the far side of the bay', 'He waited'], answer: 0 } },
      { skill: 'cause', q: 'What made Jonah\'s report so helpful?', choices: ['He wrote down every word, the time, and the frequency', 'He shouted loudly', 'He drove to Gull Point', 'He had a helicopter'], answer: 0, why: 'His careful notes let the Coast Guard act on "a clear and accurate report."' },
      { skill: 'main', q: 'What is the best summary of the story?', choices: ['A teen radio hobbyist hears a weak distress call and helps rescue two sailors', 'A boy builds a radio from a kit', 'Sailors go fishing near Gull Point', 'A family frames a letter'], answer: 0, why: 'This covers the beginning, middle and end of the story.' },
    ],
  },
  {
    id: 'lib-8', grade: '8', genre: 'Real life', icon: '🖨️', title: 'The Last Letterpress',
    paragraphs: [
      'Ana had expected her summer at Aunt Lucía\'s print shop to involve computers. Instead, the shop was a cave of iron machines and wooden drawers, each one holding thousands of tiny metal letters, sorted by size and style.',
      '"You set every word by hand," Aunt Lucía explained, placing letters backward and upside down into a small metal tray. Ana tried it. One line of a birthday card took her forty minutes, and when she printed it, the word "Birthday" came out "Brithday."',
      'For the first two weeks, Ana counted the days until she could go home. Then the community center called. The town\'s only grocery store was closing, and neighbors were organizing a market in the park. They needed posters by Saturday, and they had no money for a print shop.',
      'Aunt Lucía looked at Ana. Ana looked at the drawers of type. They worked late every night that week, inking, pressing, and hanging posters on a line to dry like laundry. By Friday, Ana could set a line in four minutes, and she checked each one twice.',
      'On Saturday, the park was full. Ana walked past a light post and saw one of her posters, the ink slightly uneven, the letters pressed deep into the thick paper. A woman stopped, ran her fingers over the words, and smiled. Ana understood, suddenly, why her aunt had never switched to computers.',
    ],
    questions: [
      { skill: 'context', q: 'The shop was "a cave of iron machines and wooden drawers." What does this description suggest?', choices: ['The shop felt dark, crowded and old-fashioned', 'The shop was underground', 'The shop was empty', 'The shop sold caves'], answer: 0, why: 'Comparing it to a cave suggests a dim space packed with heavy, old equipment.' },
      { skill: 'sequence', q: 'Put the events in order.', items: ['Ana misprints "Birthday."', 'The community center asks for posters.', 'Ana and her aunt work late all week.', 'Ana sees a woman touch a poster.'], why: 'The story moves from Ana\'s struggle, to the request, to the work, to the result.' },
      { skill: 'infer', text: 'A woman stopped, ran her fingers over the words, and smiled. Ana understood, suddenly, why her aunt had never switched to computers.', q: 'What does Ana realize at the end?', choices: ['Handmade printing has a personal quality people can feel', 'Computers are broken', 'She wants to sell the shop', 'Posters are a waste of time'], answer: 0, why: 'The woman touching the deep-pressed letters shows that the craft connects with people in a way a screen can\'t.', clue: { choices: ['ran her fingers over the words, and smiled', 'A woman stopped', 'switched to computers'], answer: 0 } },
      { skill: 'infer', text: 'By Friday, Ana could set a line in four minutes, and she checked each one twice.', q: 'What does this detail show about how Ana has changed?', choices: ['She has become skilled and careful because the work matters to her', 'She is in a hurry to go home', 'She no longer cares about mistakes', 'She has started using a computer'], answer: 0, why: 'She went from forty minutes and a misspelling to four minutes and double-checking.', clue: { choices: ['she checked each one twice', 'By Friday', 'set a line'], answer: 0 } },
    ],
  },
];

/* Kinds of stories the "Write me a new story" button can make */
const STORY_GENRES = [
  { id: 'Adventure', icon: '🧭' }, { id: 'Animals', icon: '🐾' }, { id: 'Mystery', icon: '🔍' },
  { id: 'Funny', icon: '😂' }, { id: 'Friendship', icon: '🤝' }, { id: 'Science', icon: '🔬' },
  { id: 'Sports', icon: '⚽' }, { id: 'Fantasy', icon: '🐉' }, { id: 'History', icon: '🏛️' },
  { id: 'Nonfiction', icon: '🌍' },
];
