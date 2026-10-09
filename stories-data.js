/* ===================================================================
   Story Check — passage bank
   Original passages for grades K–8, one literary and one informational
   per grade, with questions in the formats used by through-year
   reading check-ups such as DRC BEACON:

     mc       selected response (1 point)
     ebsr     two-part evidence-based selected response, Part A + Part B (2 points)
     multi    multi-select, "choose TWO" (2 points)
     hottext  click the sentence in the passage (1 point)
     order    put events or steps in order (1 point)
     short    short typed answer, auto-scored (1 point)

   Passages are stored as paragraphs of sentences so "click the sentence"
   questions can point at exact sentences: hottext answers are [paragraph, sentence].
   Skill areas follow the usual reading report categories:
     key    Key Ideas & Details
     craft  Craft & Structure
     integ  Integration of Knowledge & Ideas
     vocab  Vocabulary
   =================================================================== */

const SKILLS = {
  key:   { name: 'Key Ideas & Details',             tip: 'Ask "Who? What? Where? Why?" after each page, and have your child point to the words that prove the answer.' },
  craft: { name: 'Craft & Structure',               tip: 'Talk about why the author made choices: Why this title? Why tell it this way? How does this part fit the whole?' },
  integ: { name: 'Integration of Knowledge & Ideas', tip: 'Connect ideas: compare two parts of a text, use pictures or headings, and talk about the big message or main point.' },
  vocab: { name: 'Vocabulary',                      tip: 'When you meet a new word, look for clue words nearby, guess the meaning together, then check it.' },
};

const STORY_GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
const STORY_GRADE_LABEL = g => g === 'K' ? 'Kindergarten' : `Grade ${g}`;

