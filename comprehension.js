/* ===================================================================
   Comprehension — short reading-comprehension exercises shared by
   SpellingHive (Read & Think game), Reading Boost (Think About It step)
   and Story Check (Skill Drills).

   Each exercise is a short text plus one question that practises one
   core comprehension skill. Exercises come in three bands:
   k2 (grades K–2), 35 (grades 3–5) and 68 (grades 6–8).
   Item shapes:
     choice: { skill, text, q, choices, answer, why }
     order:  { skill, text?, q, items (in correct order), why }
   =================================================================== */

const COMP_SKILLS = {
  wh:       { name: 'Who, What, Where', icon: '❓', storySkill: 'key',
              tip: 'Find the exact words in the text that answer the question.' },
  main:     { name: 'Main Idea',        icon: '🎯', storySkill: 'integ',
              tip: 'Ask: what are ALL the sentences about? The main idea covers the whole text, not one detail.' },
  sequence: { name: 'Sequence',         icon: '🔢', storySkill: 'key',
              tip: 'Look for time words like first, next, then, after and finally.' },
  cause:    { name: 'Cause & Effect',   icon: '⚡', storySkill: 'key',
              tip: 'The cause is WHY something happens. The effect is WHAT happens. Look for because, so, and since.' },
  infer:    { name: 'Inference',        icon: '🕵️', storySkill: 'infer',
              tip: 'Clues in the text + what you already know = an inference. The answer isn\'t said directly.' },
  factop:   { name: 'Fact or Opinion',  icon: '⚖️', storySkill: 'craft',
              tip: 'A fact can be proven. An opinion tells what someone thinks or feels, with words like best, should or beautiful.' },
  real:     { name: 'Real or Make-Believe', icon: '🦄', storySkill: 'craft',
              tip: 'Ask: could this really happen? Talking animals and magic are make-believe.' },
  context:  { name: 'Context Clues',    icon: '🔍', storySkill: 'vocab',
              tip: 'Read the words around a new word. They often explain or give an example of what it means.' },
};

const COMP_BANDS = { k2: 'Grades K–2', 35: 'Grades 3–5', 68: 'Grades 6–8' };