const PASSAGES = [
  /* ============================ KINDERGARTEN ============================ */
  {
    id: 'k-lit', grade: 'K', genre: 'Story', title: 'Pip and the Red Hat', icon: '🐷',
    paragraphs: [
      ['Pip is a little pig.', 'Pip sees a red hat on the grass.'],
      ['"Is this hat for me?" asks Pip.', 'Pip puts on the hat.', 'It is too big!', 'The hat falls over his eyes.'],
      ['Then Pip sees Duck.', 'Duck looks sad.', '"I lost my red hat," says Duck.'],
      ['Pip gives the hat to Duck.', 'Duck smiles.', '"Thank you, Pip!"'],
    ],
    questions: [
      { type: 'mc', skill: 'key', prompt: 'Who is Pip?', choices: ['A duck', 'A pig', 'A cat'], answer: 1,
        explain: 'The first sentence says, "Pip is a little pig."' },
      { type: 'order', skill: 'key', prompt: 'Put what happens in order. Tap them: first, next, last.',
        items: ['Pip sees a red hat.', 'Pip puts on the hat.', 'Pip gives the hat to Duck.'],
        explain: 'Pip finds the hat, tries it on, and then gives it to Duck.' },
      { type: 'hottext', skill: 'key', prompt: 'Click the sentence in the story that tells why Duck is sad.', answer: [2, 2],
        explain: 'Duck says, "I lost my red hat." That is why Duck is sad.' },
      { type: 'mc', skill: 'integ', prompt: 'What does Pip do that is kind?', choices: ['Pip keeps the hat.', 'Pip gives the hat back to Duck.', 'Pip hides the hat.'], answer: 1,
        explain: 'Pip gives the hat to Duck, its owner. That is kind.' },
    ],
  },
  {
    id: 'k-info', grade: 'K', genre: 'Informational', title: 'Busy Bees', icon: '🐝',
    paragraphs: [
      ['Bees are small insects.', 'Bees have six legs.', 'Bees have wings, too.'],
      ['Bees fly from flower to flower.', 'They drink nectar.', 'Nectar is a sweet juice inside flowers.'],
      ['Bees make honey from nectar.', 'Bees live together in a hive.', 'A hive can have many, many bees!'],
    ],
    questions: [
      { type: 'mc', skill: 'key', prompt: 'How many legs does a bee have?', choices: ['Four', 'Six', 'Eight'], answer: 1,
        explain: 'The text says, "Bees have six legs."' },
      { type: 'hottext', skill: 'vocab', prompt: 'Click the sentence that tells what nectar is.', answer: [1, 2],
        explain: '"Nectar is a sweet juice inside flowers."' },
      { type: 'short', skill: 'key', prompt: 'Bees make ______ from nectar. Type the missing word.', accept: ['honey'],
        explain: 'Bees make honey from nectar.' },
      { type: 'mc', skill: 'key', prompt: 'Where do bees live?', choices: ['In a nest', 'In a hive', 'In a pond'], answer: 1,
        explain: '"Bees live together in a hive."' },
    ],
  },

  /* ============================== GRADE 1 =============================== */
  {
    id: '1-lit', grade: '1', genre: 'Story', title: 'The Kite in the Tree', icon: '🪁',
    paragraphs: [
      ['Maya and Grandpa went to the park with a green kite.', 'The wind was strong.', 'The kite went up, up, up!'],
      ['Then the string snapped.', 'The kite flew away and got stuck in a tall tree.', 'Maya\'s eyes filled with tears.'],
      ['"Don\'t worry," said Grandpa.', '"Let\'s ask for help."', 'Their neighbor Sam came with a long ladder.', 'He climbed up and got the kite down.'],
      ['Maya gave Sam a big hug.', 'Then all three of them shared a cold glass of lemonade.'],
    ],
    questions: [
      { type: 'mc', skill: 'key', prompt: 'What is the problem in the story?', choices: ['Maya loses her lemonade.', 'The kite gets stuck in a tree.', 'Grandpa gets lost at the park.', 'Sam breaks his ladder.'], answer: 1,
        explain: 'The string snaps and the kite gets stuck in a tall tree.' },
      { type: 'order', skill: 'key', prompt: 'Put the events in order.',
        items: ['The kite flies up high.', 'The string snaps.', 'Sam brings a ladder.', 'They share lemonade.'],
        explain: 'The kite flies, the string snaps, Sam helps, and then they share lemonade.' },
      { type: 'ebsr', skill: 'key',
        partA: { prompt: 'Part A: How does Maya feel when the kite gets stuck?', choices: ['Happy', 'Sad', 'Sleepy', 'Angry'], answer: 1 },
        partB: { prompt: 'Part B: Which sentence from the story helps you know the answer to Part A?',
          choices: ['The wind was strong.', 'Maya\'s eyes filled with tears.', 'He climbed up and got the kite down.', 'Maya gave Sam a big hug.'], answer: 1 },
        explain: 'Eyes filling with tears shows that Maya is sad.' },
      { type: 'short', skill: 'vocab', prompt: 'Sam uses something long to climb up the tree. What is it? Type the word.', accept: ['ladder', 'a ladder'],
        explain: 'Sam came with a long ladder.' },
    ],
  },
  {
    id: '1-info', grade: '1', genre: 'Informational', title: 'From Egg to Frog', icon: '🐸',
    paragraphs: [
      ['A frog starts life as a tiny egg in the water.', 'Frog eggs float together in a jelly clump.'],
      ['A tadpole hatches out of the egg.', 'A tadpole has a long tail for swimming.', 'It breathes with gills, like a fish.'],
      ['Soon, the tadpole grows back legs.', 'Then it grows front legs.', 'Its tail gets shorter and shorter.'],
      ['At last, it is a frog!', 'A frog can hop on land and swim in water.'],
    ],
    questions: [
      { type: 'order', skill: 'key', prompt: 'Put the steps of a frog\'s life in order.',
        items: ['Egg', 'Tadpole', 'Tadpole with legs', 'Frog'],
        explain: 'A frog grows from an egg, to a tadpole, to a tadpole with legs, to a frog.' },
      { type: 'multi', skill: 'key', prompt: 'Choose TWO things a tadpole has.', choices: ['A long tail', 'Feathers', 'Gills', 'Fur'], answers: [0, 2],
        explain: 'A tadpole has a long tail for swimming and breathes with gills.' },
      { type: 'hottext', skill: 'key', prompt: 'Click the sentence that tells what happens to the tadpole\'s tail.', answer: [2, 2],
        explain: '"Its tail gets shorter and shorter."' },
      { type: 'mc', skill: 'craft', prompt: 'What is this text MOSTLY about?', choices: ['How a frog grows', 'What frogs eat', 'Where fish live', 'How to catch a frog'], answer: 0,
        explain: 'Each part tells one step in how a frog grows.' },
    ],
  },

  /* ============================== GRADE 2 =============================== */
  {
    id: '2-lit', grade: '2', genre: 'Story', title: 'Rosa\'s Rain Barrel', icon: '🌧️',
    paragraphs: [
      ['Mr. Lee\'s class planted a garden behind the school.', 'They grew beans, tomatoes, and tall sunflowers.'],
      ['But there was a problem.', 'The hose could not reach the garden.', 'Every day, the class had to carry heavy buckets of water across the field.', 'By Friday, everyone\'s arms were sore.'],
      ['Rosa looked at the rain dripping off the school roof.', '"What if we catch the rain?" she asked.', '"We could put a barrel under the drainpipe."'],
      ['The class voted, and everyone raised a hand.', 'Mr. Lee helped them set up a big blue barrel.', 'After the next storm, the barrel was full.', 'Now the garden gets water, and no one has to carry buckets.'],
    ],
    questions: [
      { type: 'mc', skill: 'key', prompt: 'What problem does the class have?', choices: ['The garden has no seeds.', 'The hose cannot reach the garden.', 'Mr. Lee does not like the garden.', 'It never rains at school.'], answer: 1,
        explain: 'The text says, "The hose could not reach the garden."' },
      { type: 'ebsr', skill: 'integ',
        partA: { prompt: 'Part A: Which word BEST describes Rosa?', choices: ['Lazy', 'Clever', 'Scared', 'Bossy'], answer: 1 },
        partB: { prompt: 'Part B: Which sentence BEST supports the answer to Part A?',
          choices: ['They grew beans, tomatoes, and tall sunflowers.', 'By Friday, everyone\'s arms were sore.', '"What if we catch the rain?" she asked.', 'After the next storm, the barrel was full.'], answer: 2 },
        explain: 'Rosa thinks of a smart new way to water the garden, so she is clever.' },
      { type: 'hottext', skill: 'key', prompt: 'Click the sentence that shows Rosa\'s idea worked.', answer: [3, 2],
        explain: '"After the next storm, the barrel was full." The plan worked.' },
      { type: 'mc', skill: 'vocab', prompt: 'In paragraph 2, the word "sore" means —', choices: ['strong', 'hurting', 'wet', 'happy'], answer: 1,
        explain: 'Carrying heavy buckets all week made their arms hurt.' },
      { type: 'multi', skill: 'integ', prompt: 'Choose TWO lessons from this story.', choices: ['Good ideas can solve problems.', 'Gardens are boring.', 'Working together helps.', 'Never ask questions.'], answers: [0, 2],
        explain: 'Rosa\'s idea solved the problem, and the class worked together to build it.' },
    ],
  },
  {
    id: '2-info', grade: '2', genre: 'Informational', title: 'Why Leaves Change Color', icon: '🍂',
    paragraphs: [
      ['In spring and summer, most leaves are green.', 'They are green because of something inside them called chlorophyll.', 'Chlorophyll helps leaves use sunlight to make food for the tree.'],
      ['In fall, the days get shorter.', 'There is less sunlight, so the tree stops making chlorophyll.', 'As the green fades, other colors that were hiding begin to show.', 'That is why we see yellow and orange.'],
      ['Some leaves turn bright red.', 'The red color comes from sugar trapped in the leaves on sunny fall days.'],
      ['Soon, the leaves fall to the ground.', 'The tree rests all winter.', 'In spring, new green leaves grow again.'],
    ],
    questions: [
      { type: 'mc', skill: 'vocab', prompt: 'What is chlorophyll?', choices: ['A kind of bug', 'Something in leaves that makes them green', 'A type of tree', 'A fall holiday'], answer: 1,
        explain: 'Leaves "are green because of something inside them called chlorophyll."' },
      { type: 'ebsr', skill: 'key',
        partA: { prompt: 'Part A: Why do leaves change color in the fall?', choices: ['People paint them.', 'There is less sunlight, so the green fades.', 'It rains more in fall.', 'Animals eat the green parts.'], answer: 1 },
        partB: { prompt: 'Part B: Which sentence supports the answer to Part A?',
          choices: ['In spring and summer, most leaves are green.', 'There is less sunlight, so the tree stops making chlorophyll.', 'The tree rests all winter.', 'In spring, new green leaves grow again.'], answer: 1 },
        explain: 'Less sunlight means the tree stops making chlorophyll, so the green fades.' },
      { type: 'hottext', skill: 'key', prompt: 'Click the sentence that tells where red leaves get their color.', answer: [2, 1],
        explain: '"The red color comes from sugar trapped in the leaves on sunny fall days."' },
      { type: 'order', skill: 'craft', prompt: 'Put what happens to a leaf in order.',
        items: ['The leaf is green in summer.', 'The green fades in fall.', 'The leaf falls to the ground.', 'New leaves grow in spring.'],
        explain: 'The text follows the seasons: summer, fall, winter, spring.' },
      { type: 'short', skill: 'key', prompt: 'What does the tree do all winter? Type one word.', accept: ['rest', 'rests', 'sleep', 'sleeps'],
        explain: '"The tree rests all winter."' },
    ],
  },

  /* ============================== GRADE 3 =============================== */
  {
    id: '3-lit', grade: '3', genre: 'Story', title: 'The Night the Lights Went Out', icon: '🔦',
    paragraphs: [
      ['Thunder boomed, and the whole house went dark.', 'Leo grabbed his sister\'s arm.', '"I can\'t see anything!" he whispered.'],
      ['Mom found a flashlight in the kitchen drawer.', 'Dad lit two candles and set them on the table.', '"No TV, no tablets," Dad said with a grin.', '"I guess we\'ll have to make our own fun."'],
      ['At first, Leo grumbled.', 'But then Mom started telling a story about the time she got lost at the county fair.', 'Dad made funny shadow animals on the wall with his hands.', 'Soon Leo was laughing so hard his stomach hurt.'],
      ['Later, the storm passed.', 'Leo looked out the window and gasped.', 'Without the streetlights, the sky was full of more stars than he had ever seen.', '"Can the power go out again tomorrow?" he asked.'],
    ],
    questions: [
      { type: 'mc', skill: 'key', prompt: 'What causes the lights to go out?', choices: ['Leo turns them off.', 'A storm knocks out the power.', 'Dad forgets to pay the bill.', 'The flashlight breaks.'], answer: 1,
        explain: 'Thunder booms, and the house goes dark during the storm.' },
      { type: 'ebsr', skill: 'integ',
        partA: { prompt: 'Part A: How does Leo\'s feeling about the power outage change?', choices: ['From excited to bored', 'From scared and grumpy to happy', 'From happy to angry', 'From sleepy to scared'], answer: 1 },
        partB: { prompt: 'Part B: Which sentence BEST shows how Leo feels by the end of the story?',
          choices: ['Thunder boomed, and the whole house went dark.', 'Mom found a flashlight in the kitchen drawer.', '"Can the power go out again tomorrow?" he asked.', 'Later, the storm passed.'], answer: 2 },
        explain: 'Leo starts out scared and grumbling, but by the end he wants the power to go out again.' },
      { type: 'vocab-mc', skill: 'vocab', prompt: 'In paragraph 3, the word "grumbled" means —', choices: ['laughed loudly', 'complained in a low voice', 'fell asleep', 'ran away'], answer: 1,
        explain: '"At first" Leo is unhappy, so he complains. Then he starts laughing.' },
      { type: 'hottext', skill: 'key', prompt: 'Click the sentence that explains why Leo can see so many stars.', answer: [3, 2],
        explain: '"Without the streetlights, the sky was full of more stars..." The dark made the stars easier to see.' },
      { type: 'multi', skill: 'integ', prompt: 'Choose TWO ways the family has fun without electricity.', choices: ['Telling stories', 'Watching TV', 'Making shadow animals', 'Playing video games'], answers: [0, 2],
        explain: 'Mom tells a story and Dad makes shadow animals.' },
    ],
  },
  {
    id: '3-info', grade: '3', genre: 'Informational', title: 'Sea Otters: Guardians of the Kelp Forest', icon: '🦦',
    paragraphs: [
      ['Off the coast of California, giant seaweed called kelp grows in tall underwater forests.', 'These kelp forests are home to fish, crabs, and many other sea animals.'],
      ['Sea urchins are spiny animals that eat kelp.', 'If there are too many urchins, they can chew through a whole kelp forest and leave the sea floor bare.'],
      ['That is where sea otters come in.', 'Sea otters love to eat sea urchins.', 'By eating urchins, otters keep the kelp forest healthy.', 'Scientists call otters a "keystone species" because so many other living things depend on them.'],
      ['Sea otters are also clever.', 'An otter will float on its back, place a rock on its belly, and smash a shell against the rock to crack it open.', 'Sea otters are one of the few animals that use tools.'],
    ],
    questions: [
      { type: 'mc', skill: 'integ', prompt: 'What is the MAIN idea of this passage?', choices: ['Sea urchins are spiny.', 'Sea otters help keep kelp forests healthy.', 'Kelp is a kind of seaweed.', 'California has a long coast.'], answer: 1,
        explain: 'Most of the passage explains how otters protect kelp forests by eating urchins.' },
      { type: 'ebsr', skill: 'key',
        partA: { prompt: 'Part A: What would MOST LIKELY happen if there were no sea otters?', choices: ['There would be more kelp.', 'Urchins could eat the kelp forest.', 'Fish would grow larger.', 'The water would get warmer.'], answer: 1 },
        partB: { prompt: 'Part B: Which sentence supports the answer to Part A?',
          choices: ['These kelp forests are home to fish, crabs, and many other sea animals.', 'If there are too many urchins, they can chew through a whole kelp forest and leave the sea floor bare.', 'Sea otters are also clever.', 'Sea otters are one of the few animals that use tools.'], answer: 1 },
        explain: 'Without otters, urchins would multiply and chew through the kelp.' },
      { type: 'hottext', skill: 'key', prompt: 'Click the sentence that shows how a sea otter uses a tool.', answer: [3, 1],
        explain: 'The otter uses a rock as a tool to crack open shells.' },
      { type: 'mc', skill: 'vocab', prompt: 'Why do scientists call the sea otter a "keystone species"?', choices: ['It lives near stones.', 'Many other living things depend on it.', 'It is the biggest animal in the sea.', 'It can open locks.'], answer: 1,
        explain: 'The passage says so many other living things depend on them.' },
      { type: 'mc', skill: 'craft', prompt: 'Why does the author include paragraph 2?', choices: ['To explain the problem that otters help solve', 'To describe what otters look like', 'To tell where California is', 'To show that urchins are cute'], answer: 0,
        explain: 'Paragraph 2 explains the urchin problem, which sets up how otters help in paragraph 3.' },
    ],
  },

  /* ============================== GRADE 4 =============================== */
  {
    id: '4-lit', grade: '4', genre: 'Story', title: 'Second Chair', icon: '🎻',
    paragraphs: [
      ['Lena had practiced the violin piece every night for a month.', 'The audition for first chair in the school orchestra was on Thursday, and she wanted that seat more than anything.'],
      ['When her name was called, Lena\'s hands felt like ice.', 'She lifted her bow, and the first notes came out shaky and thin.', 'In the middle of the piece, she skipped a whole line.', 'Her face burned as she finished.'],
      ['The next morning, the list was posted.', 'Lena was second chair.', 'Her friend Maddie, who had played smoothly, was first.', 'Lena wanted to crumple the list and hide.'],
      ['Instead, she found Maddie and said, "Congratulations. You earned it."', 'Maddie smiled.', '"Want to practice together after school? You can help me with the fast part."', 'Lena realized that sitting second chair beside a friend might not be so bad after all.'],
    ],
    questions: [
      { type: 'mc', skill: 'key', prompt: 'Why does Lena\'s audition go poorly?', choices: ['She did not practice.', 'She is nervous and makes mistakes.', 'Her violin breaks.', 'Maddie distracts her.'], answer: 1,
        explain: 'Her hands feel "like ice," her notes are shaky, and she skips a line.' },
      { type: 'vocab-mc', skill: 'vocab', prompt: 'In paragraph 2, what does "Her face burned" suggest?', choices: ['She had a sunburn.', 'She felt embarrassed.', 'She was very hot outside.', 'She was sick.'], answer: 1,
        explain: 'This figurative language shows she felt embarrassed about her mistakes.' },
      { type: 'ebsr', skill: 'integ',
        partA: { prompt: 'Part A: What is a theme of the story?', choices: ['Winning is all that matters.', 'Being a good sport can turn disappointment into friendship.', 'Music is too hard to learn.', 'Friends should compete against each other.'], answer: 1 },
        partB: { prompt: 'Part B: Which sentence BEST supports the answer to Part A?',
          choices: ['Lena had practiced the violin piece every night for a month.', 'In the middle of the piece, she skipped a whole line.', 'Lena wanted to crumple the list and hide.', 'Instead, she found Maddie and said, "Congratulations. You earned it."'], answer: 3 },
        explain: 'Lena congratulates Maddie instead of sulking, and their friendship grows.' },
      { type: 'hottext', skill: 'key', prompt: 'Click the sentence that shows Lena\'s feelings about second chair change.', answer: [3, 3],
        explain: 'Lena realizes second chair "might not be so bad after all."' },
      { type: 'order', skill: 'craft', prompt: 'Put the events in order.',
        items: ['Lena practices for a month.', 'Lena skips a line in the audition.', 'The list is posted.', 'Lena congratulates Maddie.'],
        explain: 'The story moves from practice, to audition, to results, to Lena\'s choice.' },
      { type: 'short', skill: 'key', prompt: 'Who earns first chair? Type the name.', accept: ['maddie'],
        explain: 'Maddie, who played smoothly, was first chair.' },
    ],
  },
  {
    id: '4-info', grade: '4', genre: 'Informational', title: 'How Bridges Hold Up', icon: '🌉',
    paragraphs: [
      ['Every bridge has to fight two forces.', 'Compression is a pushing force that squeezes materials together.', 'Tension is a pulling force that stretches materials apart.', 'Engineers design bridges to handle both.'],
      ['The simplest kind of bridge is a beam bridge.', 'It is a flat beam held up by posts at each end, like a board across a creek.', 'Beam bridges are cheap to build, but they cannot be very long, because the middle starts to sag.'],
      ['An arch bridge uses a curved shape.', 'When weight presses down on the arch, the curve spreads the force out to the ends.', 'Some stone arch bridges built by the ancient Romans are still standing after two thousand years.'],
      ['Suspension bridges can stretch the farthest.', 'Huge cables hang from tall towers and hold up the road below.', 'The Golden Gate Bridge in San Francisco is a famous suspension bridge that is almost two miles long.'],
    ],
    questions: [
      { type: 'mc', skill: 'vocab', prompt: 'Based on the passage, what is "tension"?', choices: ['A pushing force', 'A pulling force', 'A kind of bridge', 'A tall tower'], answer: 1,
        explain: '"Tension is a pulling force that stretches materials apart."' },
      { type: 'multi', skill: 'key', prompt: 'Choose TWO facts about beam bridges.', choices: ['They are cheap to build.', 'They use huge cables.', 'They cannot be very long.', 'They were all built by Romans.'], answers: [0, 2],
        explain: 'Beam bridges are cheap, but they cannot be very long.' },
      { type: 'ebsr', skill: 'key',
        partA: { prompt: 'Part A: Why are arch bridges strong?', choices: ['They are made of cables.', 'The curve spreads the weight out to the ends.', 'They are very short.', 'They float on water.'], answer: 1 },
        partB: { prompt: 'Part B: Which sentence supports the answer to Part A?',
          choices: ['Every bridge has to fight two forces.', 'When weight presses down on the arch, the curve spreads the force out to the ends.', 'Suspension bridges can stretch the farthest.', 'Huge cables hang from tall towers and hold up the road below.'], answer: 1 },
        explain: 'The curve spreads the force to the ends of the arch.' },
      { type: 'mc', skill: 'craft', prompt: 'How is this passage MOSTLY organized?', choices: ['By telling a story in time order', 'By describing different types of bridges', 'By comparing two cities', 'By giving steps to build a bridge'], answer: 1,
        explain: 'Paragraphs 2–4 each describe one type of bridge.' },
      { type: 'hottext', skill: 'integ', prompt: 'Click the sentence that gives an example of how long-lasting arch bridges can be.', answer: [2, 2],
        explain: 'Roman arch bridges are "still standing after two thousand years."' },
      { type: 'short', skill: 'key', prompt: 'Which type of bridge can stretch the farthest? Type one word.', accept: ['suspension', 'suspension bridge', 'suspension bridges'],
        explain: '"Suspension bridges can stretch the farthest."' },
    ],
  },

  /* ============================== GRADE 5 =============================== */
  {
    id: '5-lit', grade: '5', genre: 'Story', title: 'The Map in the Attic', icon: '🗺️',
    paragraphs: [
      ['The attic smelled like dust and old cedar.', 'Nora and her younger brother, Eli, were supposed to be sorting boxes for the yard sale, but Eli had already wandered off to poke at a broken rocking horse.'],
      ['At the bottom of a trunk, Nora found a rolled-up paper tied with faded ribbon.', 'She unrolled it carefully.', 'It was a hand-drawn map of their town, but the streets were labeled in tiny, perfect handwriting, and in the corner was a name: Ada Whitfield, 1946.'],
      ['"That\'s Great-Grandma Ada," Mom said when they brought it downstairs.', '"She made maps for the county when hardly any women did that kind of work.', 'People told her it wasn\'t a job for a girl."'],
      ['Nora traced the careful lines with her finger.', 'She thought about the drawing pad under her bed, full of maps of imaginary islands she had never shown anyone.'],
      ['That night, Nora pinned Ada\'s map above her desk.', 'Then she pulled out her drawing pad, flipped to a clean page, and began to map her own neighborhood.'],
    ],
    questions: [
      { type: 'mc', skill: 'key', prompt: 'What does Nora find in the attic?', choices: ['A broken rocking horse', 'A map drawn by her great-grandmother', 'A box of old toys', 'A letter from her mom'], answer: 1,
        explain: 'She finds a hand-drawn map signed "Ada Whitfield, 1946."' },
      { type: 'ebsr', skill: 'integ',
        partA: { prompt: 'Part A: How does finding the map affect Nora?', choices: ['It makes her want to sell it.', 'It inspires her to share and grow her own talent.', 'It makes her afraid of the attic.', 'It makes her angry at Eli.'], answer: 1 },
        partB: { prompt: 'Part B: Which sentence BEST supports the answer to Part A?',
          choices: ['The attic smelled like dust and old cedar.', 'She unrolled it carefully.', 'Then she pulled out her drawing pad, flipped to a clean page, and began to map her own neighborhood.', '"That\'s Great-Grandma Ada," Mom said when they brought it downstairs.'], answer: 2 },
        explain: 'After learning about Ada, Nora starts mapping her real neighborhood.' },
      { type: 'hottext', skill: 'key', prompt: 'Click the sentence that shows Nora has been keeping her talent secret.', answer: [3, 1],
        explain: 'Her drawing pad is full of maps "she had never shown anyone."' },
      { type: 'mc', skill: 'craft', prompt: 'Why does the author include what people told Ada in paragraph 3?', choices: ['To show that Ada was not good at maps', 'To show that Ada did important work even when others doubted her', 'To explain how maps are printed', 'To describe the town in 1946'], answer: 1,
        explain: 'People said it "wasn\'t a job for a girl," but Ada did it anyway. This connects to Nora\'s choice.' },
      { type: 'multi', skill: 'integ', prompt: 'Choose TWO ways Nora and Great-Grandma Ada are alike.', choices: ['Both make maps.', 'Both sell things at yard sales.', 'Both have careful, detailed skills.', 'Both are afraid of attics.'], answers: [0, 2],
        explain: 'Both draw maps with care and skill.' },
      { type: 'vocab-mc', skill: 'vocab', prompt: 'In paragraph 4, "traced" most nearly means —', choices: ['followed along the lines', 'erased', 'tore', 'folded'], answer: 0,
        explain: 'She moved her finger along the lines of the map.' },
    ],
  },
  {
    id: '5-info', grade: '5', genre: 'Informational', title: 'The Great Monarch Migration', icon: '🦋',
    paragraphs: [
      ['Every fall, millions of monarch butterflies leave Canada and the northern United States and fly as far as 3,000 miles to the mountains of central Mexico.', 'They have never been there before, yet they find the same forests their great-great-grandparents used.'],
      ['Most monarchs live only two to six weeks.', 'However, the butterflies born at the end of summer are different.', 'This "super generation" can live up to eight months, long enough to make the whole journey south and survive the winter.'],
      ['In spring, the monarchs head north.', 'Along the way, they lay eggs on milkweed, the only plant monarch caterpillars can eat.', 'It takes three or four generations to complete the trip back north.'],
      ['Today, monarchs face serious threats.', 'Milkweed has disappeared from many fields and roadsides, and the forests in Mexico are shrinking.', 'People can help by planting milkweed and native flowers in yards and schoolyards.'],
    ],
    questions: [
      { type: 'mc', skill: 'integ', prompt: 'Which statement BEST tells the central idea of the passage?', choices: ['Monarchs are orange and black.', 'Monarchs make an amazing migration but need help to survive.', 'Mexico has many mountains.', 'Milkweed is a weed that should be removed.'], answer: 1,
        explain: 'The passage describes the migration and then explains the threats and how people can help.' },
      { type: 'ebsr', skill: 'key',
        partA: { prompt: 'Part A: What makes the "super generation" special?', choices: ['They are bigger than other monarchs.', 'They live long enough to fly south and survive the winter.', 'They do not eat milkweed.', 'They never leave Canada.'], answer: 1 },
        partB: { prompt: 'Part B: Which sentence supports the answer to Part A?',
          choices: ['Most monarchs live only two to six weeks.', 'This "super generation" can live up to eight months, long enough to make the whole journey south and survive the winter.', 'In spring, the monarchs head north.', 'Today, monarchs face serious threats.'], answer: 1 },
        explain: 'The super generation lives up to eight months.' },
      { type: 'hottext', skill: 'key', prompt: 'Click the sentence that explains why milkweed is important to monarchs.', answer: [2, 1],
        explain: 'Milkweed is "the only plant monarch caterpillars can eat."' },
      { type: 'multi', skill: 'key', prompt: 'Choose TWO threats to monarchs named in the passage.', choices: ['Milkweed is disappearing.', 'Too many people plant flowers.', 'Forests in Mexico are shrinking.', 'Monarchs fly too slowly.'], answers: [0, 2],
        explain: 'Paragraph 4 names lost milkweed and shrinking forests.' },
      { type: 'mc', skill: 'craft', prompt: 'Why does the author end with a sentence about planting milkweed?', choices: ['To give readers a way to help', 'To explain what monarchs look like', 'To describe Mexico', 'To show that the journey is easy'], answer: 0,
        explain: 'The last sentence tells readers what they can do to help.' },
      { type: 'short', skill: 'vocab', prompt: 'What word in paragraph 2 means "a long trip from one place to another"? (Hint: it starts with j.)', accept: ['journey'],
        explain: 'A journey is a long trip: "long enough to make the whole journey south."' },
    ],
  },

  /* ============================== GRADE 6 =============================== */
  {
    id: '6-lit', grade: '6', genre: 'Story', title: 'The Keeper\'s Daughter', icon: '🗼',
    paragraphs: [
      ['In the autumn of 1881, fifteen-year-old Clara Benn had lived at the Gull Rock Lighthouse for as long as she could remember.', 'Her father kept the great lamp burning, and Clara rowed their small boat to the mainland for supplies.'],
      ['One gray afternoon, her father was ashore when the wind turned savage.', 'Through the spray, Clara saw a fishing boat flip over near the rocks.', 'Two figures clung to its hull.'],
      ['There was no one else to go.', 'Clara pulled on her father\'s oilskin coat, dragged the rowboat into the churning water, and pulled at the oars until her palms blistered.', 'Each wave tried to shove her back toward shore, but she kept her eyes fixed on the overturned hull.'],
      ['It took her nearly an hour to haul the two exhausted fishermen into the boat and row them back to the lighthouse.', 'When her father returned that night, he found them wrapped in blankets beside the stove, drinking tea.'],
      ['"Who brought you in?" he asked.', 'One of the fishermen nodded toward Clara, who was quietly trimming the wick of the great lamp, as she did every evening.'],
    ],
    questions: [
      { type: 'vocab-mc', skill: 'vocab', prompt: 'In paragraph 2, the word "savage" describes the wind as —', choices: ['gentle and warm', 'fierce and dangerous', 'quiet and still', 'cold but calm'], answer: 1,
        explain: 'The wind is strong enough to flip a fishing boat, so it is fierce and dangerous.' },
      { type: 'ebsr', skill: 'integ',
        partA: { prompt: 'Part A: Which trait BEST describes Clara?', choices: ['Boastful', 'Determined', 'Careless', 'Fearful'], answer: 1 },
        partB: { prompt: 'Part B: Which detail BEST supports the answer to Part A?',
          choices: ['Her father kept the great lamp burning, and Clara rowed their small boat to the mainland for supplies.', 'Each wave tried to shove her back toward shore, but she kept her eyes fixed on the overturned hull.', 'When her father returned that night, he found them wrapped in blankets beside the stove, drinking tea.', '"Who brought you in?" he asked.'], answer: 1 },
        explain: 'Clara keeps going even as each wave pushes her back.' },
      { type: 'mc', skill: 'craft', prompt: 'What does the ending suggest about Clara?', choices: ['She wants everyone to praise her.', 'She is humble and sees the rescue as part of her duty.', 'She is too tired to speak.', 'She is upset with the fishermen.'], answer: 1,
        explain: 'She quietly goes back to her usual chores instead of bragging.' },
      { type: 'hottext', skill: 'key', prompt: 'Click the sentence that shows the physical cost of Clara\'s rescue.', answer: [2, 1],
        explain: 'She rowed "until her palms blistered."' },
      { type: 'order', skill: 'key', prompt: 'Put the events in order.',
        items: ['The wind turns dangerous.', 'A fishing boat flips over.', 'Clara rows out to the boat.', 'Clara\'s father returns.'],
        explain: 'Storm, capsized boat, rescue, then her father returns.' },
      { type: 'multi', skill: 'craft', prompt: 'Choose TWO details the author uses to show the setting is dangerous.', choices: ['The wind turned savage.', 'She drank tea by the stove.', 'The water was churning.', 'She trimmed the wick.'], answers: [0, 2],
        explain: 'The savage wind and churning water show danger.' },
    ],
  },
  {
    id: '6-info', grade: '6', genre: 'Informational', title: 'Why Your Brain Needs Sleep', icon: '😴',
    paragraphs: [
      ['Sleep can feel like wasted time, but your brain is busy while you rest.', 'During deep sleep, the brain sorts through the day\'s experiences and stores important memories, a process scientists call consolidation.'],
      ['Sleep also works like a cleaning crew.', 'Researchers have found that while we sleep, fluid flows through the brain and washes away waste that builds up during the day.'],
      ['Doctors recommend that children ages 6 to 12 get 9 to 12 hours of sleep each night, and teenagers 8 to 10 hours.', 'Yet many students get far less.', 'Without enough sleep, people have more trouble paying attention, controlling their emotions, and remembering what they learned.'],
      ['Screens are one reason.', 'The bright light from phones and tablets can trick the brain into thinking it is still daytime, which delays the release of melatonin, the hormone that makes us sleepy.', 'Experts suggest turning off screens an hour before bed and keeping a regular bedtime, even on weekends.'],
    ],
    questions: [
      { type: 'mc', skill: 'integ', prompt: 'What is the author\'s MAIN purpose?', choices: ['To entertain with a story about dreams', 'To explain why sleep matters and how to get more of it', 'To persuade readers to buy new phones', 'To describe how beds are made'], answer: 1,
        explain: 'The author explains what sleep does and gives tips for better sleep.' },
      { type: 'vocab-mc', skill: 'vocab', prompt: 'In paragraph 1, "consolidation" refers to —', choices: ['cleaning the brain', 'storing important memories', 'falling asleep quickly', 'having dreams'], answer: 1,
        explain: 'The sentence defines it: the brain "stores important memories, a process scientists call consolidation."' },
      { type: 'ebsr', skill: 'key',
        partA: { prompt: 'Part A: According to the passage, how do screens affect sleep?', choices: ['They make people sleep longer.', 'Their light delays the hormone that makes us sleepy.', 'They clean the brain.', 'They help store memories.'], answer: 1 },
        partB: { prompt: 'Part B: Which sentence supports the answer to Part A?',
          choices: ['Sleep also works like a cleaning crew.', 'Yet many students get far less.', 'The bright light from phones and tablets can trick the brain into thinking it is still daytime, which delays the release of melatonin, the hormone that makes us sleepy.', 'Sleep can feel like wasted time, but your brain is busy while you rest.'], answer: 2 },
        explain: 'Screen light tricks the brain and delays melatonin.' },
      { type: 'hottext', skill: 'craft', prompt: 'Click the sentence where the author uses a comparison to explain what sleep does.', answer: [1, 0],
        explain: 'The author compares sleep to "a cleaning crew."' },
      { type: 'multi', skill: 'key', prompt: 'Choose TWO effects of not getting enough sleep.', choices: ['Trouble paying attention', 'Growing taller faster', 'Trouble remembering what you learned', 'Needing fewer meals'], answers: [0, 2],
        explain: 'Paragraph 3 lists trouble paying attention, controlling emotions, and remembering.' },
      { type: 'short', skill: 'key', prompt: 'How many hours before bed do experts suggest turning off screens? Type a number or word.', accept: ['1', 'one', 'an hour', 'one hour', '1 hour'],
        explain: 'Experts suggest turning off screens "an hour before bed."' },
    ],
  },

  /* ============================== GRADE 7 =============================== */
  {
    id: '7-lit', grade: '7', genre: 'Story', title: 'The Robot That Didn\'t Win', icon: '🤖',
    paragraphs: [
      ['For three weeks, Priya and Marcus had spent every lunch period in the robotics lab, building a robot that could sort recycling by color.', 'Marcus wrote most of the code; Priya designed the gripper arm.'],
      ['Two days before the regional science fair, Priya noticed something.', 'The sorting program Marcus had uploaded was nearly identical to one she had seen online, down to the comments in the code.', 'When she asked him about it, Marcus shrugged.', '"Everybody borrows code," he said.', '"The judges will never check."'],
      ['Priya lay awake that night.', 'She could keep quiet and probably win a trophy.', 'Or she could say something and risk losing her friend and their chance at first place.'],
      ['The next morning, she showed Marcus a plan: they would credit the original programmer on their poster and spend the next two nights adding a feature of their own that let the robot learn new colors.', 'Marcus was quiet for a long moment.', 'Then he pulled up a chair.'],
      ['Their robot placed fourth.', 'But when a judge asked how the color-learning feature worked, Marcus explained every line, and Priya noticed he was standing a little taller than usual.'],
    ],
    questions: [
      { type: 'mc', skill: 'key', prompt: 'What is the main conflict Priya faces?', choices: ['Whether to enter the science fair at all', 'Whether to speak up about the copied code', 'Whether to build a new gripper arm', 'Whether to join a different team'], answer: 1,
        explain: 'Priya must decide whether to say something about Marcus\'s copied code.' },
      { type: 'ebsr', skill: 'integ',
        partA: { prompt: 'Part A: Which statement BEST expresses a theme of the story?', choices: ['Winning is worth any cost.', 'Honest work can be more rewarding than a trophy.', 'Robots are better than people at sorting.', 'Friends should never disagree.'], answer: 1 },
        partB: { prompt: 'Part B: Which detail BEST supports the answer to Part A?',
          choices: ['Marcus wrote most of the code; Priya designed the gripper arm.', '"The judges will never check."', 'Their robot placed fourth.', 'But when a judge asked how the color-learning feature worked, Marcus explained every line, and Priya noticed he was standing a little taller than usual.'], answer: 3 },
        explain: 'Even without winning, Marcus is proud of work that is truly theirs.' },
      { type: 'hottext', skill: 'craft', prompt: 'Click the sentence that shows Marcus has decided to go along with Priya\'s plan.', answer: [3, 2],
        explain: 'Pulling up a chair shows, without saying it directly, that he agrees to work on it.' },
      { type: 'mc', skill: 'craft', prompt: 'How does paragraph 3 contribute to the story?', choices: ['It describes the robot\'s design.', 'It shows Priya weighing her choices, building tension.', 'It introduces the judges.', 'It explains how recycling works.'], answer: 1,
        explain: 'Priya lies awake comparing two choices, which builds suspense before her decision.' },
      { type: 'multi', skill: 'integ', prompt: 'Choose TWO things that change for Marcus by the end of the story.', choices: ['He takes pride in work he understands.', 'He quits robotics.', 'He accepts giving credit for borrowed code.', 'He wins first place.'], answers: [0, 2],
        explain: 'Marcus credits the original programmer and proudly explains the new feature.' },
      { type: 'vocab-mc', skill: 'vocab', prompt: 'In paragraph 2, Marcus "shrugged." This action suggests he —', choices: ['did not think the problem was important', 'was confused about the code', 'was angry with Priya', 'was very tired'], answer: 0,
        explain: 'A shrug, along with "Everybody borrows code," shows he doesn\'t see it as a problem.' },
    ],
  },
  {
    id: '7-info', grade: '7', genre: 'Argument', title: 'Should School Start Later?', icon: '⏰',
    paragraphs: [
      ['Many middle and high schools in the United States start classes before 8:00 a.m.', 'Some districts are now pushing start times later, and they have good reason to.'],
      ['During the teen years, the body\'s internal clock shifts.', 'Most teenagers do not feel sleepy until about 11:00 p.m., no matter how early they go to bed.', 'When school starts at 7:30, many students lose hours of the sleep their growing brains need.'],
      ['Districts that changed their schedules have seen results.', 'After one district moved its start time to 8:30, attendance went up and fewer students fell asleep in class.', 'Studies have also linked later start times to fewer car accidents among teen drivers.'],
      ['Critics argue that later start times make it harder to schedule buses and after-school sports.', 'These challenges are real, but they can be solved with planning.', 'Students\' health and learning should come first.'],
    ],
    questions: [
      { type: 'mc', skill: 'integ', prompt: 'What is the author\'s claim?', choices: ['Schools should start later.', 'Teens should go to bed earlier.', 'Sports are more important than sleep.', 'Buses should be removed.'], answer: 0,
        explain: 'The author argues districts "have good reason" to start later and that health should come first.' },
      { type: 'ebsr', skill: 'key',
        partA: { prompt: 'Part A: Which reason does the author give to support the claim?', choices: ['Teens prefer sleeping in on weekends.', 'Teens\' internal clocks make it hard to fall asleep early.', 'Teachers want shorter days.', 'Later starts save money.'], answer: 1 },
        partB: { prompt: 'Part B: Which sentence provides evidence for the answer to Part A?',
          choices: ['Many middle and high schools in the United States start classes before 8:00 a.m.', 'Most teenagers do not feel sleepy until about 11:00 p.m., no matter how early they go to bed.', 'These challenges are real, but they can be solved with planning.', 'Students\' health and learning should come first.'], answer: 1 },
        explain: 'Teens\' clocks shift, so they don\'t feel sleepy until about 11:00 p.m.' },
      { type: 'hottext', skill: 'craft', prompt: 'Click the sentence where the author presents a counterclaim (an opposing view).', answer: [3, 0],
        explain: 'Critics\' concerns about buses and sports are the opposing view.' },
      { type: 'mc', skill: 'craft', prompt: 'How does the author respond to the counterclaim?', choices: ['By agreeing that schools should not change', 'By admitting the challenges but saying they can be solved', 'By ignoring it', 'By saying sports should be canceled'], answer: 1,
        explain: '"These challenges are real, but they can be solved with planning."' },
      { type: 'multi', skill: 'integ', prompt: 'Choose TWO pieces of evidence the author uses to show later start times work.', choices: ['Attendance went up.', 'Students got more homework.', 'Fewer students fell asleep in class.', 'Buses became cheaper.'], answers: [0, 2],
        explain: 'Paragraph 3 reports higher attendance and fewer students sleeping in class.' },
      { type: 'short', skill: 'vocab', prompt: 'Which word in paragraph 4 means "people who disagree with or find fault with an idea"?', accept: ['critics'],
        explain: '"Critics argue..." Critics are people who find fault with an idea.' },
    ],
  },

  /* ============================== GRADE 8 =============================== */
  {
    id: '8-lit', grade: '8', genre: 'Story', title: 'Ashes and Seeds', icon: '🌱',
    paragraphs: [
      ['The fire had come through in August.', 'By October, the hillside behind Grandpa Tomás\'s house was a slope of black stumps and gray ash, and Teo could not look at it without feeling the heat of that night all over again.'],
      ['"Grab the shovel," Grandpa said one Saturday morning, handing him a paper sack.', 'Inside were hundreds of acorns, gathered from the old oaks along the creek that the fire had spared.'],
      ['"It\'s pointless," Teo said.', '"These won\'t be trees for years.', 'I\'ll be grown before they\'re taller than me."'],
      ['Grandpa knelt and pressed an acorn into the soft ash.', '"My father planted the oaks by the creek," he said.', '"He never sat in their shade.', 'I did."'],
      ['They worked until the sun slid behind the ridge.', 'Teo\'s hands were gray to the wrists, and his back ached.', 'Before they went inside, he noticed something he had missed all morning: tiny green shoots of grass already pushing up through the black.'],
    ],
    questions: [
      { type: 'ebsr', skill: 'integ',
        partA: { prompt: 'Part A: What is a central theme of the story?', choices: ['Nature cannot recover from disaster.', 'People can plant for a future they may not fully see.', 'Hard work is never worth it.', 'Fire is useful for farming.'], answer: 1 },
        partB: { prompt: 'Part B: Which sentence BEST supports the answer to Part A?',
          choices: ['The fire had come through in August.', '"It\'s pointless," Teo said.', '"He never sat in their shade.', 'They worked until the sun slid behind the ridge.'], answer: 2 },
        explain: 'Grandpa\'s father planted trees he never enjoyed, but the next generation did.' },
      { type: 'mc', skill: 'craft', prompt: 'What do the green shoots in the last paragraph MOST LIKELY symbolize?', choices: ['Danger from another fire', 'Hope and new life', 'Teo\'s tiredness', 'The end of autumn'], answer: 1,
        explain: 'New growth pushing through the ash suggests recovery and hope.' },
      { type: 'hottext', skill: 'key', prompt: 'Click the sentence that shows Teo is still affected by memories of the fire.', answer: [0, 1],
        explain: 'He "could not look at it without feeling the heat of that night all over again."' },
      { type: 'mc', skill: 'craft', prompt: 'How does Grandpa respond to Teo\'s complaint in paragraph 3?', choices: ['He scolds Teo.', 'He tells a family story that changes how Teo might see the work.', 'He agrees and stops planting.', 'He offers to pay Teo.'], answer: 1,
        explain: 'Instead of arguing, Grandpa shares how his father planted the oaks he later enjoyed.' },
      { type: 'multi', skill: 'key', prompt: 'Choose TWO details that show the planting was hard work.', choices: ['Teo\'s hands were gray to the wrists.', 'The oaks by the creek were spared.', 'His back ached.', 'Grandpa handed him a paper sack.'], answers: [0, 2],
        explain: 'Ash-covered hands and an aching back show the effort.' },
      { type: 'vocab-mc', skill: 'vocab', prompt: 'In paragraph 2, "spared" means —', choices: ['burned', 'not harmed', 'planted', 'cut down'], answer: 1,
        explain: 'The oaks along the creek survived; the fire did not harm them.' },
    ],
  },
  {
    id: '8-info', grade: '8', genre: 'Informational', title: 'The Machine That Changed Reading', icon: '📜',
    paragraphs: [
      ['Before the 1450s, nearly every book in Europe was copied by hand.', 'A single Bible could take a skilled scribe more than a year to finish, so books were rare and expensive, and few people learned to read.'],
      ['Around 1450, a German metalworker named Johannes Gutenberg developed a printing press with movable metal type.', 'Each letter was cast as a separate piece that could be arranged into words, inked, pressed onto paper, and then rearranged for the next page.'],
      ['The effect was dramatic.', 'Within fifty years, presses across Europe had produced millions of books.', 'As books became cheaper, more people learned to read, and new ideas in science, religion, and politics spread faster than ever before.'],
      ['Not everyone celebrated.', 'Some leaders worried that printed pamphlets would spread rumors and challenge their authority.', 'Historians often compare the printing press to the internet: both made information easier to share, for better and for worse.'],
    ],
    questions: [
      { type: 'mc', skill: 'integ', prompt: 'Which statement BEST expresses the central idea of the passage?', choices: ['Gutenberg was a metalworker.', 'The printing press made books widely available and changed how ideas spread.', 'Scribes were skilled artists.', 'The internet is older than the printing press.'], answer: 1,
        explain: 'The passage traces how the press made books common and spread ideas.' },
      { type: 'ebsr', skill: 'key',
        partA: { prompt: 'Part A: Why were books rare before the printing press?', choices: ['People did not like reading.', 'Copying books by hand took a very long time.', 'Paper had not been invented.', 'Leaders banned all books.'], answer: 1 },
        partB: { prompt: 'Part B: Which sentence supports the answer to Part A?',
          choices: ['A single Bible could take a skilled scribe more than a year to finish, so books were rare and expensive, and few people learned to read.', 'The effect was dramatic.', 'Not everyone celebrated.', 'Each letter was cast as a separate piece that could be arranged into words, inked, pressed onto paper, and then rearranged for the next page.'], answer: 0 },
        explain: 'Hand-copying took over a year per book.' },
      { type: 'hottext', skill: 'craft', prompt: 'Click the sentence in which the author makes a comparison to modern times.', answer: [3, 2],
        explain: 'The author compares the printing press to the internet.' },
      { type: 'order', skill: 'craft', prompt: 'Put the steps of movable-type printing in order.',
        items: ['Arrange the letters into words.', 'Ink the type.', 'Press it onto paper.', 'Rearrange the letters for the next page.'],
        explain: 'Paragraph 2: arranged, inked, pressed, then rearranged.' },
      { type: 'multi', skill: 'integ', prompt: 'Choose TWO effects of the printing press described in the passage.', choices: ['More people learned to read.', 'Scribes became more popular.', 'New ideas spread faster.', 'Books became more expensive.'], answers: [0, 2],
        explain: 'Cheaper books meant more readers and faster-spreading ideas.' },
      { type: 'vocab-mc', skill: 'vocab', prompt: 'In paragraph 4, "authority" most nearly means —', choices: ['power to make decisions and rules', 'a type of book', 'a famous author', 'a printing tool'], answer: 0,
        explain: 'Leaders feared pamphlets would challenge their power.' },
    ],
  },
];

/* "vocab-mc" is a selected-response vocabulary item: same as mc */
PASSAGES.forEach(p => p.questions.forEach(q => { if (q.type === 'vocab-mc') q.type = 'mc'; }));