const COMP_ITEMS = {
  /* =============================== K–2 =============================== */
  k2: [
    // Who, What, Where
    { skill: 'wh', text: 'Sam has a red ball. He plays with it at the park.', q: 'Where does Sam play?', choices: ['At school', 'At the park', 'At home'], answer: 1, why: 'The text says he plays "at the park."' },
    { skill: 'wh', text: 'Mia baked a cake for her mom. Her mom smiled and gave her a hug.', q: 'Who baked the cake?', choices: ['Mom', 'Mia', 'Dad'], answer: 1, why: '"Mia baked a cake for her mom."' },
    { skill: 'wh', text: 'The cat sat on the warm rug. It took a long nap in the sun.', q: 'What did the cat do?', choices: ['Ate fish', 'Took a nap', 'Ran outside'], answer: 1, why: 'The cat "took a long nap."' },
    { skill: 'wh', text: 'On Saturday, Ben and his dad went fishing at the lake.', q: 'When did Ben go fishing?', choices: ['On Saturday', 'On Monday', 'At night'], answer: 0, why: 'The text starts with "On Saturday."' },
    // Main idea
    { skill: 'main', text: 'Dogs can be great pets. They like to play. They keep you company. They love to go on walks with you.', q: 'What is this mostly about?', choices: ['Dogs make good pets', 'How to walk', 'Cats and dogs'], answer: 0, why: 'Every sentence tells why dogs are good pets.' },
    { skill: 'main', text: 'In winter it is cold. Snow falls. We wear hats and mittens. We drink hot cocoa.', q: 'What is this mostly about?', choices: ['Hot cocoa', 'Winter', 'Mittens'], answer: 1, why: 'Cocoa and mittens are details. All of them are about winter.' },
    { skill: 'main', text: 'Ants are tiny but strong. They carry food back to their home. They work together in big teams.', q: 'What is the best title?', choices: ['Busy Ants', 'My Lunch', 'Big Bears'], answer: 0, why: 'All the sentences are about ants and how they work.' },
    { skill: 'main', text: 'You can help at home. You can make your bed. You can feed the pet. You can set the table.', q: 'What is the main idea?', choices: ['Pets are fun', 'Ways to help at home', 'Beds are soft'], answer: 1, why: 'Each sentence is one way to help at home.' },
    // Sequence
    { skill: 'sequence', text: 'First, Lily got a cup. Next, she poured the milk. Last, she drank it all up.', q: 'Put what Lily did in order.', items: ['She got a cup.', 'She poured the milk.', 'She drank it.'], why: 'The words first, next and last tell the order.' },
    { skill: 'sequence', q: 'Put the steps for planting a seed in order.', items: ['Dig a hole.', 'Put in the seed.', 'Cover it with dirt.', 'Water it.'], why: 'You dig, plant, cover, and then water.' },
    { skill: 'sequence', text: 'Max woke up. Then he brushed his teeth. After that, he ate breakfast.', q: 'Put Max\'s morning in order.', items: ['Max woke up.', 'He brushed his teeth.', 'He ate breakfast.'], why: 'Then and after that show what came next.' },
    { skill: 'sequence', q: 'Put the steps for making a sandwich in order.', items: ['Get two slices of bread.', 'Spread the peanut butter.', 'Put the slices together.'], why: 'You need bread first, then the filling, then you close it.' },
    // Cause & effect
    { skill: 'cause', text: 'It rained all day. The grass was very wet.', q: 'Why was the grass wet?', choices: ['The sun was out', 'It rained all day', 'A dog ran on it'], answer: 1, why: 'The rain (cause) made the grass wet (effect).' },
    { skill: 'cause', text: 'Kim forgot her coat. She felt cold at recess.', q: 'What happened because Kim forgot her coat?', choices: ['She felt cold', 'She won a game', 'She ate lunch'], answer: 0, why: 'No coat (cause) made her cold (effect).' },
    { skill: 'cause', text: 'The baby was tired, so he fell asleep in his crib.', q: 'Why did the baby fall asleep?', choices: ['He was hungry', 'He was tired', 'He was sad'], answer: 1, why: 'The word "so" shows the cause: he was tired.' },
    { skill: 'cause', text: 'Jay dropped the glass. It broke into pieces.', q: 'What happened when Jay dropped the glass?', choices: ['It broke', 'It bounced', 'It filled with water'], answer: 0, why: 'Dropping it (cause) made it break (effect).' },
    // Inference
    { skill: 'infer', text: 'Ella put on her swimsuit and grabbed a towel. She packed her goggles.', q: 'Where is Ella MOST LIKELY going?', choices: ['To the pool', 'To bed', 'To the library'], answer: 0, why: 'A swimsuit, towel and goggles are clues she is going swimming.', clue: { choices: ['swimsuit and grabbed a towel', 'Ella', 'packed'], answer: 0 } },
    { skill: 'infer', text: 'Tom\'s tummy rumbled. He looked at the clock. It was almost lunchtime.', q: 'How does Tom feel?', choices: ['Hungry', 'Scared', 'Sleepy'], answer: 0, why: 'A rumbling tummy near lunchtime means he is hungry.', clue: { choices: ['tummy rumbled', 'looked at the clock', 'Tom'], answer: 0 } },
    { skill: 'infer', text: 'The sky got dark. Thunder boomed. Everyone ran inside.', q: 'What is about to happen?', choices: ['A storm', 'A party', 'A sunny day'], answer: 0, why: 'Dark sky and thunder are clues that a storm is coming.', clue: { choices: ['Thunder boomed', 'Everyone', 'inside'], answer: 0 } },
    { skill: 'infer', text: 'Nia jumped up and down and clapped. She hugged her new puppy.', q: 'How does Nia feel?', choices: ['Angry', 'Excited', 'Bored'], answer: 1, why: 'Jumping, clapping and hugging show she is excited.', clue: { choices: ['jumped up and down and clapped', 'her new', 'Nia'], answer: 0 } },
    { skill: 'infer', text: 'Grace put on her boots and coat. She grabbed her sled and ran out the door.', q: 'What is the weather MOST LIKELY like?', choices: ['Hot and sunny', 'Snowy', 'Rainy and warm'], answer: 1, why: 'Boots, a coat and a sled are clues that it is snowy.', clue: { choices: ['She grabbed her sled', 'ran out the door', 'Grace'], answer: 0 } },
    { skill: 'infer', text: 'Leo yawned and rubbed his eyes. He could not keep his eyes open during the story.', q: 'How does Leo feel?', choices: ['Sleepy', 'Silly', 'Mad'], answer: 0, why: 'Yawning and heavy eyes show he is sleepy.', clue: { choices: ['yawned and rubbed his eyes', 'the story', 'Leo'], answer: 0 } },
    { skill: 'infer', text: 'There were crumbs on the floor and the cookie jar was empty. The dog had crumbs on his nose.', q: 'Who ate the cookies?', choices: ['The cat', 'The dog', 'Mom'], answer: 1, why: 'Crumbs on the dog\'s nose are the big clue.', clue: { choices: ['crumbs on his nose', 'the cookie jar', 'the floor'], answer: 0 } },
    { skill: 'infer', text: 'Ava wore a cap and gown. Her family clapped and took pictures as she walked across the stage.', q: 'What is happening?', choices: ['Ava is graduating', 'Ava is going to sleep', 'Ava is swimming'], answer: 0, why: 'A cap and gown and walking across a stage are clues for a graduation.', clue: { choices: ['wore a cap and gown', 'her family', 'took pictures'], answer: 0 } },
    // Real or make-believe
    { skill: 'real', text: 'A girl rode her bike to the store.', q: 'Is this real or make-believe?', choices: ['Real', 'Make-believe'], answer: 0, why: 'Kids really can ride bikes to a store.' },
    { skill: 'real', text: 'The pig put on a crown and talked to the king.', q: 'Is this real or make-believe?', choices: ['Real', 'Make-believe'], answer: 1, why: 'Pigs can\'t talk or wear crowns. That is make-believe.' },
    { skill: 'real', text: 'A frog jumped into the pond.', q: 'Is this real or make-believe?', choices: ['Real', 'Make-believe'], answer: 0, why: 'Frogs really jump into ponds.' },
    { skill: 'real', text: 'The moon came down and played tag with the stars.', q: 'Is this real or make-believe?', choices: ['Real', 'Make-believe'], answer: 1, why: 'The moon cannot play tag. That is make-believe.' },
    // Context clues
    { skill: 'context', text: 'The puppy was so tiny it could fit in my hand.', q: 'What does "tiny" mean?', choices: ['Very big', 'Very small', 'Very loud'], answer: 1, why: 'It fits in a hand, so tiny means very small.' },
    { skill: 'context', text: 'Dad was furious when the dog chewed his new shoes. His face turned red.', q: 'What does "furious" mean?', choices: ['Very happy', 'Very angry', 'Very tired'], answer: 1, why: 'A red face over chewed shoes shows he was very angry.' },
    { skill: 'context', text: 'The lemon was so sour that I made a funny face.', q: 'What does "sour" mean?', choices: ['Sweet', 'Tart and sharp tasting', 'Hot'], answer: 1, why: 'Lemons are tart, and sour things make you pucker.' },
    { skill: 'context', text: 'The kitten was timid and hid under the bed when people came over.', q: 'What does "timid" mean?', choices: ['Shy', 'Loud', 'Hungry'], answer: 0, why: 'Hiding from people shows the kitten was shy.' },
  ],

  /* =============================== 3–5 =============================== */
  35: [
    { skill: 'wh', text: 'After school on Tuesday, Marcus walked his neighbor\'s dog, Biscuit, to the river trail. They stopped at the bridge to watch the ducks.', q: 'Where did Marcus stop with Biscuit?', choices: ['At the school', 'At the bridge', 'At the store', 'At his house'], answer: 1, why: '"They stopped at the bridge to watch the ducks."' },
    { skill: 'wh', text: 'The town library holds a reading contest every summer. Whoever reads the most books by August wins a free pass to the science museum.', q: 'What is the prize for the reading contest?', choices: ['A new book', 'A free pass to the science museum', 'A trophy', 'Free pizza'], answer: 1, why: 'The winner gets "a free pass to the science museum."' },
    { skill: 'wh', text: 'Grandma Rosa planted tomatoes, peppers and basil along the back fence. By July, the garden was overflowing.', q: 'Who planted the garden?', choices: ['The neighbors', 'Grandma Rosa', 'A farmer', 'The class'], answer: 1, why: '"Grandma Rosa planted tomatoes, peppers and basil."' },
    { skill: 'wh', text: 'In 1969, astronauts Neil Armstrong and Buzz Aldrin became the first people to walk on the moon.', q: 'When did people first walk on the moon?', choices: ['In 1919', 'In 1969', 'In 1999', 'In 2009'], answer: 1, why: 'The sentence begins "In 1969."' },
    { skill: 'main', text: 'Camels are built for the desert. Their humps store fat for energy. Their long eyelashes keep out blowing sand. Their wide feet keep them from sinking in soft sand.', q: 'What is the main idea?', choices: ['Camels have long eyelashes.', 'Camels have features that help them survive in the desert.', 'Deserts have a lot of sand.', 'Camels are tall.'], answer: 1, why: 'Humps, eyelashes and feet are details that all support how camels survive in the desert.' },
    { skill: 'main', text: 'Recycling helps the planet. It keeps trash out of landfills. It saves trees when we reuse paper. It also saves energy, because making things from recycled materials uses less power.', q: 'Which sentence states the main idea?', choices: ['Recycling helps the planet.', 'It saves trees when we reuse paper.', 'It keeps trash out of landfills.', 'It also saves energy.'], answer: 0, why: 'The first sentence is the main idea; the others are supporting details.' },
    { skill: 'main', text: 'Before a big game, Coach Lin\'s team stretches, drinks water and reviews their plays. They also get a good night\'s sleep the night before.', q: 'What is the best title for this paragraph?', choices: ['Coach Lin\'s Favorite Food', 'Getting Ready for the Big Game', 'How to Score a Goal', 'The Best Water Bottles'], answer: 1, why: 'Every detail is something the team does to prepare.' },
    { skill: 'main', text: 'Octopuses are clever animals. They can open jars, solve puzzles and escape from tanks. Some even use coconut shells as portable shelters.', q: 'What is this paragraph mostly about?', choices: ['Octopuses are smart.', 'Coconuts are useful.', 'Fish tanks can break.', 'Jars are hard to open.'], answer: 0, why: 'The examples all show how clever octopuses are.' },
    { skill: 'sequence', text: 'To make a paper airplane, Aiden folded the paper in half the long way. Then he folded the top corners down to the center. Next, he folded the sides down to make wings. Finally, he threw it across the room.', q: 'Put Aiden\'s steps in order.', items: ['Fold the paper in half.', 'Fold the top corners to the center.', 'Fold down the wings.', 'Throw the airplane.'], why: 'Then, next and finally show the order of the steps.' },
    { skill: 'sequence', q: 'Put the stages of a butterfly\'s life in order.', items: ['Egg', 'Caterpillar', 'Chrysalis', 'Butterfly'], why: 'A butterfly grows from egg to caterpillar to chrysalis to adult.' },
    { skill: 'sequence', text: 'The storm began with a light drizzle. Within an hour, heavy rain was pounding the roof. By evening, the creek had overflowed. The next morning, the sun came out and the water slowly drained away.', q: 'Put the events in order.', items: ['A light drizzle began.', 'Heavy rain pounded the roof.', 'The creek overflowed.', 'The sun came out.'], why: 'Time clues: began, within an hour, by evening, the next morning.' },
    { skill: 'sequence', q: 'Put the steps of the water cycle in order, starting with water in the ocean.', items: ['The sun heats ocean water.', 'Water evaporates into the air.', 'Clouds form.', 'Rain falls back to Earth.'], why: 'Heat causes evaporation, vapor forms clouds, and clouds release rain.' },
    { skill: 'cause', text: 'Because the bridge was closed for repairs, the school bus had to take a longer route. Many students arrived late.', q: 'Why did students arrive late?', choices: ['They overslept.', 'The bus took a longer route because the bridge was closed.', 'It was snowing.', 'The bus broke down.'], answer: 1, why: '"Because" signals the cause: the bridge was closed.' },
    { skill: 'cause', text: 'Priya practiced her piano piece every day for a month. At the recital, she played it without a single mistake.', q: 'What was the effect of Priya\'s daily practice?', choices: ['She got bored of piano.', 'She played without a mistake at the recital.', 'She switched to violin.', 'She skipped the recital.'], answer: 1, why: 'Daily practice (cause) led to a perfect performance (effect).' },
    { skill: 'cause', text: 'The town planted hundreds of trees along Main Street. Now the street is cooler in summer, and more birds nest there.', q: 'What caused Main Street to become cooler?', choices: ['More birds came.', 'The town planted trees.', 'It rained more.', 'Cars drove slower.'], answer: 1, why: 'The trees (cause) made the street cooler and gave birds homes (effects).' },
    { skill: 'cause', text: 'Since the class collected the most cans in the food drive, they won an extra recess.', q: 'Why did the class win an extra recess?', choices: ['They behaved well.', 'They collected the most cans.', 'It was a holiday.', 'They finished their work early.'], answer: 1, why: '"Since" tells the cause: they collected the most cans.' },
    { skill: 'infer', text: 'Jada stared at the empty seat on the bus where her best friend always sat. She sighed and looked out the window the whole ride.', q: 'How is Jada MOST LIKELY feeling?', choices: ['Excited', 'Lonely', 'Angry', 'Silly'], answer: 1, why: 'Staring at her friend\'s empty seat and sighing are clues that she feels lonely.', clue: { choices: ['stared at the empty seat', 'on the bus', 'the window'], answer: 0 } },
    { skill: 'infer', text: 'Mr. Okafor wiped the sweat from his forehead, set down his shovel, and took a long drink of water.', q: 'What can you infer about Mr. Okafor?', choices: ['He has been working hard.', 'He just woke up.', 'He is cold.', 'He is at the movies.'], answer: 0, why: 'Sweat, a shovel and a long drink show he has been working hard.', clue: { choices: ['wiped the sweat from his forehead', 'Mr. Okafor', 'set down'], answer: 0 } },
    { skill: 'infer', text: 'When Leo opened the front door, the house smelled like cinnamon and warm apples. A pie cooled on the counter.', q: 'What has someone in the house been doing?', choices: ['Painting', 'Baking', 'Cleaning', 'Sleeping'], answer: 1, why: 'The smell and the cooling pie show someone has been baking.', clue: { choices: ['A pie cooled on the counter', 'opened the front door', 'the house'], answer: 0 } },
    { skill: 'infer', text: 'The team walked off the field with their heads down. Nobody said a word on the ride home.', q: 'What MOST LIKELY happened in the game?', choices: ['The team won easily.', 'The team lost.', 'The game was canceled.', 'It was a practice.'], answer: 1, why: 'Heads down and silence are clues the team lost.', clue: { choices: ['with their heads down', 'walked off the field', 'the ride home'], answer: 0 } },
    { skill: 'infer', text: 'Sofia read the last page, closed the book, and hugged it to her chest. Then she ran to the library to find the next book in the series.', q: 'What can you infer about Sofia?', choices: ['She did not like the book.', 'She loved the book.', 'She has to return the book.', 'She was confused by the ending.'], answer: 1, why: 'Hugging the book and rushing to find the next one show she loved it.', clue: { choices: ['ran to the library to find the next book', 'read the last page', 'closed the book'], answer: 0 } },
    { skill: 'infer', text: 'The substitute teacher looked at the seating chart, then at the class, then back at the chart. "Is there really someone named Mister Fluffypants here?" she asked. Several students giggled.', q: 'What MOST LIKELY happened?', choices: ['A new student joined the class.', 'Students played a trick by writing a fake name on the chart.', 'The teacher forgot her glasses.', 'The class had a pet.'], answer: 1, why: 'A silly name and giggling students are clues that someone pranked the seating chart.', clue: { choices: ['Several students giggled', 'looked at the seating chart', 'the substitute teacher'], answer: 0 } },
    { skill: 'infer', text: 'When Mom saw the muddy paw prints across the clean kitchen floor, she called out, "Rocket! Come here right now!" A tail disappeared behind the couch.', q: 'Who is Rocket?', choices: ['Mom\'s son', 'The family dog', 'A neighbor', 'A cat from next door'], answer: 1, why: 'Paw prints and a disappearing tail show Rocket is the family\'s dog.', clue: { choices: ['muddy paw prints', 'the clean kitchen floor', 'she called out'], answer: 0 } },
    { skill: 'infer', text: 'Mr. Park kept glancing at the trophy case as he walked his new students down the hall. "My team won that the year I started coaching," he said, then cleared his throat and walked a little faster.', q: 'How does Mr. Park MOST LIKELY feel about the trophy?', choices: ['Embarrassed by it', 'Proud of it', 'Angry about it', 'He doesn\'t care about it'], answer: 1, why: 'He keeps glancing at it and mentions his team won it. Walking faster suggests he doesn\'t want to brag.', clue: { choices: ['kept glancing at the trophy case', 'his new students', 'down the hall'], answer: 0 } },
    { skill: 'factop', text: 'The Pacific Ocean is the largest ocean on Earth.', q: 'Is this a fact or an opinion?', choices: ['Fact', 'Opinion'], answer: 0, why: 'This can be proven by measuring the oceans.' },
    { skill: 'factop', text: 'Summer is the best season of the year.', q: 'Is this a fact or an opinion?', choices: ['Fact', 'Opinion'], answer: 1, why: '"Best" tells what someone thinks. Others may disagree.' },
    { skill: 'factop', text: 'Everyone should learn to play a musical instrument.', q: 'Is this a fact or an opinion?', choices: ['Fact', 'Opinion'], answer: 1, why: '"Should" shows a belief, not something that can be proven.' },
    { skill: 'factop', text: 'Water freezes at 32 degrees Fahrenheit.', q: 'Is this a fact or an opinion?', choices: ['Fact', 'Opinion'], answer: 0, why: 'This can be tested and proven with a thermometer.' },
    { skill: 'context', text: 'The hikers were exhausted after climbing the steep mountain all day. They could barely lift their feet.', q: 'What does "exhausted" mean?', choices: ['Excited', 'Very tired', 'Lost', 'Hungry'], answer: 1, why: 'They could barely lift their feet, so they were very tired.' },
    { skill: 'context', text: 'The museum displayed ancient tools, some more than 5,000 years old.', q: 'What does "ancient" mean?', choices: ['Brand new', 'Very old', 'Broken', 'Expensive'], answer: 1, why: '"More than 5,000 years old" explains that ancient means very old.' },
    { skill: 'context', text: 'Unlike his talkative sister, Omar was reserved and rarely spoke in class.', q: 'What does "reserved" mean?', choices: ['Quiet and shy', 'Loud and silly', 'Very smart', 'Often late'], answer: 0, why: '"Unlike his talkative sister" and "rarely spoke" show he is quiet.' },
    { skill: 'context', text: 'The fragile vase shattered into pieces when it tipped off the shelf.', q: 'What does "fragile" mean?', choices: ['Heavy', 'Easily broken', 'Colorful', 'Large'], answer: 1, why: 'It shattered from a small fall, so it breaks easily.' },
  ],

  /* =============================== 6–8 =============================== */
  68: [
    { skill: 'wh', text: 'In 1955, Rosa Parks refused to give up her seat on a Montgomery, Alabama, bus. Her arrest sparked a citywide bus boycott that lasted more than a year.', q: 'In which city did Rosa Parks refuse to give up her seat?', choices: ['Atlanta', 'Montgomery', 'Birmingham', 'Memphis'], answer: 1, why: 'The text names "a Montgomery, Alabama, bus."' },
    { skill: 'wh', text: 'The Great Barrier Reef, off the coast of Australia, is the largest coral reef system in the world. It can even be seen from space.', q: 'Where is the Great Barrier Reef?', choices: ['Off the coast of Australia', 'In the Caribbean', 'Near Hawaii', 'In the Arctic'], answer: 0, why: '"Off the coast of Australia."' },
    { skill: 'wh', text: 'Marie Curie was the first person to win two Nobel Prizes, one in physics in 1903 and one in chemistry in 1911.', q: 'What makes Marie Curie\'s achievement unique, according to the text?', choices: ['She invented the telephone.', 'She was the first person to win two Nobel Prizes.', 'She discovered gravity.', 'She was a famous painter.'], answer: 1, why: 'She was "the first person to win two Nobel Prizes."' },
    { skill: 'wh', text: 'During the drought, the city limited lawn watering to two days a week to protect its shrinking reservoir.', q: 'Why did the city limit lawn watering?', choices: ['To save money on mowing', 'To protect its shrinking reservoir', 'Because of a flood', 'To grow more grass'], answer: 1, why: 'The purpose was "to protect its shrinking reservoir."' },
    { skill: 'main', text: 'Many inventions came from accidents. Penicillin was discovered when mold contaminated a scientist\'s experiment. The microwave oven was invented after a radar engineer noticed a candy bar melting in his pocket. Even the sticky note began as a failed attempt to make a strong glue.', q: 'Which statement BEST expresses the central idea?', choices: ['Penicillin is made from mold.', 'Some important inventions were discovered by accident.', 'Engineers often eat candy at work.', 'Glue is hard to make.'], answer: 1, why: 'Each example supports the idea that accidents led to inventions.' },
    { skill: 'main', text: 'Urban gardens do more than grow vegetables. They give city residents access to fresh food, create shared spaces where neighbors meet, and help cool down blocks covered in concrete.', q: 'What is the central idea of the paragraph?', choices: ['Concrete gets hot.', 'Urban gardens benefit cities in several ways.', 'Vegetables are healthy.', 'Neighbors should talk more.'], answer: 1, why: 'Fresh food, gathering spaces and cooling are all benefits of urban gardens.' },
    { skill: 'main', text: 'Sleep, exercise and nutrition all affect how well students learn. Students who sleep enough remember more of what they study. Regular exercise improves focus, and a healthy breakfast gives the brain energy for the morning.', q: 'Which sentence states the central idea?', choices: ['Sleep, exercise and nutrition all affect how well students learn.', 'Regular exercise improves focus.', 'A healthy breakfast gives the brain energy.', 'Students who sleep enough remember more.'], answer: 0, why: 'The first sentence states the idea that the rest of the paragraph supports.' },
    { skill: 'main', text: 'Honeybees communicate through a "waggle dance." By moving in a figure-eight pattern and shaking their bodies, they tell other bees the direction and distance of flowers.', q: 'What is this paragraph mainly about?', choices: ['Why flowers bloom', 'How honeybees share information about food', 'How to dance a figure eight', 'Where bees build hives'], answer: 1, why: 'The waggle dance is how bees communicate where food is.' },
    { skill: 'sequence', text: 'The bill was first introduced in the House of Representatives. After committee review, the House voted to pass it. It then moved to the Senate, which approved it with changes. Finally, the President signed it into law.', q: 'Put the steps in order.', items: ['The bill is introduced in the House.', 'The House passes the bill.', 'The Senate approves it.', 'The President signs it into law.'], why: 'First, after, then and finally show how a bill becomes law.' },
    { skill: 'sequence', q: 'Put the steps of the scientific method in order.', items: ['Ask a question.', 'Form a hypothesis.', 'Test it with an experiment.', 'Draw a conclusion.'], why: 'Scientists question, predict, test and then conclude.' },
    { skill: 'sequence', text: 'Years before she became a famous author, Elena wrote stories in a notebook she hid under her bed. In high school, she won a county writing contest. After college, she sent her first novel to forty publishers. The forty-first said yes.', q: 'Put the events of Elena\'s life in order.', items: ['She hid stories under her bed.', 'She won a county writing contest.', 'She sent her novel to forty publishers.', 'A publisher accepted her novel.'], why: 'The time clues years before, in high school, after college and the forty-first show the order.' },
    { skill: 'sequence', q: 'Put the events of the American Revolution era in order.', items: ['The Boston Tea Party (1773)', 'The Declaration of Independence (1776)', 'The British surrender at Yorktown (1781)', 'The U.S. Constitution is signed (1787)'], why: 'The dates show the order: 1773, 1776, 1781, 1787.' },
    { skill: 'cause', text: 'As sea ice in the Arctic melts earlier each spring, polar bears have less time to hunt seals from the ice. As a result, many bears are thinner when summer begins.', q: 'What effect does earlier melting ice have on polar bears?', choices: ['They grow larger.', 'They have less time to hunt and become thinner.', 'They move to the desert.', 'They eat more fish.'], answer: 1, why: '"As a result" signals the effect: less hunting time and thinner bears.' },
    { skill: 'cause', text: 'When the factory upstream began releasing chemicals into the river, fish populations downstream dropped sharply, and the town\'s fishing businesses struggled.', q: 'What was the cause of the falling fish population?', choices: ['Overfishing by tourists', 'Chemicals released by the factory', 'A cold winter', 'A new dam'], answer: 1, why: 'The factory\'s chemicals came first and led to the drop in fish.' },
    { skill: 'cause', text: 'The invention of the cotton gin made cleaning cotton much faster. Consequently, planters grew far more cotton, and the demand for enslaved labor in the South increased.', q: 'According to the text, what was one effect of the cotton gin?', choices: ['Less cotton was grown.', 'Demand for enslaved labor increased.', 'Cotton became illegal.', 'Factories closed.'], answer: 1, why: '"Consequently" introduces the effects: more cotton and more demand for enslaved labor.' },
    { skill: 'cause', text: 'Because the school added a later start time, students reported getting more sleep, and attendance at first period rose.', q: 'What caused first-period attendance to rise?', choices: ['A later start time', 'Shorter classes', 'New teachers', 'Free breakfast'], answer: 0, why: '"Because" points to the cause: the later start time.' },
    { skill: 'infer', text: 'Daniel checked his phone for the fifth time in ten minutes. He tapped his foot, glanced at the door, and read the same page of his book three times without turning it.', q: 'What can you infer about Daniel?', choices: ['He is calm and relaxed.', 'He is anxiously waiting for something.', 'He is enjoying his book.', 'He is about to fall asleep.'], answer: 1, why: 'Checking his phone, foot tapping and not focusing on the book suggest anxious waiting.', clue: { choices: ['checked his phone for the fifth time', 'his book', 'the door'], answer: 0 } },
    { skill: 'infer', text: 'The once-busy shopping mall had dusty windows and a parking lot with grass growing through the cracks. Only one store still had its lights on.', q: 'What can the reader infer about the mall?', choices: ['It just opened.', 'Most stores have closed and few people visit.', 'It is being cleaned.', 'It is the busiest mall in town.'], answer: 1, why: 'Dusty windows, an overgrown lot and one lit store suggest the mall is mostly abandoned.', clue: { choices: ['grass growing through the cracks', 'shopping mall', 'one store'], answer: 0 } },
    { skill: 'infer', text: '"Nice job," Coach said flatly, without looking up from his clipboard, after Mia dropped the third pass in a row.', q: 'What does Coach MOST LIKELY mean?', choices: ['He is truly impressed.', 'He is being sarcastic and is disappointed.', 'He didn\'t see the play.', 'He wants Mia to be captain.'], answer: 1, why: 'Saying it flatly after three dropped passes shows sarcasm.', clue: { choices: ['said flatly, without looking up', 'Nice job', 'clipboard'], answer: 0 } },
    { skill: 'infer', text: 'Grandpa smiled as he unfolded the yellowed letter. His hands trembled slightly, and he read it twice before setting it gently on the table.', q: 'What can you infer about the letter?', choices: ['It is a bill.', 'It is old and means a lot to Grandpa.', 'It is junk mail.', 'It made Grandpa angry.'], answer: 1, why: 'Yellowed paper shows age; his smile, trembling hands and careful handling show it matters to him.', clue: { choices: ['His hands trembled slightly', 'unfolded', 'on the table'], answer: 0 } },
    { skill: 'infer', text: 'Kenji\'s essay came back covered in red ink. He folded it in half without reading the comments, shoved it deep into his backpack, and spent lunch alone in the library.', q: 'What can you infer about Kenji\'s reaction?', choices: ['He is proud of his grade.', 'He is discouraged and wants to avoid thinking about it.', 'He plans to frame the essay.', 'He is excited to fix it right away.'], answer: 1, why: 'Hiding the essay unread and isolating himself show discouragement.', clue: { choices: ['shoved it deep into his backpack', 'came back', 'the library'], answer: 0 } },
    { skill: 'infer', text: 'The interview candidate arrived twenty minutes early, carrying three printed copies of her résumé and a notebook filled with questions about the company.', q: 'What can you infer about the candidate?', choices: ['She is unprepared.', 'She is serious and well-prepared.', 'She does not want the job.', 'She is lost.'], answer: 1, why: 'Arriving early with copies and questions shows serious preparation.', clue: { choices: ['a notebook filled with questions about the company', 'The interview candidate', 'arrived'], answer: 0 } },
    { skill: 'infer', text: 'By the third week of the hunger strike, the prisoners\' demands for clean water and medical care appeared in newspapers across the country, and the governor scheduled an emergency meeting.', q: 'What can the reader infer?', choices: ['The strike was ignored.', 'Public attention pressured officials to respond.', 'The prisoners had plenty of water.', 'The governor was on vacation.'], answer: 1, why: 'National news coverage followed by an emergency meeting suggests public pressure forced a response.', clue: { choices: ['appeared in newspapers across the country', 'the third week', 'clean water'], answer: 0 } },
    { skill: 'infer', text: '"Take all the time you need," the librarian said, glancing at the clock for the third time as she jingled her keys by the door.', q: 'What does the librarian MOST LIKELY want?', choices: ['For the student to stay longer', 'To close the library soon', 'To find a book', 'To start a conversation'], answer: 1, why: 'Her words say one thing, but her actions (watching the clock, jingling keys by the door) show she wants to leave.', clue: { choices: ['jingled her keys by the door', 'Take all the time you need', 'the librarian said'], answer: 0 } },
    { skill: 'factop', text: 'Electric cars produce no tailpipe emissions.', q: 'Is this a fact or an opinion?', choices: ['Fact', 'Opinion'], answer: 0, why: 'It can be verified: electric cars have no tailpipe.' },
    { skill: 'factop', text: 'Social media has done more harm than good for teenagers.', q: 'Is this a fact or an opinion?', choices: ['Fact', 'Opinion'], answer: 1, why: 'It is a judgment people argue about. It can be supported but not proven.' },
    { skill: 'factop', text: 'The Declaration of Independence was adopted on July 4, 1776.', q: 'Is this a fact or an opinion?', choices: ['Fact', 'Opinion'], answer: 0, why: 'Historical records prove this date.' },
    { skill: 'factop', text: 'The most inspiring speech in American history is Dr. King\'s "I Have a Dream."', q: 'Is this a fact or an opinion?', choices: ['Fact', 'Opinion'], answer: 1, why: '"Most inspiring" is a personal judgment.' },
    { skill: 'context', text: 'The senator\'s speech was so verbose that many listeners lost interest long before she reached her point.', q: 'What does "verbose" mean?', choices: ['Using more words than needed', 'Very short', 'Very funny', 'Hard to hear'], answer: 0, why: 'Listeners lost interest before she reached her point, so she used too many words.' },
    { skill: 'context', text: 'Despite the team\'s many setbacks, the captain remained optimistic, always insisting they would win the next game.', q: 'What does "optimistic" mean?', choices: ['Hopeful about the future', 'Angry and upset', 'Tired and bored', 'Confused'], answer: 0, why: 'Insisting they would win despite setbacks shows hopefulness.' },
    { skill: 'context', text: 'The ruins were so dilapidated that the roof had caved in and vines covered the crumbling walls.', q: 'What does "dilapidated" mean?', choices: ['Newly built', 'In a state of ruin and disrepair', 'Brightly painted', 'Crowded with people'], answer: 1, why: 'A caved-in roof and crumbling walls show disrepair.' },
    { skill: 'context', text: 'The scientist was meticulous, checking every measurement three times and labeling each sample with care.', q: 'What does "meticulous" mean?', choices: ['Careless', 'Extremely careful and precise', 'Very fast', 'Forgetful'], answer: 1, why: 'Triple-checking and careful labeling show great precision.' },
  ],
};

/* ===================================================================
   Helpers + one shared exercise player (same look on every page)
   =================================================================== */
const Comprehension = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  function bandFor(grade) {
    const g = String(grade).toUpperCase();
    if (['K', '1', '2'].includes(g)) return 'k2';
    if (['3', '4', '5'].includes(g)) return '35';
    return '68';
  }

  /** Skills available in a band (K–2 practises Real or Make-Believe instead of Fact or Opinion) */
  function skillsFor(band) {
    return [...new Set(COMP_ITEMS[band].map(i => i.skill))];
  }

  /** n exercises, spread across skills (or only `skill`), in random order */
  function pick(band, n, skill = null) {
    const pool = COMP_ITEMS[band].filter(i => !skill || i.skill === skill);
    if (skill) return shuffle([...pool]).slice(0, n);
    // Round-robin across skills so a short set still mixes them
    const bySkill = {};
    for (const it of shuffle([...pool])) (bySkill[it.skill] ||= []).push(it);
    const order = shuffle(Object.keys(bySkill));
    const out = [];
    while (out.length < n && order.some(s => bySkill[s].length)) {
      for (const s of order) if (bySkill[s].length && out.length < n) out.push(bySkill[s].pop());
    }
    return out;
  }

  /** The drill skill that practises a Story Check skill area */
  function drillFor(storySkill, band) {
    return skillsFor(band).find(s => COMP_SKILLS[s].storySkill === storySkill) || 'main';
  }

  /**
   * Render one exercise into `el`.
   *   speak(text)     optional read-aloud function
   *   onDone(ok)      called after the Next button; ok = right on the first try
   *   nextLabel       text for the Next button
   *   older           calmer wording for older readers
   */
  function render(el, item, { speak, onDone, nextLabel = 'Next →', older = false } = {}) {
    const skill = COMP_SKILLS[item.skill];
    el.cqItem = item;   // lets a page (or a test) see which exercise is showing
    let firstTry = true;
    let done = false;
    const say = speak || (() => {});
    const readAll = () => say([item.text, item.q, ...(item.choices || item.items || [])].filter(Boolean).join('. '));

    el.innerHTML = `
      <div class="cq">
        <div class="cq-skill"><span>${skill.icon} ${skill.name}</span>
          ${speak ? '<button type="button" class="cq-say" aria-label="Read aloud">🔊</button>' : ''}</div>
        ${item.text ? `<div class="cq-text">${esc(item.text)}</div>` : ''}
        <p class="cq-q">${esc(item.q)}</p>
        <div class="cq-body"></div>
        <div class="cq-feedback" role="status"></div>
      </div>`;
    el.querySelector('.cq-say')?.addEventListener('click', readAll);
    const body = el.querySelector('.cq-body');
    const fb = el.querySelector('.cq-feedback');

    function finish(ok) {
      done = true;
      fb.innerHTML = `<div class="cq-result ${ok ? 'right' : 'wrong'}">
          <b>${ok ? (older ? '✅ Correct.' : '🎉 Correct!') : (older ? 'Here\'s the answer.' : 'Good try! Here\'s the answer.')}</b>
          <p>💡 ${esc(item.why)}</p>
          <p class="cq-tip">${skill.icon} <i>${esc(skill.tip)}</i></p>
        </div>
        <button type="button" class="next-btn cq-next">${esc(nextLabel)}</button>`;
      fb.querySelector('.cq-next').addEventListener('click', () => onDone?.(ok));
      fb.querySelector('.cq-next').focus();
    }

    /* Inference = clues + what you know. After the inference, find the clue that proves it. */
    function askClue() {
      fb.innerHTML = '';
      const order = shuffle(item.clue.choices.map((_, i) => i));
      let clueFirst = true;
      const part = document.createElement('div');
      part.className = 'cq-clue';
      part.innerHTML = `<p class="cq-q">🕵️ Detective check: Which clue from the text helped you figure it out?</p>
        <div class="cq-choices">${order.map(i =>
          `<button type="button" class="cq-choice" data-c="${i}"><span class="cq-letter">🔎</span><span>"${esc(item.clue.choices[i])}"</span></button>`).join('')}</div>`;
      body.appendChild(part);
      say('Detective check. Which clue from the text helped you figure it out?');
      part.querySelectorAll('.cq-choice').forEach(b => b.addEventListener('click', () => {
        const c = +b.dataset.c;
        if (c === item.clue.answer) {
          b.classList.add('right');
          part.querySelectorAll('.cq-choice').forEach(x => { x.disabled = true; });
          // Light up the clue inside the text
          const textEl = el.querySelector('.cq-text');
          const clueText = item.clue.choices[item.clue.answer];
          const at = item.text.indexOf(clueText);
          if (textEl && at >= 0) {
            textEl.innerHTML = esc(item.text.slice(0, at)) + `<mark class="cq-clue-mark">${esc(clueText)}</mark>` + esc(item.text.slice(at + clueText.length));
          }
          finish(firstTry && clueFirst);
        } else {
          clueFirst = false;
          b.classList.add('wrong');
          b.disabled = true;
          fb.innerHTML = '<p class="cq-retry">That\'s in the text, but it doesn\'t prove the answer. Which words are the real clue?</p>';
        }
      }));
      part.querySelector('.cq-choice').focus();
    }

    if (item.choices) {
      body.innerHTML = `<div class="cq-choices ${item.choices.length === 2 ? 'two' : ''}">${item.choices.map((c, i) =>
        `<button type="button" class="cq-choice" data-i="${i}"><span class="cq-letter">${String.fromCharCode(65 + i)}</span><span>${esc(c)}</span></button>`).join('')}</div>`;
      body.querySelectorAll('.cq-choice').forEach(b => b.addEventListener('click', () => {
        if (done) return;
        const i = +b.dataset.i;
        if (i === item.answer) {
          b.classList.add('right');
          body.querySelectorAll('.cq-choice').forEach(x => { x.disabled = true; });
          say(b.textContent.slice(1));
          if (item.clue) askClue(); else finish(firstTry);
        } else {
          firstTry = false;
          b.classList.add('wrong');
          b.disabled = true;
          fb.innerHTML = `<p class="cq-retry">${older ? 'Not quite. Look back at the text and try again.' : 'Not quite! Read it again and try another answer.'}</p>`;
        }
      }));
    } else {
      // Ordering: tap items in order (no dragging), tap again to undo
      const shown = shuffle(item.items.map((_, i) => i));
      if (shown.every((v, i) => v === i) && shown.length > 1) shown.reverse();
      let picked = [];
      const paint = () => {
        body.innerHTML = `<p class="cq-hint">Tap them in order: first, next… Tap again to undo.</p>
          <div class="cq-order">${shown.map(i => {
            const pos = picked.indexOf(i);
            return `<button type="button" class="cq-order-item ${pos >= 0 ? 'picked' : ''}" data-i="${i}" ${done ? 'disabled' : ''}>
              <span class="cq-num">${pos >= 0 ? pos + 1 : ''}</span><span>${esc(item.items[i])}</span></button>`;
          }).join('')}</div>
          ${done ? '' : `<button type="button" class="btn-primary cq-check" ${picked.length === item.items.length ? '' : 'disabled'}>✔ Check order</button>`}`;
        body.querySelectorAll('.cq-order-item').forEach(b => b.addEventListener('click', () => {
          const i = +b.dataset.i;
          picked = picked.includes(i) ? picked.slice(0, picked.indexOf(i)) : [...picked, i];
          paint();
        }));
        body.querySelector('.cq-check')?.addEventListener('click', () => {
          const ok = picked.every((v, k) => v === k);
          if (ok) { done = true; paint(); body.querySelectorAll('.cq-order-item').forEach(b => b.classList.add('right')); finish(firstTry); }
          else {
            firstTry = false;
            // Keep the correct start, give back the rest
            let keep = 0;
            while (keep < picked.length && picked[keep] === keep) keep++;
            picked = picked.slice(0, keep);
            paint();
            fb.innerHTML = `<p class="cq-retry">${keep ? `The first ${keep} ${keep === 1 ? 'is' : 'are'} right. ` : ''}Look for clue words like first, then and finally, and try again.</p>`;
          }
        });
      };
      paint();
    }
  }

  return { bandFor, skillsFor, pick, drillFor, render };
})();
