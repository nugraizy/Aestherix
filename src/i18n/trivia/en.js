export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Invalid arguments.',
		noActiveGame: 'No trivia game active. Create one with *{prefix}trivia new*',
		gameAlreadyActive: 'A trivia game is already active in this group.',
		gameAlreadyStarted: 'Game already started.',
		alreadyJoined: 'Already joined.',
		needPlayers: 'Need at least 1 player to start.',
		notInGame: 'Not in the game.',
		alreadyAnswered: 'Already answered this question.',
		noActiveQuestion: 'No active question.',
		hostCannotLeave: 'Host cannot leave. Delete the game instead.',
		cannotLeaveDuringGame: 'Cannot leave during game.',
		onlyHostStart: 'Only the host can start the game.',
		onlyHostStop: 'Only the host can stop the game.',
		onlyHostDelete: 'Only the host can delete the game.',
		invalidAnswer: 'Invalid answer. Use 1-4 or a-d.',
		provideAnswer: 'Please provide an answer (1-4 or a-d).',
		questionChanged: 'This question has already ended. Wait for the next one!'
	},
	game: {
		title: '*TRIVIA QUIZ*',
		created: '{0} created a trivia game!',
		joined: '{0} joined!',
		players: '*Players:* {0}',
		questions: '*Questions:* {0}',
		categories: '*Categories:*',
		startCategory: 'Or start with a specific category:',
		joinPrompt: 'Type *{prefix}trivia join* to join!',
		startPrompt: 'Type *{prefix}trivia start* to begin!',
		questionHeader: '*Question {0}/{1}*',
		questionHint: '💡 Reply with *{prefix}trivia <1-4>* or *{prefix}trivia a/b/c/d*',
		correct: '✅ Correct! +{0} pts',
		streak: '🔥 {0} streak!',
		time: '⏱️ {0}s',
		wrong: '❌ Wrong! The answer was: *{0}*',
		timeUp: "⏰ Time's up! The answer was: *{0}*",
		gameDeleted: 'Trivia game deleted.',
		gameEnded: '*TRIVIA QUIZ - ENDED*',
		results: '*TRIVIA QUIZ - RESULTS*',
		scoreboard: '*TRIVIA SCOREBOARD*',
		categoriesTitle: '*TRIVIA CATEGORIES*',
		questionsCount: '{0} questions',
		leaderboardEntry: '{0} - {1} pts ({2}/{3})',
		duration: '⏱️ Duration: {0}',
		noGameActive: 'No trivia game active.',
		hostOnly: 'Only the host can start the game.'
	},
	info: {
		title: '*TRIVIA QUIZ*',
		description:
			'Answer questions correctly to earn points! Faster answers earn bonus points. Build streaks for extra bonuses!',
		commands: '*Commands:*',
		newGame: '• *{prefix}trivia new* — Create a new game',
		joinGame: '• *{prefix}trivia join* — Join the game',
		startGame: '• *{prefix}trivia start* — Start the game (host only)',
		startCategory: '• *{prefix}trivia start <category>* — Start with specific category',
		answer: '• *{prefix}trivia <1-4>* or *{prefix}trivia a-d* — Answer question',
		scores: '• *{prefix}trivia scores* — Show scoreboard',
		categories: '• *{prefix}trivia categories* — List categories',
		stopGame: '• *{prefix}trivia stop* — End game early (host only)',
		deleteGame: '• *{prefix}trivia del* — Delete game (host only)',
		scoring: '*Scoring:*',
		basePoints: '• Base: 100 points per correct answer',
		timeBonus: '• Time bonus: Up to 150 points (faster = more)',
		streakBonus: '• Streak bonus: +5 points per consecutive correct answer',
		howToPlay: '*How to play:*',
		step1: '1. Create: *{prefix}trivia new*',
		step2: '2. Others join: *{prefix}trivia join*',
		step3: '3. Host starts: *{prefix}trivia start*',
		step4: '4. Answer quickly: *{prefix}trivia 1* or *{prefix}trivia a*'
	},
	categories: {
		SCIENCE: 'Science',
		HISTORY: 'History',
		GEOGRAPHY: 'Geography',
		ENTERTAINMENT: 'Entertainment',
		SPORTS: 'Sports',
		TECHNOLOGY: 'Technology',
		NATURE: 'Nature',
		GENERAL: 'General Knowledge',
		MYTHOLOGY: 'Mythology',
		ART: 'Art',
		VEHICLES: 'Vehicles',
		BOOKS: 'Books',
		MUSIC: 'Music',
		TELEVISION: 'Television',
		VIDEOGAMES: 'Video Games',
		BOARDGAMES: 'Board Games',
		MATHEMATICS: 'Mathematics',
		POLITICS: 'Politics',
		CELEBRITIES: 'Celebrities',
		COMICS: 'Comics',
		ANIME: 'Anime & Manga',
		CARTOONS: 'Cartoons & Animations'
	},
	questions: [
		{
			category: 'SCIENCE',
			question: 'What is the chemical symbol for water?',
			options: ['H2O', 'CO2', 'NaCl', 'O2'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'What planet is known as the Red Planet?',
			options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'What is the hardest natural substance on Earth?',
			options: ['Gold', 'Iron', 'Diamond', 'Platinum'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'What is the largest organ in the human body?',
			options: ['Heart', 'Liver', 'Brain', 'Skin'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'What gas do plants absorb from the atmosphere?',
			options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'How many bones are in the adult human body?',
			options: ['186', '206', '226', '256'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'What is the speed of light approximately?',
			options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'What element does "O" represent on the periodic table?',
			options: ['Osmium', 'Oganesson', 'Oxygen', 'Olivine'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'In what year did World War II end?',
			options: ['1943', '1944', '1945', '1946'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Who was the first President of the United States?',
			options: ['John Adams', 'Thomas Jefferson', 'George Washington', 'Benjamin Franklin'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'What ancient wonder was located in Alexandria, Egypt?',
			options: ['Hanging Gardens', 'Colossus', 'Lighthouse', 'Temple of Artemis'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'What year did the Titanic sink?',
			options: ['1910', '1911', '1912', '1913'],
			correct: 2
		},
		{
			category: 'ART',
			question: 'Who painted the Mona Lisa?',
			options: ['Pablo Picasso', 'Leonardo da Vinci', 'Claude Monet', 'Vincent van Gogh'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'What empire was ruled by Genghis Khan?',
			options: ['Ottoman', 'Roman', 'Mongol', 'Persian'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the largest continent by area?',
			options: ['Africa', 'North America', 'Europe', 'Asia'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the capital of Australia?',
			options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which river is the longest in the world?',
			options: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the smallest country in the world?',
			options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'What country has the most natural lakes?',
			options: ['United States', 'Russia', 'Canada', 'Brazil'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the tallest mountain in the world?',
			options: ['K2', 'Kangchenjunga', 'Mount Everest', 'Lhotse'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What movie features the character "Forrest Gump"?',
			options: ['Cast Away', 'Forrest Gump', 'The Green Mile', 'Saving Private Ryan'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Who wrote the Harry Potter series?',
			options: ['J.R.R. Tolkien', 'J.K. Rowling', 'George R.R. Martin', 'C.S. Lewis'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What band performed "Bohemian Rhapsody"?',
			options: ['The Beatles', 'Led Zeppelin', 'Queen', 'Pink Floyd'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What is the highest-grossing film of all time (not adjusted)?',
			options: ['Avengers: Endgame', 'Avatar', 'Titanic', 'Star Wars: The Force Awakens'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Who played Jack Sparrow in Pirates of the Caribbean?',
			options: ['Orlando Bloom', 'Johnny Depp', 'Geoffrey Rush', 'Keira Knightley'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'How many players are on a standard soccer team on the field?',
			options: ['9', '10', '11', '12'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'In what sport would you perform a slam dunk?',
			options: ['Volleyball', 'Basketball', 'Tennis', 'Badminton'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'What country hosted the 2016 Summer Olympics?',
			options: ['China', 'United Kingdom', 'Brazil', 'Japan'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'How many Grand Slam tennis tournaments are there per year?',
			options: ['2', '3', '4', '5'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'What sport uses the term "birdie"?',
			options: ['Tennis', 'Golf', 'Badminton', 'Cricket'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Who co-founded Apple Inc.?',
			options: ['Bill Gates', 'Steve Jobs', 'Mark Zuckerberg', 'Jeff Bezos'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'What does "HTTP" stand for?',
			options: [
				'HyperText Transfer Protocol',
				'High Tech Transfer Protocol',
				'HyperText Transmission Program',
				'High Transfer Text Protocol'
			],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'What year was the first iPhone released?',
			options: ['2005', '2006', '2007', '2008'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'What programming language is known as the "language of the web"?',
			options: ['Python', 'Java', 'JavaScript', 'C++'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'What does "AI" stand for?',
			options: ['Automated Intelligence', 'Artificial Intelligence', 'Advanced Integration', 'Automatic Interface'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'What is the largest mammal in the world?',
			options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'How many legs does a spider have?',
			options: ['6', '8', '10', '12'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'What is the fastest land animal?',
			options: ['Lion', 'Gazelle', 'Cheetah', 'Horse'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'What is the largest rainforest in the world?',
			options: ['Congo', 'Amazon', 'Daintree', 'Tongass'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'What animal is known as the "King of the Jungle"?',
			options: ['Tiger', 'Elephant', 'Lion', 'Bear'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'How many continents are there on Earth?',
			options: ['5', '6', '7', '8'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'What is the currency of Japan?',
			options: ['Yuan', 'Won', 'Yen', 'Ringgit'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'What color are the stars on the American flag?',
			options: ['White', 'Gold', 'Silver', 'Blue'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'How many days are in a leap year?',
			options: ['364', '365', '366', '367'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'What is the main language spoken in Brazil?',
			options: ['Spanish', 'Portuguese', 'French', 'English'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'The "Tibia" is found in which part of the body?',
			options: ['Arm', 'Hand', 'Leg', 'Head'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Which of these choices is not one of the phases of mitosis?',
			options: ['Metaphase', 'Anaphase', 'Telophase', 'Diplophase'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'What is the standard SI unit for mass?',
			options: ['Kilogram', 'Tonne', 'Pound', 'Gram'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Which of the following bones is not in the leg?',
			options: ['Radius', 'Patella', 'Tibia', 'Fibula '],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'An organism described as "heliotropic" has a tendancy to move towards which of these things?',
			options: ['Water', 'Light', 'Trees', 'Pollen'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'What is the name for the auditory illusion of a note that seems to be rising infinitely?',
			options: ['Glissandro Illusion', 'Fransen Effect', 'Shepard Tone', 'McGurck Effect'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Which is the most abundant element in the universe?',
			options: ['Helium', 'Hydrogen', 'Lithium', 'Oxygen'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Stars consist mainly of hydrogen and which other gas?',
			options: ['Oxygen', 'Argon', 'Helium', 'Nitrogen'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'How many teeth does the average adult mouth have (except for wisdom teeth)?',
			options: ['32', '36', '20', '28'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'How many planets are in our Solar System?',
			options: ['Nine', 'Eight', 'Seven', 'Ten'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Autosomal-dominant Compelling Helio-Ophthalmic Outburst syndrome is the need to do what when seeing the Sun?',
			options: ['Cough', 'Yawn', 'Sneeze', 'Hiccup'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Which Landsat Satellite failed to reach orbit?',
			options: ['Landsat 5', 'Landsat 4', 'Landsat 3', 'Landsat 6'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Which element has the highest melting point?',
			options: ['Tungsten', 'Platinum', 'Osmium', 'Carbon'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: "Alzheimer's disease primarily affects which part of the human body?",
			options: ['Lungs', 'Skin', 'Heart', 'Brain'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'What is the standard SI unit for distance?',
			options: ['Angstrom', 'Foot', 'Metre', 'Fathom'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'What is the medical term for low blood sugar?',
			options: ['Hypothyroidism', 'Hypothermia', 'Hypoxia', 'Hypoglycemia'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question:
				'What physics principle relates the net electric flux out of a closed surface to the charge enclosed by that surface?',
			options: ["Faraday's Law", "Gauss's Law", "Ampere's Law", 'Biot-Savart Law'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'What is the elemental symbol for mercury?',
			options: ['Me', 'Mc', 'Hy', 'Hg'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'When was the first mammal successfully cloned?',
			options: ['2009', '1999', '1996', '1985'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Naturally occuring uranium primarily consists of which isotope?',
			options: ['235', '238', '239', '233'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Which of the following are cells of the adaptive immune system?',
			options: ['Dendritic cells', 'Natural killer cells', 'White blood cells', 'Cytotoxic T cells'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'What does DNA stand for?',
			options: ['Deoxyribogenetic Acid', 'Deoxyribogenetic Atoms', 'Detoxic Acid', 'Deoxyribonucleic Acid'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question:
				'The Axiom of Preventive Medicine states that people with ___ risk for a disease should be screened and we should treat ___ of those people.',
			options: ['low, all', 'low, some', 'high, all', 'high, some'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'The asteroid belt is located between which two planets?',
			options: ['Jupiter and Saturn', 'Mars and Jupiter', 'Mercury and Venus', 'Earth and Mars'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'What is the powerhouse of the cell?',
			options: ['Ribosome', 'Mitochondria', 'Redbull', 'Nucleus'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'How many objects are equivalent to one mole?',
			options: ['6.002 x 10^22', '6.022 x 10^22', '6.022 x 10^23', '6.002 x 10^23'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'What is the first element on the periodic table?',
			options: ['Helium', 'Oxygen', 'Hydrogen', 'Lithium'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'The element involved in making human blood red is which of the following?',
			options: ['Copper', 'Iridium', 'Cobalt', 'Iron'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Who developed the first successful polio vaccine in the 1950s?',
			options: ['John F. Enders', 'Thomas Weller', 'Frederick Robbins', 'Jonas Salk'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Which desert is the only desert in the world where the "Saguaro" cactus grows indigenously?',
			options: ['The Gobi Desert', 'The Yuma Desert', 'The Arabian Desert', 'The Sonoran Desert'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'What is isobutylphenylpropanoic acid more commonly known as?',
			options: ['Morphine', 'Ibuprofen', 'Ketamine', 'Aspirin'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Gannymede is the largest moon of which planet?',
			options: ['Uranus', 'Neptune', 'Jupiter', 'Mars'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'In the Scoville scale, what is the hottest chemical?',
			options: ['Capsaicin', 'Dihydrocapsaicin', 'Tinyatoxin', 'Resiniferatoxin'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'What does the term "isolation" refer to in microbiology?',
			options: [
				'A lack of nutrition in microenviroments',
				'The nitrogen level in soil',
				'Testing effects of certain microorganisms in an isolated enviroments, such as caves',
				'The separation of a strain from a natural, mixed population of living microbes'
			],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'What is the chemical formula for ammonia?',
			options: ['CO2', 'NH3', 'NO3', 'CH4'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'How many officially recognized dwarf planets in the solar system are named after Polynesian deities?',
			options: ['0', '1', '5', '2'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Which Swiss psychologist is synonymous with the concepts of introvert and extrovert personalities?',
			options: ['Jean Piaget', 'Carl Jung', 'Alice Miller', 'Hermann Rorschach'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'What is the most potent toxin known?',
			options: ['Ricin', 'Botulinum toxin', 'Cyanide', 'Asbestos'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'What is the scientific name for the extinct hominin known as "Lucy"?',
			options: [
				'Australopithecus Africanus',
				'Australopithecus Afarensis',
				'Australopithecus Architeuthis',
				'Australopithecus Antaris'
			],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Which of these is a stop codon in DNA?',
			options: ['ACT', 'ACA', 'GTA', 'TAA'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: "A comet's gaseous envelope (which creates the tail) is called what?",
			options: ['The wake', 'The coma', 'The backwash', 'The ablative'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'How many planets make up our Solar System?',
			options: ['7', '9', '8', '6'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'The human heart has how many chambers?',
			options: ['2', '6', '3', '4'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Dry ice is the solid form of what substance?',
			options: ['Carbon dioxide', 'Nitrogen', 'Ammonia', 'Oxygen'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'How many hearts does an octopus have?',
			options: ['Three', 'One', 'Two', 'Four'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'What name is given to all baby marsupials?',
			options: ['Calf', 'Pup', 'Joey', 'Cub'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'What is "Stenoma"?',
			options: ['A combat stimulant from WW2', 'A genus of moths', 'A type of seasoning', 'A port city in the carribean'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'What produces the green colour of most plant leaves?',
			options: ['Light refraction', 'Natural pigments', 'Chlorophyll', 'UV radiation'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'The medical condition osteoporosis affects which part of the body?',
			options: ['Skin', 'Brain', 'Bones', 'Heart'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Which of these stars is the largest?',
			options: ['VY Canis Majoris', 'Betelgeuse', 'UY Scuti', 'RW Cephei'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: "How many stars are featured on New Zealand's flag?",
			options: ['4', '5', '2', '0'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the name of the capital of Turkey?',
			options: ['Istanbul', 'Izmir', 'Ankara', 'Bursa'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which US state is also known as the "Lone Star State"?',
			options: ['Alabama', 'Tennessee', 'Kentucky', 'Texas'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the Polish city known to Germans as Danzig?',
			options: ['Warsaw', 'Zakopane', 'Gdańsk', 'Poznań'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'What city is known as the Rose Capital of the World?',
			options: ['San Diego, California', 'Miami, Florida', 'Tyler, Texas', 'Anaheim, California'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'What state is the largest state of the United States of America?',
			options: ['California', 'Texas', 'Washington', 'Alaska'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'The following Spanish provinces are located in the northern area of Spain except:',
			options: ['Asturias', 'Navarre', 'León', 'Murcia'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the capital city of Bermuda?',
			options: ['Hamilton', 'Santo Dominigo', 'San Juan', 'Havana'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the official language in Liechtenstein?',
			options: ['German', 'French', 'English', 'Italian'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'What European country is not a part of the EU?',
			options: ['Lithuania', 'Ireland', 'Czechia', 'Norway'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'How many states are in Australia?',
			options: ['7', '6', '8', '5'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'The country of Belize borders which country?',
			options: ['Laos', 'Guatemala', 'Perú', 'Kenya'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: "What is the name of New Zealand's indigenous people?",
			options: ['Vikings', 'Polynesians', 'Samoans', 'Maori'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Harvard University is located in which city?',
			options: ['Cambridge', 'Providence', 'New York', 'Washington D.C.'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of the following countries does NOT recognize Armenia as an independent country?',
			options: ['Iran', 'Pakistan', 'Turkey', 'Azerbaijan'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of the following countries is an island?',
			options: ['Azerbaijan', 'Cyprus', 'El Salvador', 'Djibouti'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'In which English county is Stonehenge?',
			options: ['Wiltshire', 'Somerset', 'Cumbria', 'Herefordshire'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the most common climbing route for the second highest mountain in the world, K2?',
			options: ['Magic Line', 'Cesen Route', 'Abruzzi Spur', 'Polish Line'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'What country has a horizontal bicolor red and white flag?',
			options: ['Bahrain', 'Monaco', 'Malta', 'Liechenstein'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of these African countries list "Spanish" as an official language?',
			options: ['Guinea', 'Cameroon', 'Equatorial Guinea', 'Angola'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of these countries is NOT the only country to start with that letter of the alphabet?',
			options: ['Qatar', 'Yemen', 'Zambia', 'Oman'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which country was NOT part of the Soviet Union?',
			options: ['Romania', 'Turkmenistan', 'Belarus', 'Tajikistan'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'The longest shared border in the world can be found between which two nations?',
			options: ['Chile and Argentina', 'Russia and China', 'India and Pakistan', 'Canada and the United States'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of these is NOT a real tectonic plate?',
			options: ['North American Plate', 'Eurasian Plate', 'Atlantic Plate', 'Nazca Plate'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of these countries is the smallest by population?',
			options: ['Slovakia', 'Finland', 'Hong Kong', 'Norway'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of these Mediterranian islands is under the sovereign rule of France?',
			options: ['Majorca', 'Sardinia', 'Corsica', 'Malta'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of these American cities has fewer than 1,000,000 people?',
			options: ['Phoenix, Arizona', 'San Antonio, Texas', 'San Francisco, California', 'Philadelphia, Pennsylvania'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question:
				"Which of the following is not a megadiverse country - one that harbors a high number of the earth's endemic species?",
			options: ['Peru', 'Mexico', 'Thailand', 'South Africa'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the county seat of King County, Washington?',
			options: ['Bellevue', 'Enumclaw', 'Seattle', 'Skykomish'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'On which continent is the country of Angola located?',
			options: ['Africa', 'South America', 'Europe', 'Asia'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'What national museum will you find in Cooperstown, New York?',
			options: [
				'Metropolitan Museum of Art',
				'National Toy Hall of Fame',
				'National Baseball Hall of Fame',
				'Museum of Modern Art'
			],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the right way to spell the capital of Hungary?',
			options: ['Budapest', 'Boodapest', 'Bhudapest', 'Budapast'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which is the largest city in Morocco?',
			options: ['Casablanca', 'Rabat', 'Fes', 'Sale'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'What was the original name of Ho Chi Minh City?',
			options: ['Hanoi', 'Dar Es Salaam', 'Saigon', 'Angkor Wat'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'How many countries does the United States share a land border with?',
			options: ['1', '3', '2', '4'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'How many islands does Kuwait have?',
			options: ['3', '6', '2', '9'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'How many independent countries are there within the continent of South America?',
			options: ['8', '9', '12', '10'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: "What is Canada's smallest province?",
			options: ['New Brunswick', 'Nova Scotia', 'Yukon', 'Prince Edward Island'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of these countries is NOT located in Africa?',
			options: ['Suriname', 'Burkina Faso', 'Mozambique', 'Algeria'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which is the smallest country in the world?',
			options: ['Lesotho', 'Monaco City', 'Vatican City', 'Titania'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'What are the four corner states of the US?',
			options: [
				'Oregon, Idaho, Nevada, Utah',
				'Kansas, Oklahoma, Arkansas, Louisiana',
				'Utah, Colorado, Arizona, New Mexico',
				'South Dakota, Minnesota, Nebraska, Iowa'
			],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Where is the "Sonoran Desert" located?',
			options: ['North America', 'South America', 'Asia', 'Africa'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the name of the peninsula containing Spain and Portugal?',
			options: ['Iberian Peninsula', 'European Peninsula', 'Peloponnesian Peninsula', 'Scandinavian Peninsula'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'In Washington, D.C. what does the "C" stand for?',
			options: ['Columbia', 'Caledonia', 'Corinthia', 'City'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the largest city and commercial capital of Sri Lanka?',
			options: ['Moratuwa', 'Negombo', 'Colombo', 'Kandy'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which US state is furthest north east?',
			options: ['New York', 'Georgia', 'Maine', 'Florida'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'How many federal states does Germany have?',
			options: ['13', '32', '16', '25'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which European city has the highest mileage of canals in the world?',
			options: ['Birmingham', 'Venice', 'Amsterdam', 'Berlin'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'The land mass of modern day Turkey is called what?',
			options: ['Ismuth of Ottoma', 'Ottoma', 'Anatolia', 'Ismuth of Anatolia'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'What was the most populous city in the Americas in 2015?',
			options: ['New York', 'Mexico City', 'São Paulo', 'Los Angeles'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'What is the most common type of pitch thrown by pitchers in baseball?',
			options: ['Slowball', 'Screwball', 'Fastball', 'Palmball'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Hockey player Wayne Gretzky was born in what Canadian province?',
			options: ['British Columbia', 'Quebec', 'Alberta', 'Ontario'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Which soccer team won the Copa América 2015 Championship ?',
			options: ['Chile', 'Argentina', 'Brazil', 'Paraguay'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Josh Mansour is part of what NRL team?',
			options: ['Penrith Panthers', 'Melbourne Storm', 'Sydney Roosters', 'North Queensland Cowboys'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Which of these teams has Jaromir Jagr not played for?',
			options: ['New York Islanders', 'Calgary Flames', 'New Jersey Devils', 'Dallas Stars'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Which nation hosted the FIFA World Cup in 2006?',
			options: ['United Kingdom', 'Germany', 'Brazil', 'South Africa'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question:
				'Which football manager won more trophies than any other during his tenure at English football club Manchester United?',
			options: ['David Moyes', 'Sir Alex Ferguson', 'Louis van Gaal', 'José Mourinho'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Who won the 1998 Daytona 500?',
			options: ['John Anderson', 'Dale Earnhardt', 'Jeff Gordon', 'Michael Walltrip'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Which of these Russian cities did NOT contain a stadium that was used in the 2018 FIFA World Cup?',
			options: ['Rostov-on-Don', 'Yekaterinburg', 'Kaliningrad', 'Vladivostok'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'What is the name of the AHL affiliate of the Toronto Maple Leafs?',
			options: ['Toronto Marlies', 'Toronto Rock', 'Toronto Argonauts', 'Toronto Wolfpack'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Which of the following sports is not part of the triathlon?',
			options: ['Cycling', 'Swimming', 'Horse-Riding', 'Running'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'At which bridge does the annual Oxford and Cambridge boat race start?',
			options: ['Putney', 'Hammersmith', 'Vauxhall ', 'Battersea'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: '"Stadium of Light" is the home stadium for which soccer team?',
			options: ['Sunderland FC', 'Barcelona FC', 'Paris Saints-Germain', 'Manchester United'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'In what year did Steaua București win the European Cup, actual UEFA Champions League, against FC Barcelona?',
			options: ['1986', '1990', '1982', '1989'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'In what sport does Fanny Chmelar compete for Germany?',
			options: ['Swimming', 'Showjumping', 'Skiing', 'Gymnastics'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'How many premier league trophies did Sir Alex Ferguson win during his time at Manchester United?',
			options: ['11', '13', '20', '22'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Who won the 1994 San Marino Grand Prix, the race in which Ayrton Senna was killed?',
			options: ['Michael Schumacher', 'Nicola Larini', 'Gerhard Berger', 'Mika Häkkinen'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Who did Drew Brees pass in all time NFL passing yards in 2018?',
			options: ['Peyton Manning', 'Tom Brady', 'Dan Marino', 'Joe Montana'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Who won the 2015 Formula 1 World Championship?',
			options: ['Nico Rosberg', 'Lewis Hamilton', 'Sebastian Vettel', 'Jenson Button'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question:
				'In Baseball, how many times does the ball have to be pitched outside of the strike zone before the batter is walked?',
			options: ['1', '2', '4', '3'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Why was The Green Monster at Fenway Park was originally built?',
			options: [
				'To make getting home runs harder.',
				'To prevent viewing games from outside the park.',
				'To display advertisements.',
				'To provide extra seating.'
			],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Which soccer team won the Copa América Centenario 2016?',
			options: ['Argentina', 'Brazil', 'Chile', 'Colombia'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: "Who won the 2016 Formula 1 World Driver's Championship?",
			options: ['Nico Rosberg', 'Lewis Hamilton', 'Max Verstappen', 'Kimi Raikkonen'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'In what country were the 2014 Winter Olympics held in the town of Sochi?',
			options: ['South Korea', 'Russia', 'Norway', 'Canada'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Who is regarded as the best Romanian footballer of all time?',
			options: ['Cristian Chivu', 'Gheorghe Hagi', 'Nicolae Dobrin', 'Gheorghe Popescu'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: "Which of these track-and-field events is NOT included in the Olympic men's decathlon?",
			options: ['Pole vault', 'Long jump', 'Hammer throw', 'Shot put'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: "How many French Open's did Björn Borg win?",
			options: ['4', '9', '6', '2'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: "Which German sportswear company's logo is the 'Formstripe'?",
			options: ['Nike', 'Adidas', 'Reebok', 'Puma'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'How many times did Martina Navratilova win the Wimbledon Singles Championship?',
			options: ['Ten', 'Seven', 'Nine', 'Eight'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'What is the oldest team in the NFL?',
			options: ['Chicago Bears', 'Arizona Cardinals', 'Green Bay Packers', 'New York Giants'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Which male player won the gold medal of table tennis singles in 2016 Olympics Games?',
			options: ['Zhang Jike (China)', 'Jun Mizutani (Japan)', 'Ma Long (China)', 'Vladimir Samsonov (Belarus)'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: "Who is Manchester United's top premier league goal scorer?",
			options: ['Sir Bobby Charlton', 'Ryan Giggs', 'David Beckham', 'Wayne Rooney'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Who has played the most tournaments in the German national soccer team?',
			options: ['Miroslav Klose', 'Philipp Lahm', 'Lothar Matthäus', 'Oliver Kahn'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: "What tool lends it's name to a last-stone advantage in an end in Curling?",
			options: ['Wrench', 'Hammer', 'Drill', 'Screwdriver'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Who won the UEFA Champions League in 2016?',
			options: ['FC Bayern Munich', 'Real Madrid C.F.', 'Atletico Madrid', 'Manchester City F.C.'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Which player has scored the most goals in the England Premier League (EPL)?',
			options: ['Wayne Rooney', 'Alan Shearer', 'Lionel Messi', 'Didier Drogba'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Who did Steven Gerrard win the Champions League with?',
			options: ['Real Madrid', 'Liverpool', 'Chelsea', 'Man City'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Which Formula 1 driver switched teams in the middle of the 2017 season?',
			options: ['Carlos Sainz Jr.', 'Daniil Kvyat', 'Jolyon Palmer', 'Rio Haryanto'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Which of the following player scored a hat-trick during their Manchester United debut?',
			options: ['Wayne Rooney', 'Cristiano Ronaldo', 'Robin Van Persie', 'David Beckham'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Which of the following Grand Slam tennis tournaments occurs LAST?',
			options: ['US Open', 'French Open', 'Wimbledon', 'Australian Open'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Who won the premier league title in the 2015-2016 season following a fairy tale run?',
			options: ['Tottenham Hotspur', 'Watford', 'Stoke City', 'Leicester City'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: "Which year did Jenson Button won his first ever Formula One World Drivers' Championship?",
			options: ['2010', '2007', '2009', '2006'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'How many games did Arsenal FC go unbeaten during the 2003-2004 season of the English Premier League',
			options: ['51', '49', '22', '38'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Which basketball team has attended the most NBA grand finals?',
			options: ['Boston Celtics', 'Philadelphia 76ers', 'Golden State Warriors', 'Los Angeles Lakers'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Who won the UEFA Champions League in 2017?',
			options: ['Real Madrid C.F.', 'Atletico Madrid', 'AS Monaco FC', 'Juventus F.C.'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'In a game of snooker, what colour ball is worth 3 points?',
			options: ['Green', 'Yellow', 'Brown', 'Blue'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: "In 2016, who won the Formula 1 World Constructor's Championship for the third time in a row?",
			options: ['Scuderia Ferrari', 'McLaren Honda', 'Mercedes-AMG Petronas', 'Red Bull Racing Renault'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'In the 2014 FIFA World Cup, what was the final score in the match Brazil - Germany?',
			options: ['1-5', '1-6', '1-7', '2-6'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Which country hosted the 2022 FIFA World Cup?',
			options: ['USA', 'Qatar', 'Japan', 'Switzerland'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'The AHL affiliate team of the Boston Bruins is named what?',
			options: ['New Haven Bruins', 'Cambridge Bruins', 'Hartford Bruins', 'Providence Bruins'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'How many known living species of hyenas are there?',
			options: ['8', '2', '4', '6'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'How many teeth does an adult rabbit have?',
			options: ['30', '26', '24', '28'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'What is the collective noun for a group of crows?',
			options: ['Pack', 'Murder', 'Gaggle', 'Herd'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Which of these animals is NOT a lizard?',
			options: ['Komodo Dragon', 'Gila Monster', 'Green Iguana', 'Tuatara'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Which species is a "mountain chicken"?',
			options: ['Chicken', 'Horse', 'Fly', 'Frog'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'What is the national bird of Bahrain?',
			options: ['Bulbul', 'Hummingbird', 'Falcon', 'Sparrow'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'What is the fastest  land animal?',
			options: ['Lion', 'Cheetah', "Thomson's Gazelle", 'Pronghorn Antelope'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Which species of Brown Bear is not extinct?',
			options: ['California Grizzly Bear', 'Syrian Brown Bear', 'Atlas Bear', 'Mexican Grizzly Bear'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'How many legs do butterflies have?',
			options: ['6', '2', '4', '0'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Which class of animals are newts members of?',
			options: ['Fish', 'Reptiles', 'Mammals', 'Amphibian'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: "What is the world's longest venomous snake?",
			options: ['Green Anaconda', 'Inland Taipan', 'King Cobra', 'Yellow Bellied Sea Snake'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Which of these species is not extinct?',
			options: ['Japanese sea lion', 'Tasmanian tiger', 'Komodo dragon', 'Saudi gazelle'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'What is the scientific name of the cheetah?',
			options: ['Panthera onca', 'Lynx rufus', 'Felis catus', 'Acinonyx jubatus'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'What was the name of the Ethiopian Wolf before they knew it was related to wolves?',
			options: ['Simien Jackel', 'Ethiopian Coyote', 'Amharic Fox', 'Canis Simiensis'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'What is the fastest animal?',
			options: ['Peregrine Falcon', 'Golden Eagle', 'Cheetah', 'Horsefly'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'What type of creature is a Bonobo?',
			options: ['Lion', 'Parrot', 'Wildcat', 'Ape'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: "What is the Gray Wolf's scientific name?",
			options: ['Canis Aureus', 'Canis Latrans', 'Canis Lupus', 'Canis Lupus Lycaon'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Which is the national animal of India?',
			options: ['Lion', 'Horse', 'Tiger', 'Camel'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Hippocampus is the Latin name for which marine creature?',
			options: ['Dolphin', 'Whale', 'Octopus', 'Seahorse'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'What is the collective noun for bears?',
			options: ['Drove', 'Tribe', 'Sloth', 'Husk'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Wombats are native to which Country?',
			options: ['New Zealand', 'Papua New Guinea', 'Australia', 'Palau'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: "What is the name of a rabbit's abode?",
			options: ['Burrow', 'Nest', 'Den', 'Dray'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Unlike on most salamanders, this part of a newt is flat?',
			options: ['Head', 'Teeth', 'Feet', 'Tail'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: '"Decapods" are an order of ten-footed crustaceans.  Which of these are NOT decapods?',
			options: ['Lobsters', 'Shrimp', 'Krill', 'Crabs'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'The now extinct species "Thylacine" was native to where?',
			options: ['Baluchistan, Pakistan', 'Tasmania, Australia', 'Wallachia, Romania', 'Oregon, United States'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'The Kākāpō is a large, flightless, nocturnal parrot native to which country?',
			options: ['New Zealand', 'South Africa', 'Australia', 'Madagascar'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Snakes and lizards are known to flick their tongue, this behavior is to?',
			options: ['Capture scent particles', 'Taste the sweet air', 'Threaten other species', 'Attract female mates'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Which of these is a colony of polyps and not a jellyfish?',
			options: ['Sea Wasp', 'Irukandji', 'Sea Nettle', 'Portuguese Man-of-War'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'What is the name for a male bee that comes from an unfertilized egg?',
			options: ['Soldier', 'Worker', 'Drone', 'Male'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'About how much of their body weight in food do sea otters eat every day?',
			options: ['10%', '80%', '45%', '25%'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'What is the collective noun for rats?',
			options: ['Pack', 'Race', 'Drift', 'Mischief'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: "What color is a Steller's Jay?",
			options: ['blue and grey', 'blue and black', 'blue and white', 'grey and black'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'For what reason would a spotted hyena "laugh"?',
			options: ['Excitement', 'Nervousness', 'Aggression', 'Exhaustion'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'What is the scientific name for the "Polar Bear"?',
			options: ['Polar Bear', 'Ursus Maritimus', 'Ursus Spelaeus', 'Ursus Arctos'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Chronic Wasting Disease (CWD) exclusively infects members of which family of animals?',
			options: ['Hominids', 'Felids', 'Canids', 'Cervids'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'What scientific suborder does the family Hyaenidae belong to?',
			options: ['Feliformia', 'Haplorhini', 'Caniformia', 'Ciconiiformes'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'What are the scales on all snakes and most lizards are made of?',
			options: ['Keratin', 'Ecdysis', 'Epidermis', 'Ankyloglossia'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'The dish Fugu, is made from what family of fish?',
			options: ['Bass', 'Salmon', 'Mackerel', 'Pufferfish'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'What dog breed is one of the oldest breeds of dog and has flourished since before 400 BCE.',
			options: ['Bulldogs', 'Pugs', 'Boxers', 'Chihuahua'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'By definition, where does an abyssopelagic animal live?',
			options: ['At the bottom of the ocean', 'In the desert', 'On top of a mountain', 'Inside a tree'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'To which biological phylum do all mammals, birds and reptiles belong?',
			options: ['Echinodermata', 'Annelida', 'Chordata', 'Placazoa'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'What type of animal is a natterjack?',
			options: ['Bird', 'Fish', 'Insect', 'Toad'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'What is the common term for bovine spongiform encephalopathy (BSE)?',
			options: ["Weil's disease", 'Mad Cow disease', 'Milk fever', 'Foot-and-mouth disease'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'What is the name of the family that the domestic cat is a member of?',
			options: ['Felinae', 'Felis', 'Felidae', 'Cat'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Which animal was part of an Russian domestication experiment in 1959?',
			options: ['Pigeons', 'Bears', 'Alligators', 'Foxes'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'What does "hippopotamus" mean and in what langauge?',
			options: ['River Horse (Latin)', 'Fat Pig (Greek)', 'River Horse (Greek)', 'Fat Pig (Latin)'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: "What are rhino's horn made of?",
			options: ['Bone', 'Ivory', 'Keratin', 'Skin'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Which of the following is true when alligators are behaving territorially?',
			options: [
				'Open their jaws while making a clicking noise',
				'They run full force at the threat',
				'They bellow while showing their tail and neck',
				'Slap their tails on the ground'
			],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'What colour is the female blackbird?',
			options: ['Black', 'Brown', 'White', 'Yellow'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: "What color/colour is a polar bear's skin?",
			options: ['Black', 'White', 'Pink', 'Green'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'According to Algonquian folklore, how does one transform into a Wendigo?',
			options: [
				'Participating in cannibalism.',
				'Excessive mutilation of animal corpses.',
				'Performing a ritual involving murder.',
				'Drinking the blood of many slain animals.'
			],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'This Greek mythological figure is the god/goddess of battle strategy (among other things).',
			options: ['Ares', 'Athena', 'Artemis', 'Apollo'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'The greek god Poseidon was the god of what?',
			options: ['The Sea', 'War', 'Sun', 'Fire'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Who in Greek mythology, who led the Argonauts in search of the Golden Fleece?',
			options: ['Castor', 'Daedalus', 'Jason', 'Odysseus'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question:
				'Which figure from Greek mythology traveled to the underworld to return his wife Eurydice to the land of the living?',
			options: ['Hercules', 'Perseus', 'Orpheus', 'Daedalus'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'How many heads does Cerberus have?',
			options: ['2', '1', '5', '3'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'In most traditions, who was the wife of Zeus?',
			options: ['Aphrodite', 'Hera', 'Athena', 'Hestia'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Hera is god of...',
			options: ['Agriculture', 'Marriage', 'Sea', 'War'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'In Greek mythology, Persephone must return to the underworld because she had eaten what kind of seeds?',
			options: ['Sunflower', 'Orange', 'Fig', 'Pomegranate'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Who did Hippomenes defeat in a footrace?',
			options: ['Atalanta', 'Peleus', 'Theseus', 'Jason'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'What is the name of the wildman that Gilgamesh befriends and goes on adventures with?',
			options: ['Ishtar', 'Inanna', 'Agga', 'Enkidu'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'In Norse Mythology, Baldr was killed by Loki with a magical spear made from what plant?',
			options: ['Mistletoe', "Wolf's Bane", 'Buckthorn', 'Hemlock'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: "Which of these Roman gods doesn't have a counterpart in Greek mythology?",
			options: ['Vulcan', 'Juno', 'Janus', 'Mars'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: "Who is the God Loki's son? ",
			options: ['Odin', 'Fenrir ', 'Hel', 'Sigyn'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'According to the Egyptian Myth of Osiris, who murdered Osiris?',
			options: ['Horus', 'Set', 'Ra', 'Anhur'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Which of these mythological creatures is said to be half-man and half-horse?',
			options: ['Minotaur', 'Pegasus', 'Gorgon', 'Centaur'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question:
				'The Hippogriff, not to be confused with the Griffon, is a magical creature with the front half of an eagle, and the back half of what?',
			options: ['A Dragon', 'A Horse', 'A Tiger', 'A Lion'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Who is a minor god that is protector and creator of various arts, such as cheese making and bee keeping.',
			options: ['Autonoe', 'Carme', 'Aristaeus', 'Cephisso'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: "Neptune's greek name was...",
			options: ['Ares', 'Zeus', 'Poseidon', 'Apollo'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'The ancient Roman god of war was commonly known as which of the following?',
			options: ['Jupiter', 'Juno', 'Ares', 'Mars'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Who was the King of Gods in Ancient Greek mythology?',
			options: ['Apollo', 'Hermes', 'Zeus', 'Poseidon'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'Which of the following is NOT a god in Norse Mythology.',
			options: ['Loki', 'Jens', 'Tyr', 'Snotra'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Nidhogg is a mythical creature from what mythology?',
			options: ['Egyptian', 'Norse', 'Greek', 'Hindu'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'According to Japanese folklore, what is the favorite food of the Kappa.',
			options: ['Cucumbers', 'Kabocha', 'Nasu', 'Soba'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Hel was the daughter of which Norse Mythological figure?',
			options: ['Thor', 'Loki', 'Odin', 'Balder'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'What immense structure is referred to in Norse Mythology as the Yggdrasil.',
			options: ['Mountain', 'Tree', 'Temple', 'Castle'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'In Norse Mythology, what is the name of the symbol commonly referred to as the "Tree of Life"?',
			options: ['Ymir', 'Tree of the Earth', 'Yggdrasil', "Odin's Roots"],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'What is the name of the Greek god of peaceful deaths?',
			options: ['Thanatos', 'Tartarus', 'Hades', 'Moros'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Talos, the mythical giant bronze man, was the protector of which island?',
			options: ['Sardinia', 'Crete', 'Sicily', 'Cyprus'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Who was the only god from Greece who did not get a name change in Rome?',
			options: ['Demeter', 'Zeus', 'Athena', 'Apollo'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Which of the following is not one of the Greek Fates?',
			options: ['Clotho', 'Atropos', 'Lachesis', 'Narcissus'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Who is the Egyptian god of reproduction and lettuce?',
			options: ['Menu', 'Min', 'Mut', 'Meret'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'A minotaur is half human half what?',
			options: ['Cow', 'Horse', 'Bull', 'Eagle'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'In Greek Mythology, who was the daughter of King Minos?',
			options: ['Athena', 'Ariel', 'Ariadne', 'Alana'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question:
				'Which greek god/goddess tossed a golden apple with the words "for the fairest" into the middle of the feast of the gods?',
			options: ['Hades', 'Ares', 'Artemis', 'Eris'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'What weakpoint of Achilles was expoited by the Trojan prince, Paris?',
			options: ['Neck', 'Back', 'Calf', 'Heel'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'In African mythology, Anansi is a trickster and storyteller who takes the shape of which animal?',
			options: ['Wild dog', 'Monkey', 'Spider', 'Crocodile'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'An Ankh is the Egyptian Hieroglyph for what?',
			options: ['Love', 'Life', 'Hatred', 'Poison'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'What animal did Queen Pasipahe sleep with before she gave birth to the Minotaur in Greek Mythology?',
			options: ['Bull', 'Pig', 'Ox', 'Horse'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Who was the Roman god of fire?',
			options: ['Vulcan', 'Apollo', 'Jupiter', 'Mercury'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'In Greek mythology, who is the god of wine?',
			options: ['Hephaestus', 'Demeter', 'Apollo', 'Dionysus'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'In Greek Mythology, who killed Achilles?',
			options: ['Hector', 'Helen', 'Pericles', 'Paris'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: "The Nike apparel and footwear brand takes it's name from the Greek goddess of what?",
			options: ['Courage', 'Victory', 'Strength', 'Honor'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'The Maori hold that which island nation was founded by Kupe, who discovered it under a long white cloud?',
			options: ['Vanuatu', 'New Zealand', 'Fiji', 'Hawaii'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Who is the father of Icarus, who flew too close to the sun?',
			options: ['Minos', 'Daedalus', 'Perseus', 'Zeus'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Who is the god of war in Polynesian mythology?',
			options: ['Hina', "'Oro", 'Kohara', 'Māui'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: "What mytological creatures have women's faces and vultures' bodies?",
			options: ['Mermaids', 'Harpies', 'Nymph', 'Lilith'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Which Norse God has a horse named Sleipnir?',
			options: ['Thor', 'Frigg', 'Balder', 'Odin'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'What mythology did the god "Apollo" come from?',
			options: ['Greek and Roman', 'Roman and Spanish', 'Greek and Chinese', 'Greek, Roman and Norse'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'What is the name of the first human being in Norse mythology?',
			options: ['Asmund', 'Ask', 'Ake', 'Asger'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'What car manufacturer gave away their patent for the seat-belt in the interest of saving lives?',
			options: ['Ferrari', 'Volvo', 'Ford', 'Renault'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Which car manufacturer created the "Aventador"?',
			options: ['Ferrari', 'Lamborghini', 'Pagani', 'Bugatti'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Which of these automotive brands originated in Sweden?',
			options: ['Mercedes', 'Volvo', 'Acura', 'Lincoln'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'What animal is pictured on the logo of the automobile manufacturer Porsche?',
			options: ['Bull', 'Lion', 'Horse', 'Cheetah'],
			correct: 2
		},
		{
			category: 'VEHICLES',
			question: 'The LS2 engine is how many cubic inches?',
			options: ['346', '376', '402', '364'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'The Italian automaker Lamborghini uses what animal as its logo?',
			options: ['Bull', 'Bat', 'Horse', 'Snake'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Where are the cars of the brand "Ferrari" manufactured?',
			options: ['Romania', 'Germany', 'Russia', 'Italy'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'When was Tesla founded?',
			options: ['2008', '2005', '2007', '2003'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'What model was the sports car gifted to Yuri Gagarin by the French government in 1965?',
			options: ['Matra Djet', 'Porsche 911', 'Alpine A110', 'AC Cobra'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: "What is the name of Nissan's most popular electric car?",
			options: ['Leaf', 'Tree', 'Deer', 'Roots'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Which of the following passenger jets is the longest?',
			options: ['Airbus A350-1000', 'Airbus A330-200', 'Boeing 787-10', 'Boeing 747-8'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Which car is the first mass-produced hybrid vehicle?',
			options: ['Toyota Prius', 'Chevrolet Volt', 'Honda Fit', 'Peugeot 308 R HYbrid'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'In 2014, over 6 million General Motors vehicles were recalled due to what critical flaw?',
			options: ['Malfunctioning gas pedal', 'Breaking fuel lines', 'Faulty ignition switch', 'Faulty brake pads'],
			correct: 2
		},
		{
			category: 'VEHICLES',
			question: 'The difference between the lengths of a Boeing 777-300ER and an Airbus A350-1000 is closest to:',
			options: ['1m', '10m ', '100m', '0.1m'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'The LS1 engine is how many cubic inches?',
			options: ['350', '346', '355', '360'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: "What do the 4 Rings in Audi's Logo represent?",
			options: [
				'States in which Audi makes the most sales',
				'Main cities vital to Audi',
				'Countries in which Audi makes the most sales',
				'Previously independent automobile manufacturers'
			],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Automobiles produced by Tesla Motors operate on which form of energy?',
			options: ['Electricity', 'Gasoline', 'Diesel', 'Nuclear'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question:
				'What part of an automobile engine uses lobes to open and close intake and exhaust valves, and allows an air/fuel mixture into the engine?',
			options: ['Piston', 'Drive shaft', 'Camshaft', 'Crankshaft'],
			correct: 2
		},
		{
			category: 'VEHICLES',
			question: 'Which of the following countries has officially banned the civilian use of dash cams in cars?',
			options: ['United States', 'Czechia', 'South Korea', 'Austria'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'What was the name of the first front-wheel-drive car produced by Datsun (now Nissan)?',
			options: ['Cherry', 'Sunny', 'Bluebird', 'Skyline'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Which of these car models are produced by Lamborghini?',
			options: ['Huayra', 'Aventador', '918', 'Chiron'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Which one is NOT the function of engine oil in car engines?',
			options: ['Combustion', 'Lubrication', 'Cooling', 'Reduce corrosion'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'The LS3 engine is how many cubic inches?',
			options: ['346', '376', '364', '427'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'What nickname was given to Air Canada Flight 143 after it ran out of fuel and glided to safety in 1983?',
			options: ['Gimli Microlight', 'Gimli Chaser', 'Gimli Glider', 'Gimli Superb'],
			correct: 2
		},
		{
			category: 'VEHICLES',
			question: 'Which of the following car manufacturers had a war named after it?',
			options: ['Toyota', 'Honda', 'Ford', 'Volkswagen'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'What country was the Trabant 601 manufactured in?',
			options: ['Soviet Union', 'Hungary', 'East Germany', 'France'],
			correct: 2
		},
		{
			category: 'VEHICLES',
			question: 'What was the aircraft registration for the last Concorde built?',
			options: ['F-BTSC', 'G-BOAC', 'F-BVFF', 'G-BOAF'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'During World War 2, with tank was the most fear by the allies?',
			options: ['Marder III', 'Mks Matilda II', 'PanzerKampfwagen VI Tiger ', 'PanzerKampfwagen V Panther'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Which one of the following is NOT a sub-company of the Volkswagen Group?',
			options: ['Opel', 'Porsche', 'Bugatti', 'Bentley'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Which of these cars is NOT considered one of the 5 Modern Supercars by Ferrari?',
			options: ['Enzo Ferrari', 'Testarossa', 'F40', '288 GTO'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'When was Cadillac founded?',
			options: ['1902', '1964', '1898', '1985'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'What year did the Chevrolet LUV mini truck make its debut?',
			options: ['1982', '1975', '1973', '1972'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: "Which of the following Union Pacific 'Big Boy' locomotives was restored to working order in 2019?",
			options: ['4012', '4004', '4000', '4014'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Enzo Ferrari was originally an auto racer for what manufacturer before founding his own car company?',
			options: ['Auto Union', 'Alfa Romeo', 'Mercedes Benz', 'Bentley'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Which of the following is NOT a Russian car manufacturer?',
			options: ['BYD', 'Silant', 'Dragon', 'GAZ'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Complete the following analogy: Audi is to Volkswagen as Infiniti is to ?',
			options: ['Nissan', 'Honda', 'Hyundai', 'Subaru'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: "Which Japanese company is the world's largest manufacturer of motorcycles?",
			options: ['Yamaha', 'Suzuki', 'Kawasaki', 'Honda'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'How much horsepower is produced by the SD40-2 Locomotive?',
			options: ['3,200', '2,578', '2,190', '3,000'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'What country is the Hussarya supercar, made by the car manufacturer "Arrinera", assembled in?',
			options: ['China', 'Sweden', 'Italy', 'Poland'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Which Variable Valve Timing technology is used by BMW?',
			options: ['VVT-iw', 'VANOS', 'VVEL', 'MultiAir'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'What was the first vehicle that came with air conditioning as a factory standard?',
			options: ['Tucker', 'Packard', 'Ford', 'Hudson'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Which car brand does NOT belong to General Motors?',
			options: ['Ford', 'Buick', 'Cadillac', 'Chevrolet'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'What UK Train does NOT go over 125MPH?',
			options: ['Class 43', 'Javelin', 'Pendolino', 'Sprinter'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question:
				'What kind of train was Stepney, a train on the Bluebell Railway notable for his appearance in "The Railway Series"?',
			options: ['LB&SCR E2', 'LB&SCR J1', 'LB&SCR D1', 'LB&SCR A1X'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'What are the cylinder-like parts that pump up and down within the engine?',
			options: ['Pistons', 'Leaf Springs', 'Radiators', 'ABS'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'The LS7 engine is how many cubic inches?',
			options: ['346', '427', '364', '376'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Which one of these chassis codes are used by BMW 3-series?',
			options: ['E39', 'E46', 'E85', 'F10'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Which Audi does not use Haldex based all wheel drive system?',
			options: ['Audi A8', 'Audi TT', 'Audi S3', 'Audi A3'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: "Which Italian city is home of the car manufacturer 'Fiat'?",
			options: ['Maranello', 'Turin', 'Modena', 'Rome'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Which of the following collision avoidance systems helps airplanes avoid colliding with each other?',
			options: ['GPWS', 'TCAS', 'OCAS', 'TAWS'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'What is the name of the US Navy spy ship which was attacked and captured by North Korean forces in 1968?',
			options: ['USS North Carolina', 'USS Pueblo', 'USS Constitution', 'USS Indianapolis'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Who is the creator of the soft drink, Dr. Pepper?',
			options: ['James Wellington', 'Charles Alderton', 'Johnson Hinsin', 'Boris Heviltik'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'What year was Canada founded in?',
			options: ['1867', '1798', '1859', '1668'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Which German field marshal was known as the `Desert Fox`?',
			options: ['Ernst Busch', 'Erwin Rommel', 'Wolfram Freiherr von Richthofen', 'Wilhelm List'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'When did the French Revolution begin?',
			options: ['May 05 1789', 'April 12 1789', 'April 05 1789', 'May 06 1799'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'What age was King Henry V when he died?',
			options: ['62', '35', '87', '73'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'What war did George Orwell famously volunteer for and nearly died in?',
			options: ['World War I', 'Spanish Civil War', 'World War II', 'Russian Civil War'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question:
				'The coat of arms of the King of Spain contains the arms from the monarchs of Castille, Leon, Aragon and which other former Iberian kingdom?',
			options: ['Galicia', 'Granada', 'Catalonia', 'Navarre'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'What was the bloodiest single-day battle during the American Civil War?',
			options: [
				'The Siege of Vicksburg',
				'The Battle of Gettysburg',
				'The Battles of Chancellorsville',
				'The Battle of Antietam'
			],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Which South American country fought Great Britain over the Falkland Islands in 1982?',
			options: ['Brazil', 'Argentina', 'Chile', 'Venezuela'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'In what year was the video game company Electronic Arts founded?',
			options: ['1982', '1999', '1981', '2005'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Who was the last Roman emperor in the Year of Four Emperors (69 AD)?',
			options: ['Vespasian', 'Vitellius', 'Otho', 'Galba'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'In which country was the Statue of Liberty built and exported to the United States of America?',
			options: ['France', 'Germany', 'Spain', 'England'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: "What historical event was Tchaikovsky's 1812 Overture referencing?",
			options: [
				'The Napoleonic Wars',
				'The American War of 1812',
				'The Russian Revolution',
				'The Charge of the Light Brigade (Crimean War)'
			],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Which of these countries was sea charted in 1500 by the Portuguese maritime explorations?',
			options: ['Brazil', 'India', 'Mozambique', 'Madagascar'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'In which year did the First World War begin?',
			options: ['1914', '1930', '1917', '1939'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'The term Luddite originally applied to disgruntled workers in which industry?',
			options: ['Textile', 'Farming', 'Mining', 'Ceramics'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'How long did World War II last?',
			options: ['4 years', '5 years', '6 years', '7 years'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Which of his six wives was Henry VIII married to the longest?',
			options: ['Anne Boleyn', 'Catherine of Aragon', 'Jane Seymour', 'Catherine Parr'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Which Nazi General was known as the "Desert Fox"?',
			options: ['Gerd von Rundstadt', 'Wilhelm Keitel', 'Erwin Rommel', 'Heinz Guderian '],
			correct: 2
		},
		{
			category: 'HISTORY',
			question:
				'What was the transfer of disease, crops, and people across the Atlantic shortly after the discovery of the Americas called?',
			options: ['Triangle Trade', 'Transatlantic Slave Trade', 'The Columbian Exchange', 'The Silk Road'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Which one of these was not a beach landing site in the Invasion of Normandy?',
			options: ['Gold', 'Juno', 'Sword', 'Silver'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Which Roman Emperor led the Roman Empire to reach its maximum territorial extent?',
			options: ['Julius Caesar', 'Trajan', 'Claudius', 'Constantine the Great'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'How many women joined the United States Armed Services during World War II?',
			options: ['225,000', '100,000', '500,000', '350,000'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'When did the Byzantine Empire collapse?',
			options: ['1299', '1353', '1498', '1453'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'What year was the first Pizza Hut restaurant opened?',
			options: ['1976', '1965', '1942', '1958'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'On which day did ARPANET suffer a 4 hour long network crash?',
			options: ['November 21, 1969', 'October 29, 1969', 'December 9, 1991', 'October 27, 1980'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'What was the official German currency until 2002?',
			options: ['Mark', 'Frank', 'Pound sterling', 'Reichtoken'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Which of the following ancient peoples was NOT classified as Hellenic (Greek)?',
			options: ['Dorians', 'Illyrians', 'Achaeans', 'Ionians'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'The Korean War started in what year?',
			options: ['1945', '1950', '1960', '1912'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'What year did World War I begin?',
			options: ['1905', '1919', '1914', '1925'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'What is the mnemonic device for remembering the fates of the wives of Henry VIII?',
			options: [
				'Beheaded, Died, Divorced, Divorced, Beheaded, Survived',
				'Died, Beheaded, Divorced, Beheaded, Survived, Divorced',
				'Divorced, Beheaded, Died, Divorced, Beheaded, Survived',
				'Survived, Beheaded, Died, Divorced, Divorced, Beheaded'
			],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'In which war did the atomic bombings of Hiroshima and Nagasaki occur?',
			options: ['World War I', 'Russo-Japanese War', 'World War II', 'First Sino-Japanese War'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Who was the first president born in the independent United States?',
			options: ['John Adams', 'George Washington', 'Martin Van Buren', 'James Monroe '],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'On which aircraft carrier did the Doolitte Raid launch from on April 18, 1942 during World War II?',
			options: ['USS Hornet', 'USS Enterprise', 'USS Lexington', 'USS Saratoga'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'To what political party did Abraham Lincoln belong when elected POTUS?',
			options: ['Democrat', 'Independent', 'Whig', 'Republican'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'In what year did the North American Video Game Crash occur?',
			options: ['1983', '1982', '1993', '1970'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Who was the first Chancellor of a united Germany in 1871? ',
			options: ['Kaiser Wilhelm ', 'Fredrick the 2nd', 'Robert Koch', 'Otto Von Bismark'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'What country joined the EU in 2013?',
			options: ['Bulgaria', 'Croatia', 'Slovenia', 'Turkey'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question:
				'What was the name of the African-American cultural explosion centered in upper Manhattan during the 1920s and 1930s?',
			options: ['Harlem Renaissance', 'Inwood Renaissance', 'Bed-Stuy Renaissance', 'Upper East Renaissance'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question:
				'In 1720, England was in massive debt and became involved in the South Sea Bubble. Who was the main mastermind behind it?',
			options: ['John Blunt', 'Daniel Defoe', 'Robert Harley', 'John Churchill'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Who was the Confederate general in the American Civil War?',
			options: ['George A. Custer', 'Ulysses S. Grant', 'George B. McClellan', 'Robert E. Lee'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'What was the code name for the Allied invasion of Southern France on August 15th, 1944?',
			options: ['Operation Overlord', 'Operation Market Garden', 'Operation Dragoon', 'Operation Torch'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Who was the first American in space?',
			options: ['Alan Shephard', 'Neil Armstrong', 'John Glenn', 'Jim Lovell'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Which of the following snipers has the highest amount of confirmed kills?',
			options: ['Simo Häyhä', 'Chris Kyle', 'Vasily Zaytsev', 'Craig Harrison'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'In what year did Texas secede from Mexico?',
			options: ['1838', '1845', '1844', '1836'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'What year did the Boxing Day earthquake & tsunami occur in the Indian Ocean?',
			options: ['2006', '2004', '2008', '2002'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'All of the following are names of the Seven Warring States EXCEPT:',
			options: ['Zhao (趙)', 'Qin (秦)', 'Qi (齊)', 'Zhai (翟)'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: "America's Strategic Defense System during the Cold War was nicknamed after this famous movie.",
			options: ['Jaws', 'Star Wars', 'Blade Runner', 'Alien'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question:
				'In the War of the Pacific (1879 - 1883), Bolivia lost its access to the Pacific Ocean after being defeated by which South American country?',
			options: ['Chile', 'Peru', 'Brazil', 'Argentina'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which of the following actors does not play a role in the movie "The Usual Suspects?"',
			options: ['Steve Buscemi', 'Kevin Spacey', 'Benicio Del Toro', 'Gabriel Byrne'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What is the correct phrase for the Latin saying "Romanes Eunt Domus" in Monty Python\'s Life of Brian?',
			options: ['Romans Go Home', 'Roxani Ite Domum', 'Tomate Ite Domum', 'Romani Ite Domum'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which one of these films did David Lynch direct, but not write?',
			options: ['The Straight Story', 'Inland Empire', 'Lost Highway', 'Twin Peaks Fire Walk With Me'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'Which of the following films was directed by Ivan Reitman, written by Gary Ross, featured Kevin Kline, and was released in 1993?',
			options: ['John', 'Will', 'Carl', 'Dave'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In the 1964 film "Zulu", what song does the British Army company sing before the final battle?',
			options: ['Men of Harlech', 'Scotland the Brave', 'Colonel Bogey March', 'The British Grenadiers'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In which 1955 film does Frank Sinatra play Nathan Detroit?',
			options: ['Anchors Aweigh', 'From Here to Eternity', 'Guys and Dolls', 'High Society'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What is the name of the villian in the 2015 Russian-American Sci-Fi Movie "Hardcore Henry"?',
			options: ['Estelle', 'Jimmy', 'Akan', 'Henry'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What is the name of James Dean\'s character in the 1955 movie "Rebel Without a Cause"?',
			options: ['Jim Stark', 'Ned Stark', 'Jim Kane', 'Frank Stark'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In the 2002 film "Kung Pow! Enter the Fist", Master Pain changes his name to what?',
			options: ['Sally', 'Amy', 'Betty', 'Kitty'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'In The Lord of the Rings: The Fellowship of the Ring, which one of the following characters from the book was left out of the film?',
			options: ['Strider', 'Tom Bombadil', 'Barliman Butterbur', 'Celeborn'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In the movie "Cast Away" the main protagonist\'s best friend while on the island is named',
			options: ['Carson', 'Wilson', 'Jackson', 'Willy'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question:
				"What type of cheese, loved by Wallace and Gromit, had it's sale prices rise after their successful short films?",
			options: ['Cheddar', 'Moon Cheese', 'Edam', 'Wensleydale'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Who directed the 1973 film "American Graffiti"?',
			options: ['Ron Howard', 'George Lucas', 'Francis Ford Coppola', 'Steven Spielberg'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which of these Disney classics was released in 1970?',
			options: ['The Aristocats', 'One Hundred and One Dalmatians', 'The Fox and the Hound', 'The Little Mermaid'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In what year was the movie "Police Academy" released?',
			options: ['1986', '1984', '1985', '1983'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'Which documentary film maker wrote and starred in the film "My Scientology Movie" which first debuted in 2015?',
			options: ['Louis Theroux', 'Errol Morris', 'Joe Berlinger', 'Adam Curtis'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Who played Deputy Marshal Samuel Gerard in the 1993 film "The Fugitive"?',
			options: ['Harrison Ford', 'Tommy Lee Jones', 'Harvey Keitel', 'Martin Landau'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What is the birth name of Michael Keaton?',
			options: ['Michael Douglas', 'Michael Fox', 'Michael Richards', 'Michael Kane'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'In Youtuber Jerma985\'s 2014 film "Rat Movie: Mystery of the Mayan Treasure," who is the man who tries to steal the Mayan Treasure?',
			options: [
				'Gabe "The Glue Man" Degrossi',
				'Dick Dastardly Richards',
				'Bootleg Duck Dynasty Byeah Batman',
				'Demon Lord Zeraxos'
			],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: "In Tron: Legacy, Kevin Flynn wrote a program to create the perfect system. What was the program's name?",
			options: ['Tron', 'MCP', 'Quorra', 'Clu'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In the movie "Spaceballs", what are the Spaceballs attempting to steal from Planet Druidia?',
			options: ['The Schwartz', 'Princess Lonestar', 'Meatballs', 'Air'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In the 1984 movie "The Terminator", what model number is the Terminator portrayed by Arnold Schwarzenegger?',
			options: ['T-800', 'I-950', 'T-888', 'T-1000'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In which 1973 film does Yul Brynner play a robotic cowboy who malfunctions and goes on a killing spree?',
			options: ['Runaway', 'Android', 'The Terminators', 'Westworld'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Who plays protagonist Ethan Hunt in the "Mission: Impossible" film-series?',
			options: ['Tom Cruise', 'Johnny Depp', 'Sean Connery', 'Pierce Brosnan'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What name did Tom Hanks give to his volleyball companion in the film `Cast Away`?',
			options: ['Wilson', 'Friday', 'Jones', 'Billy'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Who directed the movies "Pulp Fiction", "Reservoir Dogs" and "Django Unchained"?',
			options: ['Quentin Tarantino', 'Martin Scorcese', 'Steven Spielberg', 'James Cameron'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'According to "Star Wars" lore, which planet does Obi-Wan Kenobi come from?',
			options: ['Alderaan', 'Stewjon', 'Tatooine', 'Naboo'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which of these actors/actresses is NOT a part of the cast for the 2016 movie "Suicide Squad"?',
			options: ['Scarlett Johansson', 'Jared Leto', 'Will Smith', 'Margot Robbie'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'The 2002 film "28 Days Later" is mainly set in which European country?',
			options: ['France', 'United Kingdom', 'Italy', 'Germany'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'At the end of the 2001 film "Rat Race", whose concert do the contestants crash?',
			options: ['Bowling for Soup', 'Sum 41', 'Smash Mouth', 'Linkin Park'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: "What was Dorothy's surname in 'The Wizard Of Oz'?",
			options: ['Perkins', 'Day', 'Gale', 'Parker'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which of these movies is NOT considered to be part of the Marvel Cinematic Universe?',
			options: [
				'Fantastic Four (2015)',
				' Spider-Man: Homecoming (2017)',
				'The Incredible Hulk (2008)',
				'Captain Marvel (2019)'
			],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which movie released in 2016 features Superman and Batman fighting?',
			options: [
				'Batman v Superman: Dawn of Justice',
				'Batman v Superman: Superapocalypse',
				'Batman v Superman: Black of Knight',
				'Batman v Superman: Knightfall'
			],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In the movie "Blade Runner", what is the term used for human-like androids ?',
			options: ['Cylons', 'Synthetics', 'Replicants', 'Skinjobs'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What city did the monster attack in the film, "Cloverfield"?',
			options: ['New York, New York', 'Las Vegas, Nevada', 'Chicago, Illinois', 'Orlando, Florida'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which former Star Trek actor directed Three Men and a Baby (1987)?',
			options: ['William Shatner', 'George Takei', 'James Doohan', 'Leonard Nimoy'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Who performed the opening theme song for the James Bond 007 movie "Goldfinger"?',
			options: ['Shirley Basey', 'Tom Jones', 'John Barry', 'Sheena Easton'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which movie contains the quote, "Say hello to my little friend!"?',
			options: ['Scarface', 'Reservoir Dogs', 'Heat', 'Goodfellas'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which of the following is not the name of a "Bond Girl"? ',
			options: ['Pam Bouvier', 'Mary Goodnight', 'Vanessa Kensington', 'Wai Lin'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'In the movie "Back to the Future," what speed does Doc Brown\'s DeLorean need to reach in order to travel through time?',
			options: ['77 mph', '100 mph', '88 mph', '70 mph'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What was the name of the actor who played Leatherface in the 1974 horror film, The Texas Chainsaw Massacre?',
			options: ['Edwin Neal', 'Gunnar Hansen', 'John Dugan', 'Joe Bill Hogan'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: "Who voiced the character Draco in the 1996 movie 'DragonHeart'?",
			options: ['Dennis Quaid', 'Sean Connery', 'Pete Postlethwaite', 'Brian Thompson'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In the Mad Max franchise, what type of car is the Pursuit Special driven by Max?',
			options: ['Holden Monaro', 'Ford Falcon', 'Chrysler Valiant Charger', 'Pontiac Firebird'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In "Jurassic World", which company purchases InGen and creates Jurassic World?',
			options: [
				'Biology Synthetics Technologies',
				'International Genetics Incorporated',
				'Masrani Global Corporation ',
				'International Genetic Technologies'
			],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In "The Hobbit," who was head of the White Council? ',
			options: ['Lady Galadriel ', 'Gandalf', 'Elrond', 'Saruman'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which actor plays the character "Tommy Jarvis" in "Friday the 13th: The Final Chapter" (1984)?',
			options: ['Macaulay Culkin', 'Mel Gibson', 'Mark Hamill', 'Corey Feldman'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What is the birth name of Michael Caine?',
			options: ['Morris Coleman', 'Carl Myers', 'Martin Michaels', 'Maurice Micklewhite'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What Queen song plays during the final fight scene of the film "Hardcore Henry"?',
			options: ['Brighton Rock', "Don't Stop Me Now", 'Another Bites the Dust', 'We Will Rock You'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which of the following movies was not based on a book?',
			options: ['The Godfather', 'Forrest Gump', 'Citizen Kane', 'Jurassic Park'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Who plays Jack Burton in the movie "Big Trouble in Little China?"',
			options: ['Patrick Swayze', 'John Cusack', 'Harrison Ford', 'Kurt Russell'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'How many values can a single byte represent?',
			options: ['8', '1', '256', '1024'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'How many bits are commonly in a single byte?',
			options: ['Six bits', 'Twelve bits', 'Eight bits', ' Fifteen bits'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question:
				'In the programming language "Python", which of these statements would display the string "Hello World" correctly?',
			options: ['console.log("Hello World")', 'echo "Hello World"', 'print("Hello World")', 'printf("Hello World")'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'What was the name given to Android 4.3?',
			options: ['Lollipop', 'Nutella', 'Jelly Bean', 'Froyo'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'In any programming language, what is the most common way to iterate through an array?',
			options: ["'If' Statements", "'Do-while' loops", "'While' loops", "'For' loops"],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which of the following computer components can be built using only NAND gates?',
			options: ['CPU', 'RAM', 'Register', 'ALU'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which of the following languages is used as a scripting language in the Unity 3D game engine?',
			options: ['Java', 'C#', 'C++', 'Objective-C'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'What is the number of keys on a standard Windows Keyboard?',
			options: ['64', '104', '94', '76'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which of the following is NOT a computer science algorithm?',
			options: ['Bubble Sort', 'Merge Sort', 'Quick Sort', 'Float Sort'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which computer hardware device provides an interface for all other connected devices to communicate?',
			options: ['Central Processing Unit', 'Motherboard', 'Hard Disk Drive', 'Random Access Memory'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'What does CPU stand for?',
			options: ['Central Process Unit', 'Computer Personal Unit', 'Central Processing Unit', 'Central Processor Unit'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'What is the correct term for the metal object in between the CPU and the CPU fan within a computer system?',
			options: ['CPU Vent', 'Temperature Decipator', 'Heat Sink', 'Heat Vent'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'What does the Prt Sc button do?',
			options: [
				"Captures what's on the screen and copies it to your clipboard",
				'Nothing',
				"Saves a .png file of what's on the screen in your screenshots folder in photos",
				'Closes all windows'
			],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'The internet domain .fm is the country-code top-level domain for which Pacific Ocean island nation?',
			options: ['Fiji', 'Tuvalu', 'Micronesia', 'Marshall Islands'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which kind of algorithm is Ron Rivest not famous for creating?',
			options: ['Hashing algorithm', 'Asymmetric encryption', 'Stream cipher', 'Secret sharing scheme'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'What was the name of the first Bulgarian personal computer?',
			options: ['IMKO-1', 'Pravetz 82', 'Pravetz 8D', 'IZOT 1030'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which coding language was the #1 programming language in terms of usage on GitHub in 2015?',
			options: ['C#', 'Python', 'JavaScript', 'PHP'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'How long is an IPv6 address?',
			options: ['32 bits', '64 bits', '128 bytes', '128 bits'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question:
				"Released in 2001, the first edition of Apple's Mac OS X operating system (version 10.0) was given what animal code name?",
			options: ['Cheetah', 'Puma', 'Tiger', 'Leopard'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which of the following is a personal computer made by the Japanese company Fujitsu?',
			options: ['PC-9801', 'FM-7', 'Xmillennium ', 'MSX'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'What is the name of Layer 7 of the OSI model?',
			options: ['Session', 'Network', 'Application', 'Present'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'What is the code name for the mobile operating system Android 7.0?',
			options: ['Ice Cream Sandwich', 'Nougat', 'Jelly Bean', 'Marshmallow'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'The computer OEM manufacturer Clevo, known for its Sager notebook line, is based in which country?',
			options: ['United States', 'Germany', 'Taiwan', "China (People's Republic of)"],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'America Online (AOL) started out as which of these online service providers?',
			options: ['CompuServe', 'Prodigy', 'Quantum Link', 'GEnie'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which programming language shares its name with an island in Indonesia?',
			options: ['Java', 'Python', 'C', 'Jakarta'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'What does the DOS in Microsoft\'s first operating system "MS-DOS" stand for?',
			options: ['Dumb Operating System', 'Driver Oriented System', 'Disk Operating System', 'Diskless Operating System'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'How many Hz does the video standard PAL support?',
			options: ['59', '60', '50', '25'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'When was the programming language "C#" released?',
			options: ['2000', '1998', '1999', '2001'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'What was the first Android version specifically optimized for tablets?',
			options: ['Eclair', 'Froyo', 'Honeycomb', 'Marshmellow'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which RAID array type is associated with data mirroring?',
			options: ['RAID 0', 'RAID 10', 'RAID 1', 'RAID 5'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'What is the codename of the eighth generation Intel Core micro-architecture launched in October 2017?',
			options: ['Sandy Bridge', 'Skylake', 'Coffee Lake', 'Broadwell'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'What does SSD stand for?',
			options: ['Solid State Drive', 'Solution Source Disk', 'Solid State Disk', 'Source Solution Drive'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: "The programming language 'Swift' was created to replace what other programming language?",
			options: ['Objective-C', 'C#', 'Ruby', 'C++'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'What major programming language does Unreal Engine 4 use?',
			options: ['Assembly', 'C#', 'ECMAScript', 'C++'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'In CSS, which of these values CANNOT be used with the "position" property?',
			options: ['static', 'center', 'absolute', 'relative'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: "If you were to code software in this language you'd only be able to type 0's and 1's.",
			options: ['JavaScript', 'C++', 'Binary', 'Python'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'The acronym "RIP" stands for which of these?',
			options: [
				'Runtime Instance Processes',
				'Regular Interval Processes',
				'Routing Information Protocol',
				'Routine Inspection Protocol'
			],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question:
				'The series of the Intel HD graphics generation succeeding that of the 5000 and 6000 series (Broadwell) is called:',
			options: ['HD Graphics 700 ', 'HD Graphics 500', 'HD Graphics 600', 'HD Graphics 7000'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'What is the name of the process that sends one qubit of information using two bits of classical information?',
			options: ['Super Dense Coding', 'Quantum Entanglement', 'Quantum Programming', 'Quantum Teleportation'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: '.rs is the top-level domain for what country?',
			options: ['Romania', 'Serbia', 'Russia', 'Rwanda'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question:
				'Which of these was the name of a bug found in April 2014 in the publicly available OpenSSL cryptography library?',
			options: ['Shellshock', 'Corrupted Blood', 'Shellscript', 'Heartbleed'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'What does the "MP" stand for in MP3?',
			options: ['Music Player', 'Moving Picture', 'Multi Pass', 'Micro Point'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Linus Torvalds created which of these?',
			options: ['Microsoft Windows', 'Python', 'Wikipedia', 'Linux'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'What amount of bits commonly equals one byte?',
			options: ['1', '2', '64', '8'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Who invented the "Spanning Tree Protocol"?',
			options: ['Paul Vixie', 'Vint Cerf', 'Michael Roberts', 'Radia Perlman'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: "Which internet company began life as an online bookstore called 'Cadabra'?",
			options: ['eBay', 'Overstock', 'Amazon', 'Shopify'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Who is the original author of the realtime physics engine called PhysX?',
			options: ['NovodeX', 'Ageia', 'Nvidia', 'AMD'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'The name of technology company HP stands for what?',
			options: ['Howard Packmann', 'Husker-Pollosk', 'Hellman-Pohl', 'Hewlett-Packard'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'In computing terms, typically what does CLI stand for?',
			options: ['Common Language Input', 'Command Line Interface', 'Control Line Interface', 'Common Language Interface'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: "What was Bitcoin's block size limit in 2010?",
			options: ['1GB', '1 KB', '1 MB', '1 TB'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'In "Shrek", what comedic actor voices Donkey?',
			options: ['Eddie Murphy', 'Chris Rock', 'Richard Pryor', 'Bernie Mac'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Roughly how many ingested apple seeds would it take to receive a fatal dose of cyanide?',
			options: ['20', '200', '2,000', '20,000'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'What Latin phrase roughly translates to "seize the day"?',
			options: ['Memento mori', 'Carpe diem', 'Plus ultra', 'Sic semper tyrannis'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Out of these four buildings, which one is the tallest, with a height of 1,250 ft (381 m)?',
			options: [
				'Bank of China Tower, Hong Kong',
				'Federation Tower, Russia',
				'Empire State Building, United States',
				'Gevora Hotal, United Arab Emirates'
			],
			correct: 2
		},
		{
			category: 'GENERAL',
			question:
				'Which Italian automobile manufacturer gained majority control of U.S. automobile manufacturer Chrysler in 2011?',
			options: ['Maserati', 'Alfa Romeo', 'Fiat', 'Ferrari'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'In Half-Life, what is the name of the alien that attaches to heads?',
			options: ['Bullsquid', 'Vortigaunt', 'Headcrab', 'Facehugger'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'How many calories are in a 355 ml can of Pepsi Cola?',
			options: ['200', '100', '155', '150'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'What is Cynophobia the fear of?',
			options: ['Birds', 'Flying', 'Dogs', 'Germs'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question:
				'How long did it take the motorized window washers of the original World Trade Center to clean the entire exterior of the building?',
			options: ['3 Weeks', '1 Month', '1 Week', '2 Months'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question:
				'Linus Pauling, one of the only winners of multiple Nobel Prizes, earned his Nobel Prizes in Chemistry and what?',
			options: ['Peace', 'Physics', 'Economics', 'Physiology/Medicine'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: "Which restaurant's mascot is a clown?",
			options: ['Whataburger', 'Burger King', 'Sonic', "McDonald's"],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'When someone is inexperienced they are said to be what color?',
			options: ['Red', 'Blue', 'Yellow', 'Green'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Which of these words means "idle spectator"?',
			options: ['Gossypiboma', 'Jentacular', 'Meupareunia', 'Gongoozler'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'What is the official language in Barcelona beside Spanish?',
			options: [' Galician', 'French', 'Catalan', 'Basque'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'If you planted the seeds of Quercus robur, what would grow?',
			options: ['Grains', 'Trees', 'Vegetables', 'Flowers'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'What is the romanized Korean word for "heart"?',
			options: ['Aejeong', 'Jeongsin', 'Segseu', 'Simjang'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Where does water from Poland Spring water bottles come from?',
			options: ['Hesse, Germany', 'Masovia, Poland', 'Maine, United States', 'Bavaria, Poland'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'In "Katamari Damacy", you control a character known as:',
			options: ['Fujio', 'Ichigo ', 'Foomin', 'The Prince'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'What is the first book of the Old Testament?',
			options: ['Exodus', 'Leviticus', 'Numbers', 'Genesis'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'What nuts are used in the production of marzipan?',
			options: ['Almonds', 'Peanuts', 'Walnuts', 'Pistachios'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'The Panama Canal was officially opened by which US president?',
			options: ['Woodrow Wilson', 'Calvin Coolidge', 'Herbert Hoover', 'Theodore Roosevelt'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'In which cardinal direction does the Sun rise from?',
			options: ['West', 'North', 'East', 'South'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Which item of clothing is usually worn by a Scotsman at a wedding?',
			options: ['Skirt', 'Kilt', 'Dress', 'Rhobes'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'What planet is not named after a Greek or Roman god?',
			options: ['Jupiter', 'Mars', 'Mercury', 'Earth'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Which American-owned brewery led the country in sales by volume in 2015?',
			options: ['Anheuser Busch', 'Boston Beer Company', 'D. G. Yuengling and Son, Inc', 'Miller Coors'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'What is the name of the currency used in Ethiopia?',
			options: ['Dirham', 'U.S. Dollar', 'Rand', 'Birr'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Which of the following nations was NOT a belligerent in World War I?',
			options: ['Portugal', 'Denmark', 'Greece', 'Romania'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'What is the shape of the toy invented by Hungarian professor Ernő Rubik?',
			options: ['Sphere', 'Cylinder', 'Cube', 'Pyramid'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'How would one say goodbye in Spanish?',
			options: [' Hola', 'Au Revoir', 'Salir', 'Adiós'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question:
				'What is the name of the alcoholic beverage made from potatoes or grains that originates from Poland and Russia?',
			options: ['Absinthe', 'Rum', 'Sake', 'Vodka'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'What is the currency of Poland?',
			options: ['Złoty', 'Ruble', 'Euro', 'Krone'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'This Ghanaian entrepreneur is a pioneer of microlending.',
			options: ['Farida Bedwei', 'Esther Afua Ocloo', 'Ama Ata Aido', 'Sionne Neely'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'The Fields Medal, one of the most sought after awards in mathematics, is awarded every how many years?',
			options: ['3', '5', '6', '4'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'The website "Shut Up & Sit Down" reviews which form of media?',
			options: ['Television Shows', 'Video Games', 'Board Games', 'Films'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'What year was Apple Inc. founded?',
			options: ['1978', '1976', '1980', '1974'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: "What was the third country to have a McDonald's restaurant?",
			options: ['Japan', 'France', 'Australia', 'Costa Rica'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Who is the author of Jurassic Park?',
			options: ['Peter Benchley', 'Chuck Paluhniuk', 'Michael Crichton', 'Irvine Welsh'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Which of the following landmarks is not located in New York City?',
			options: ['Empire State Building', 'Times Square', 'Central Park', 'Lincoln Memorial'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'What is the star sign of someone born on Valentines day?',
			options: ['Pisces', 'Capricorn', 'Scorpio', 'Aquarius'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Which of the following correctly describes Japanese word order?',
			options: ['Subject Object Verb', 'Subject Verb Object', 'Verb Subject Object', 'Verb Object Subject'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Earl Grey tea is black tea flavoured with what?',
			options: ['Lavender', 'Bergamot oil', 'Vanilla', 'Honey'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'What is a "dakimakura"?',
			options: [
				'A Chinese meal, essentially composed of fish',
				'A yoga posture',
				'A word used to describe two people who truly love each other',
				'A body pillow'
			],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'How many notes are there on a standard grand piano?',
			options: ['98', '108', '78', '88'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'What did the Spanish autonomous community of Catalonia ban in 2010, that took effect in 2012?',
			options: ['Fiestas', 'Flamenco', 'Bullfighting', 'Mariachi'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'To which language family does Kazakh belong?',
			options: ['Mongolic', 'Indo-European', 'Uralic', 'Turkic'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: "Virtual reality company Oculus VR lost which of it's co-founders in a freak car accident in 2013?",
			options: ['Nate Mitchell', 'Andrew Scott Reisse', 'Jack McCauley', 'Palmer Luckey'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question:
				'What was the nickname given to the Hughes H-4 Hercules, a heavy transport flying boat which achieved flight in 1947?',
			options: ["Noah's Ark", 'Spruce Goose', 'Fat Man', 'Trojan Horse'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Which of the following carbonated soft drinks were introduced first?',
			options: ['Dr. Pepper', 'Coca-Cola', 'Sprite', 'Mountain Dew'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Who founded the Khan Academy?',
			options: ['Ben Khan', 'Kitt Khan', 'Sal Khan', 'Adel Khan'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Earth is located in which galaxy?',
			options: ['The Mars Galaxy', 'The Galaxy Note', 'The Black Hole', 'The Milky Way Galaxy'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'Which painting was not made by Vincent Van Gogh?',
			options: ['Café Terrace at Night', 'The Ninth Wave', 'Bedroom In Arles', 'Starry Night'],
			correct: 1
		},
		{
			category: 'ART',
			question: "Albrecht Dürer's birthplace and place of death were in...",
			options: ['Augsburg', 'Nürnberg', 'Bamberg', 'Berlin'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Which Greek sculptor designed the Athena Parthenos statue inside the Parthenon?',
			options: ['Scopas', 'Hesiod', 'Praxiteles', 'Phidias'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'What nationality was the famous artist Van Gogh?',
			options: ['Dutch', 'French', 'Russian', 'Polish'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'When was Salvador Dali\'s painting, "The Persistence of Memory," completed?',
			options: ['1932', '1929', '1931', '1934'],
			correct: 2
		},
		{
			category: 'ART',
			question: 'Which one of these paintings is not by Caspar David Friedrich?',
			options: ['The Sea of Ice', 'Wanderer above the Sea of Fog', 'The Monk by the Sea', 'The Black Sea'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'What is the name of the Japanese art of folding paper into decorative shapes and figures?',
			options: ['Sumi-e', 'Ukiyo-e', 'Origami', 'Haiku'],
			correct: 2
		},
		{
			category: 'ART',
			question: "What were Marcel Duchamp's readymades?",
			options: [
				'a series focused on color and light as opposed to line and shape',
				'utilitarian objects elevated to the status of art',
				'paintings with a barely visible outlined square',
				'a group of identical steel boxes jutting from the wall '
			],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Which of these are the name of a famous marker brand?',
			options: ['Copic', 'Dopix', 'Cofix', 'Marx'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Which Van Gogh painting depicts the view from his asylum in Saint-Rémy-de-Provence in southern France?',
			options: ['The Starry Night', 'Wheatfields with Crows', 'The Sower with Setting Sun', 'The Church at Auvers'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Who painted "The Starry Night"?',
			options: ['Vincent van Gogh', 'Edvard Munch', 'Pablo Picasso', 'Claude Monet'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Paul Gauguin moved to which country in 1895?',
			options: ['France', 'Atuona', 'Lithuania', 'Tahiti'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'Painter Piet Mondrian (1872 - 1944) was a part of what movement?',
			options: ['Neoplasticism', 'Precisionism', 'Cubism', 'Impressionism'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Which art movement was Pablo Picasso known for co-founding?',
			options: ['Cubism', 'Futurism', 'Expressionism', 'Impressionism'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'What was the first successful and commercially viable photographic technique?',
			options: ['Collodion process', 'The Daguerreotype', 'The Turin Shroud', 'Kodachrome film'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Which of these paintings did Johannes Vermeer not paint?',
			options: ['Girl with a Pearl Earring', 'Bacchus', 'The Milkmaid', 'The Lacemaker'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Who painted the epic mural Guernica?',
			options: ['Francisco Goya', 'Pablo Picasso', 'Leonardo da Vinci', 'Henri Matisse'],
			correct: 1
		},
		{
			category: 'ART',
			question:
				'How many paint and pastel versions of "The Scream" is Norwegian painter Edvard Munch believed to have produced?',
			options: ['1', '3', '2', '4'],
			correct: 3
		},
		{
			category: 'ART',
			question:
				'Which artist painted "The Treachery of Images," a painting of a pipe with the description "this is not a pipe"?',
			options: ['Matisse', 'Modigliani', 'Munch ', 'Magritte'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'The painting "Guernica" by Pablo Picasso expressed emotions of dread in response to which war?',
			options: ['World War I', 'The Crimean War', 'Spanish Civil War', 'Spanish-American War'],
			correct: 2
		},
		{
			category: 'ART',
			question: 'Who painted the biblical fresco The Creation of Adam?',
			options: ['Michelangelo', 'Leonardo da Vinci', 'Caravaggio', 'Rembrandt'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Which artist is famous for cutting off his ear?',
			options: ['Vincent van Gogh', 'Salvador Dali', 'Rembrandt', 'Michelangelo'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'What is another name for La Gioconda / La Joconde?',
			options: ['The Girl with a Pearl Earring', 'The Mona Lisa', 'The Starry Night', 'Sunflowers'],
			correct: 1
		},
		{
			category: 'ART',
			question: "Which artist's style was to use small different colored dots to create a picture?",
			options: ['Georges Seurat', 'Paul Cézanne', 'Vincent Van Gogh', 'Henri Rousseau'],
			correct: 0
		},
		{
			category: 'ART',
			question: "Which one of these colors are not featured in Mondrian's Broadway Boogie-Woogie?",
			options: ['Blue', 'Green', 'Yellow', 'Red'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Who painted "American Gothic"?',
			options: ['Anita Malfatti', 'Pablo Picasso', 'Marc Chagall', 'Grant Wood'],
			correct: 3
		},
		{
			category: 'ART',
			question: "Which artist painted the late 15th century mural 'The Last Supper'?",
			options: ['Piero della Francesca', 'Leonardo da Vinci', 'Paolo Uccello', 'Luca Pacioli'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'What is a fundamental element of the Gothic style of architecture?',
			options: ['coffered ceilings', 'fa&ccedil;ades surmounted by a pediment ', 'internal frescoes', 'pointed arch'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'Which of these is not an additional variation of the color purple?',
			options: ['Kobicha', 'Byzantium', 'Pomp and Power', 'Palatinate'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'What nationality was the surrealist painter Salvador Dali?',
			options: ['Italian', 'Spanish', 'French', 'Portuguese'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'What French sculptor designed the Statue of Liberty? ',
			options: ['Jean-Léon Gér&ocirc;me', 'Frédéric Auguste Bartholdi', 'Auguste Rodin', 'Henri Matisse'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Who painted The Starry Night?',
			options: ['Pablo Picasso', 'Vincent van Gogh', 'Leonardo da Vinci', 'Michelangelo'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Who sculpted the statue of David?',
			options: ['Gian Lorenzo Bernini', 'Michelangelo', 'Auguste Rodin', 'Donatello'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'What year did Albrecht Dürer create the painting "The Young Hare"?',
			options: ['1702', '1502', '1402', '1602'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Who painted the Sistine Chapel?',
			options: ['Michelangelo', 'Leonardo da Vinci', 'Pablo Picasso', 'Raphael'],
			correct: 0
		},
		{
			category: 'ART',
			question: ' What color is produced by mixing black and white?',
			options: ['Black', 'Grey', 'Brown', 'White'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Who painted the painting "Nighthawks"?',
			options: ['Johannes Vermeer', 'Edward Hopper', 'Vincent van Gogh', 'Salvador Dali'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'The painting "The Starry Night" by Vincent van Gogh was part of which art movement?',
			options: ['Romanticism', 'Post-Impressionism', 'Neoclassical', 'Impressionism'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'What nationality was the famous artist Pablo Picasso?',
			options: ['French', 'Italian', 'Spanish', 'German'],
			correct: 2
		},
		{
			category: 'ART',
			question: 'In "Last Supper" by Leonardo Da Vinci, what two colors were the robes worn by Jesus?',
			options: ['Red and Blue', 'Red and White', 'Red and Yellow', 'Red and Black'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Who painted "Swans Reflecting Elephants", "Sleep", and "The Persistence of Memory"?',
			options: ['Jackson Pollock', 'Vincent van Gogh', 'Edgar Degas', 'Salvador Dali'],
			correct: 3
		},
		{
			category: 'ART',
			question: "Which artist's studio was known as 'The Factory'?",
			options: ['Roy Lichtenstein', 'David Hockney', 'Andy Warhol', 'Peter Blake'],
			correct: 2
		},
		{
			category: 'ART',
			question: 'Which time signature is commonly known as "Cut Time?"',
			options: ['4/4', '6/8', '3/4', '2/2'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'Who designed the Chupa Chups logo?',
			options: ['Pablo Picasso', 'Andy Warhol', 'Vincent van Gogh', 'Salvador Dali'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'Who painted "The Scream"?',
			options: ['Vincent Van Gogh', 'Picasso', 'Edvard Munch', 'Henri Matisse'],
			correct: 2
		},
		{
			category: 'ART',
			question: 'What was the major distinction between the English and French Gothic styles of architecture?',
			options: ['Pinnacles', 'Fan vaulting', 'Gargoyles', 'Hemispherical Domes'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'What year was the Mona Lisa finished?',
			options: ['1487', '1504', '1523', '1511'],
			correct: 1
		},
		{
			category: 'ART',
			question: "What is the world's oldest known piece of fiction?",
			options: ['Papyrus of Ani', 'Code of Hammurabi', 'Epic of Gilgamesh', 'Rosetta Stone'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Where did the Great Storm of 1987 make landfall at, first?',
			options: ['Surrey', 'Wales', 'Cornwall', 'The Midlands'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'What cell organelle is known as "the powerhouse of the cell?"',
			options: ['Nucleus', 'Golgi apparatus', 'Mitochondria', 'Endoplasmic reticulum'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question:
				'Which one of these scientists conducted the Gold Foil Experiment which concluded that atoms are mostly made of empty space?',
			options: ['Joseph John Thomson', 'Archimedes', 'Niels Henrik David Bohr', 'Ernest Rutherford'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'The core of the Sun can reach which temperature?',
			options: [
				'938,000° F (521093.3° C)',
				'8° Billion F (°4.4 Billion C)',
				'Absolute Zero (Both F and C)',
				'27° Million F (15° Million C)'
			],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Who is the chemical element Curium named after?',
			options: ['The Curiosity Rover', 'Marie & Pierre Curie', 'Curious George', 'Stephen Curry'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Botanically speaking, which of these fruits is NOT a berry?',
			options: ['Blueberry', 'Strawberry', 'Banana', 'Concord Grape'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Which of these bones is hardest to break?',
			options: ['Cranium', 'Humerus', 'Tibia', 'Femur'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Down Syndrome is usually caused by an extra copy of which chromosome?',
			options: ['23', '21', '15', '24'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'All the following metal elements are liquids at or near room temperature EXCEPT:',
			options: ['Gallium', 'Caesium', 'Mercury', 'Beryllium'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Human cells typically have how many copies of each gene?',
			options: ['1', '2', '4', '3'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Which Apollo mission was the first one to land on the Moon?',
			options: ['Apollo 10', 'Apollo 9', 'Apollo 13', 'Apollo 11'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Muscle fiber is constructed of bundles small long organelles called what?',
			options: ['Epimysium', 'Myofiaments', 'Myocardium', 'Myofibrils'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'What is the same in Celsius and Fahrenheit?',
			options: ['-40', '32', '-39', '-42'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'How many moons does the Earth have?',
			options: ['0', '2', '1', '3'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'What is the scientific name of the knee cap?',
			options: ['Patella', 'Femur', 'Foramen Magnum', 'Scapula'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Which of the following is a major muscle of the back?',
			options: ['Trapezius', 'Trapezium', 'Trapezoid', 'Triquetrum'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Which psychological term refers to the stress of holding contrasting beliefs?',
			options: ['Cognitive Dissonance', 'Flip-Flop Syndrome', 'Split-Brain', 'Blind Sight'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'What is the chemical symbol for lead?',
			options: ['Ld', 'Pb', 'Le', 'Pm'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'What is the molecular formula of the active component of chili peppers(Capsaicin)?',
			options: ['C21H23NO3', 'C18H27NO3', 'C6H4Cl2', 'C13H25NO4'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'What is Hypernatremia?',
			options: [
				'Increase in blood sodium',
				'Decrease in blood potassium',
				'Increase in blood glucose',
				'Decrease in blood iron'
			],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'What is the thin, outermost layer of the Earth?',
			options: ['Exosphere', 'Crust', 'Mantle', 'Outer Core'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Which of the following is NOT a passive electrical component?',
			options: ['Transistor', 'Resistor', 'Capacitor', 'Inductor'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question:
				'Which of the following is the term for "surgical complications resulting from surgical sponges left inside the patient\'s body?',
			options: ['Gossypiboma', 'Gongoozler', 'Jentacular', 'Meupareunia'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'What does the yellow diamond on the NFPA 704 fire diamond represent?',
			options: ['Reactivity', 'Health', 'Flammability', 'Radioactivity'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'What do you study if you are studying entomology?',
			options: ['Humans', 'Insects', 'the Brain', 'Fish'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'In Chemistry, how many isomers does Butanol (C4H9OH) have?',
			options: ['3', '5', '4', '6'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'What common name is given to the medial condition, tibial stress syndrome (MTSS)?',
			options: ['Tennis Elbow', 'Shin Splints', 'Carpal Tunnel', "Housemaid's Knee"],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: "What animal takes part in Schrödinger's most famous thought experiment?",
			options: ['Dog', 'Bat', 'Cat', 'Butterfly'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Which planet in the Solar System is the closest to the Sun?',
			options: ['Earth', 'Mars', 'Mercury', 'Venus'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'What is the unit of electrical inductance?',
			options: ['Weber', 'Coulomb', 'Mho', 'Henry'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'What are the smallest blood vessels in the human body?',
			options: ['Capillaries', 'Arterioles', 'Veinules', 'Lymphatics'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'What is the standard SI unit for temperature?',
			options: ['Fahrenheit', 'Kelvin', 'Celsius', 'Rankine'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'The moons, Miranda, Ariel, Umbriel, Titania and Oberon orbit which planet?',
			options: ['Jupiter', 'Venus', 'Neptune', 'Uranus'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'What stage of development do the majority of eukaryotic cells remain in for most of their life?',
			options: ['Prophase', 'Stasis', 'Telophase', 'Interphase'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'The biggest distinction between a eukaryotic cell and a prokaryotic cell is:',
			options: [
				'The overall size',
				'The presence or absence of a nucleus',
				'The presence or absence of certain organelles',
				'The mode of reproduction'
			],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'What is the study of the cells and tissues of plants and animals?',
			options: ['Microbiology', 'Anatomy', 'Histology', 'Biochemistry'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: '"The Big Bang Theory" was first theorized by a priest of what religious ideology?',
			options: ['Catholic', 'Christian', 'Jewish', 'Islamic'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Along with Oxygen, which element is primarily responsible for the sky appearing blue?',
			options: ['Nitrogen', 'Helium', 'Carbon', 'Hydrogen'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'What is an example of a bacterial pathogen?',
			options: ['Measles ', 'AIDS', 'Cholera', 'Ringworm'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Which scientific unit is named after an Italian nobleman?',
			options: ['Pascal', 'Volt', 'Ohm', 'Hertz'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Where did the dog breed "Chihuahua" originate?',
			options: ['Mexico', 'France', 'Spain', 'Russia'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'When did construction of the Suez Canal finish?',
			options: ['1859', '1860', '1869', '1850'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question:
				'When did L. L. Zamenhof first publish "Unua Libro", the first publication describing his international language Esperanto?',
			options: ['1897', '1905', '1915', '1887'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'On what day did Germany invade Poland?',
			options: ['September 1, 1939', 'December 7, 1941', 'June 22, 1941', 'July 7, 1937'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Which of the following Physicists aided Nazi Germany in their production of a nuclear weapon?',
			options: ['Werner Heisenberg', 'John von Neumann', 'Albert Einstein', 'Max Planck'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Which modern day country is the region that was known as Phrygia in ancient times?',
			options: ['Syria', 'Turkey', 'Greece', 'Egypt'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Under which name was Rodrigo Borgia made Pope?',
			options: ['Alexander VI', 'Rodrigo I', 'John Paul II', 'Pius VII'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'During what war did the "Cuban Missile Crisis" occur?',
			options: ['World War I', 'Cold War', 'World War II', 'Revolutionary War'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: "Which U.S. President was famously 'attacked' by a swimming rabbit?",
			options: ['Ronald Reagan', 'Jimmy Carter', 'Lydon B. Johnson', 'Gerald Ford'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'The 15th century conflicts between the Houses of York and Lancaster are known as the Wars of the what?',
			options: ['Wars of the Lillies', 'Wars of the Roses', 'Wars of the Daffodils', 'Wars of the Tulips'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: "The ontological argument for the proof of God's existence is first attributed to whom?",
			options: ['René Descartes', 'Anselm of Canterbury', 'Immanuel Kant', 'Aristotle'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'What was the name of the spy ring that helped the United States win the Revolutionary War?',
			options: ['New York Spy Ring', 'Culper Ring', "Washington's Spies", 'Unnamed'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'From 1940 to 1942, what was the capital-in-exile of Free France ?',
			options: ['Algiers', 'Brazzaville', 'Paris', 'Tunis'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'List the following Iranic empires in chronological order:',
			options: [
				'Median, Achaemenid, Sassanid, Parthian',
				'Achaemenid, Median, Parthian, Sassanid',
				'Median, Achaemenid, Parthian, Sassanid',
				'Achaemenid, Median, Sassanid, Parthian'
			],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'What year did Australia become a federation?',
			options: ['1910', '1899', '1911', '1901'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Who was the President of the United States during the signing of the Gadsden Purchase?',
			options: ['Andrew Johnson', 'Franklin Pierce', 'Abraham Lincoln', 'James Polk'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Who was the first man to travel into outer space?',
			options: ['Virgil Ivan "Gus" Grissom', 'Yuri Gagarin', 'Neil Armstrong', 'Buzz Aldrin'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Where did first known lesbian rights organization in the United States, Daughters of Bilitis, start?',
			options: ['San Francisco', 'New York', 'Chicago', 'Los Angeles'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'The main objective of the German operation "Case Blue" during World War II was originally to capture what?',
			options: ['Stalingrad', 'Crimea', 'Caucasus', 'Voronezh'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: "On which day did the attempted coup d'etat of 1991 in the Soviet Union begin?",
			options: ['August 19', 'August 21', 'December 26', 'December 24'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'What did Albert Einstein win the Nobel Prize for in 1921?',
			options: ['Relativity', 'Photoelectric Effect', 'Wave-Particle Duality', 'Zero-Point Energy'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: "Which Apollo mission was the last one in NASA's Apollo program?",
			options: ['Apollo 13', 'Apollo 17', 'Apollo 11', 'Apollo 15'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Which WWII tank ace is credited with having destroyed the most tanks?',
			options: ['Michael Wittmann', 'Walter Kniep', 'Otto Carius', 'Kurt Knispel'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Which of the following countries was the first to send an object into space?',
			options: ['USA', 'Russia', 'Germany', 'China'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'How many sonatas did Ludwig van Beethoven write?',
			options: ['32', '50', '31', '21'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Who assassinated Archduke Franz Ferdinand?',
			options: ['Nedeljko Čabrinović', 'Oskar Potiorek', 'Gavrilo Princip', 'Ferdinand Cohen-Blind'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Which of these theoretical phycisists first predicted the existence of antimatter?',
			options: ['Niels Bohr', 'Albert Einstein', 'Paul Dirac', 'Werner Heisenberg'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question:
				'Which of the following battles is often considered as marking the beginning of the fall of the Western Roman Empire?',
			options: ['Battle of Adrianople', 'Battle of Thessalonica', 'Battle of Pollentia', 'Battle of Constantinople'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'In 1547 who became the 1st Tsar of Russia',
			options: ['Alexis of Russia', 'Ivan the Terrible', 'Mikhail Romanov', 'Peter the Great'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'In what year did the Battle of Verdun take place?',
			options: ['1917', '1916', '1915', '1918'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'What was the total length of the Titanic?',
			options: ['759 ft | 231.3 m', '882 ft | 268.8 m', '1042 ft | 317.6 m', '825 ft | 251.5 m'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: "Hong Kong was a part of which country's territory before Britain regained it in 1945?",
			options: ['China', 'Japan', 'Phillipines', 'French Indonesia'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Who was the Prime Minister of the United Kingdom for most of World War II?',
			options: ['Neville Chamberlain', 'Harold Macmillan', 'Winston Churchill', 'Edward Heath'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'How old was the famous King Tutankhamen (Tut) when he died?',
			options: ['21', '19', '15', '30'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Bohdan Khmelnytsky was which of the following?',
			options: [
				'General Secretary of the Communist Party of the USSR',
				'Leader of the Ukrainian Cossacks',
				'Prince of Wallachia',
				'Grand Prince of Novgorod'
			],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'King Henry VIII was the second monarch of which European royal house?',
			options: ['York', 'Tudor', 'Stuart', 'Lancaster'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'What was the name of the chemical that was dropped on Vietnam during the Vietnam war?',
			options: ['Agent Orange', 'Phosgene', 'Mustard Gas', 'Hydrogen Cyanide'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'The Arab Spring was a series of protests and rebellions that began in which of these Arab nations?',
			options: ['Morocco', 'Tunisia', 'Syria', 'Egypt'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'What is the bloodiest event in United States history, in terms of casualties?',
			options: ['Battle of Antietam', 'Pearl Harbor', 'September 11th', 'D-Day'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Which of these positions did the astronomer and physicist Isaac Newton not hold?',
			options: [
				'Professor of Mathematics',
				'Warden of the Royal Mint',
				'Surveyor to the City of London',
				'Member of Parliament'
			],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Which of these 1900s tanks were designed and built BEFORE the others?',
			options: ['M4 Sherman', ' Panzer IV', 'Cromwell ', 'Renault FT'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'In what year was the last natural case of smallpox documented?',
			options: ['1982', '1980', '1977', '1990'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'John Moses Browning, the designer of the M1918 BAR (Browning Automatic Rifle) was a part of which religion?',
			options: ['Catholic', 'Jewish', 'Mormon', 'Atheist'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: "Which Louis was known as 'The Sun King of France'?",
			options: ['Louis XIII', 'Louis XIV', 'Louis XV', 'Louis XVI'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'A collection of Sanskrit hymns and verses known as the Vedas are sacred texts in what religion?',
			options: ['Hinduism', 'Judaism', 'Islam', 'Buddhism'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the state capital of South Dakota?',
			options: ['Sioux Falls', 'Rapid City', 'Watertown', 'Pierre'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the longest river in Europe?',
			options: ['Danube', 'Rhine', 'Volga', 'Thames'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'What tiny principality lies between Spain and France?',
			options: ['Liechtenstein', 'Andorra', 'Monaco', 'San Marino'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of the following languages does NOT use the Latin alphabet?',
			options: ['Turkish', 'Georgian', 'Swahili', 'Vietnamese'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the 15th letter of the Greek alphabet?',
			options: ['Sigma (&Sigma;)', 'Pi (&Pi;)', 'Nu (&Nu;)', 'Omicron (&Omicron;)'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'The Svalbard Archipelago is a dependency of which country?',
			options: ['Denmark', 'Norway', 'Iceland', 'Russia'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the region conjoining Pakistan, India, and China with unknown leadership called?',
			options: ['Andorra', 'Gibraltar', 'Kashmir', 'Quin'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'How many time zones are in Russia?',
			options: ['8', '5', '2', '11'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'The Japanese district Akihabara is also known by what nickname?',
			options: ['Moon Walk River', 'Electric Town', 'Otaku Central ', 'Big Eyes'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which islands below have been claimed by both Japan and Russia?',
			options: ['Paracel Islands', 'Chagos Islands', 'Kuril Islands', 'Spratly Islands'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the name of rocky region that spans most of eastern Canada?',
			options: ['Rocky Mountains', 'Appalachian Mountains', 'Canadian Shield', 'Himalayas'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'In which city is the Big Nickel located in Canada?',
			options: ['Calgary, Alberta', 'Halifax, Nova Scotia ', 'Victoria, British Columbia', 'Sudbury, Ontario'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of these countries is "doubly landlocked" (surrounded entirely by one or more landlocked countries)?',
			options: ['Uzbekistan', 'Switzerland', 'Bolivia', 'Ethiopia'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: "What is the world's smallest country by population?",
			options: ['Nauru', 'Vatican City', 'Marshall Islands', 'Lichtenstein'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the largest Muslim country in the world?',
			options: ['Pakistan', 'Saudi Arabia', 'Indonesia', 'Iran'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of these countries is not a United Nations member state?',
			options: ['Tuvalu', 'Niue', 'South Sudan', 'Montenegro'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'In which English county is the city of Portsmouth?',
			options: ['Hampshire', 'Oxfordshire', 'Buckinghamshire', 'Surrey'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the capital of Belarus?',
			options: ['Warsaw', 'Minsk', 'Kiev', 'Vilnius'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which country features a maple leaf on its flag?',
			options: ['Mexico', 'Brazil', 'Canada', 'India'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which city is the biggest in Canada?',
			options: ['Montreal', 'Vancouver', 'Toronto', 'Ottawa'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: "Which is the world's longest river?",
			options: ['Missouri', 'Amazon', 'Yangtze', 'Nile'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of the following geographic features is a ring-shaped coral reef, island, or series of islets?',
			options: ['Peninsula', 'Isthmus', 'Atoll', 'Delta'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'About how many countries are there in the world?',
			options: ['200', '100', '300', '500'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which country claims ownership of the disputed state Kosovo?',
			options: ['Serbia', 'Croatia', 'Albania', 'Macedonia'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of these cities is NOT in England?',
			options: ['Oxford', 'Edinburgh', 'Manchester', 'Southampton'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'The US state of New York has about as many inhabitants as?',
			options: ['Romania', 'Poland', 'Germany', 'Hungary'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the official German name of the Swiss Federal Railways?',
			options: [
				'Schweizerische Bundesbahnen',
				'Schweizerische Nationalbahnen',
				'Bundesbahnen der Schweiz',
				'Schweizerische Staatsbahnen'
			],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'What city  has the busiest airport in the world?',
			options: ['London, England', 'Chicago,Illinois ISA', 'Atlanta, Georgia USA', 'Tokyo,Japan'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'How many countries are inside the United Kingdom?',
			options: ['Four', 'Two', 'Three', 'One'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the capital of Indonesia?',
			options: ['Bandung', 'Medan', 'Jakarta', 'Palembang'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Where is the Volga River?',
			options: ['Bulgaria', 'Russia', 'India', 'Sweden'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the capital of the US State of New York?',
			options: ['Buffalo', 'Albany', 'New York', 'Rochester'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'What country is not a part of Scandinavia?',
			options: ['Norway', 'Sweden', 'Denmark', 'Finland'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the official language of Costa Rica?',
			options: ['Spanish', 'English', 'Portuguese', 'Creole'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'What was the African nation of Zimbabwe formerly known as?',
			options: ['Zambia', 'Mozambique', 'Rhodesia', ' Bulawayo'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Frankenmuth, a US city nicknamed "Little Bavaria", is located in what state?',
			options: ['Pennsylvania', 'Kentucky', 'Michigan', 'Virginia'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Which of these African countries displays a gun on their flag?',
			options: ['Uganda', 'Mozambique', 'Ethiopia', 'Nigeria'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'What is the Finnish word for "Finland"?',
			options: ['Eesti', 'Magyarország', 'Sverige', 'Suomi'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What is the make and model of the tour vehicles in "Jurassic Park" (1993)?',
			options: ['1992 Ford Explorer XLT', '1992 Toyota Land Cruiser', '1992 Jeep Wrangler YJ Sahar', 'Mercedes M-Class'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Who starred as Bruce Wayne and Batman in Tim Burton\'s 1989 movie "Batman"?',
			options: ['George Clooney', 'Val Kilmer', 'Michael Keaton', 'Adam West'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: "Which actress danced the twist with John Travolta in 'Pulp Fiction'?",
			options: ['Kathy Griffin', 'Pam Grier', 'Bridget Fonda', 'Uma Thurman'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Who starred in the film 1973 movie "Enter The Dragon"?',
			options: ['Bruce Lee', 'Jackie Chan', 'Jet Li', ' Yun-Fat Chow'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'The 1939 movie "The Wizard of Oz" contained a horse that changed color, what material did they use to achieve this effect?',
			options: ['Dye', 'Paint', 'CGI Effect', 'Gelatin'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: "Who played Sgt. Gordon Elias in 'Platoon' (1986)?",
			options: ['Willem Dafoe', 'Charlie Sheen', 'Matt Damon', 'Johnny Depp'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which 1994 film did Roger Ebert famously despise, saying "I hated hated hated hated hated this movie".',
			options: ['3 Ninjas Kick Back', 'North', 'The Santa Clause', 'Richie Rich'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In the 1994 movie "Speed", what is the minimum speed the bus must go to prevent to bomb from exploding?',
			options: ['60 mph', '40 mph', '70 mph', '50 mph'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which Batman villain is Mark Hamill known for having voiced?',
			options: ['Two-Face', 'Bane', 'The Joker', 'Hush'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Peter Jackson\'s film series "The Lord of the Rings" was shot entirely in which country?',
			options: ['Scotland', 'Canada', 'New Zealand', 'Iceland'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What was the first James Bond film?',
			options: ['Dr. No', 'Goldfinger', 'From Russia With Love', 'Thunderball'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What was the first feature-length computer-animated movie?',
			options: ['Tron', 'Lion king', '101 Dalmatians', 'Toy Story'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which boxer was famous for striking the gong in the introduction to J. Arthur Rank films?',
			options: ['Freddie Mills', 'Terry Spinks', 'Bombardier Billy Wells', 'Don Cockell'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Who is the director of the 1991 film "Silence of the Lambs"?',
			options: ['Stanley Kubrick', 'Frank Darabont', 'Michael Bay', 'Jonathan Demme'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What is the name of the assassin in the first "Hellboy" movie?',
			options: ['Karl Ruprecht Kroenen', 'Klaus Werner von Krupt', 'Grigori Efimovich Rasputin', 'Ilsa Haupstein'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What year did the James Cameron film "Titanic" come out in theaters?',
			options: ['1996', '1997', '1998', '1999'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which movie of film director Stanley Kubrick is known to be an adaptation of a Stephen King novel?',
			options: ['2001: A Space Odyssey', ' Dr. Strangelove ', 'Eyes Wide Shut', 'The Shining'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: "When was the movie 'Con Air' released?",
			options: ['1997', '1985', '1999', '1990'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which Marvel superhero did Chris Evans play prior to his role as Captain America?',
			options: ['Cyclops', 'Human Torch', 'Iceman', 'Daredevil'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which star actor was in "Top Gun", "Jerry Maguire" and "Born on the Fourth of July"?',
			options: ['Kelly McGillis', 'John Travolta', 'Tom Cruise', 'George Clooney'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In the 2012 film, "The Lorax", who is the antagonist?',
			options: ['Ted Wiggins', 'The Once-Ler', "Aloysius O'Hare", 'Grammy Norma'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What was the last Marx Brothers film to feature Zeppo?',
			options: ['A Night at the Opera', 'Duck Soup', 'A Day at the Races', 'Monkey Business'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: "What was Humphrey Bogart's middle name?",
			options: ['DeForest', 'DeWinter', 'Steven', 'Bryce'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'About how much money did it cost for Tommy Wiseau to make his masterpiece "The Room" (2003)?',
			options: ['$6 Million', '$20,000', '$1 Million', '$10 Million'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In the "Jurassic Park" universe, when did "Jurassic Park: San Diego" begin construction?',
			options: ['1988', '1986', '1985', '1993'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'This movie contains the quote, "I feel the need ... the need for speed!"',
			options: ['Days of Thunder', 'The Color of Money', 'Cocktail', 'Top Gun'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What was the first monster to appear alongside Godzilla?',
			options: ['King Kong', 'Mothra', 'King Ghidora', 'Anguirus'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Leonardo Di Caprio won his first Best Actor Oscar for his performance in which film?',
			options: ['The Revenant', 'The Wolf Of Wall Street', 'Shutter Island', 'Inception'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In the 2002 film "Kung Pow! Enter the Fist", why was Wimp Lo purposely trained wrong?',
			options: ['As a joke', 'For cheating', 'Revenge', 'To test him'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: "In the Friday The 13th series, what is Jason's mother's first name?",
			options: ['Mary', 'Christine', 'Angeline', 'Pamela'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In the "Jurassic Park" universe, what was the first dinosaur cloned by InGen in 1986?',
			options: ['Triceratops', 'Troodon', 'Brachiosaurus', 'Velociraptor'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: "Who directed Marvel's Avengers Endgame?",
			options: ['The Russo Brothers', 'Zack Synder', 'Josh Whedon', 'Kevin Feige'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'What is the name of the first "Star Wars" film by release order?',
			options: ['A New Hope', 'The Phantom Menace', 'The Force Awakens', 'Revenge of the Sith'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Who provided a majority of the songs and lyrics for "Spirit: Stallion of the Cimarron"?',
			options: ['Bryan Adams', 'Smash Mouth', 'Oasis', 'Air Supply'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'After India, which country produces the second most movies per year?',
			options: ['United States', 'China', 'Nigeria', 'France'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which of the following is NOT a quote from the 1942 film Casablanca? ',
			options: [
				'"Here\'s lookin\' at you, kid."',
				'"Frankly, my dear, I don\'t give a damn."',
				'"Of all the gin joints, in all the towns, in all the world, she walks into mine..."',
				'"Round up the usual suspects."'
			],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: "In which African country was the 2006 film 'Blood Diamond' mostly set in?",
			options: ['Sierra Leone', 'Liberia', 'Burkina Faso', 'Central African Republic'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which town is the setting for the Disney movie The Love Bug (1968)?',
			options: ['Los Angeles', 'Sacramento', 'San Francisco', 'San Jose'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Which musical artist had a prominent role in the 2017 film "Kingsman: The Golden Circle"?',
			options: ['Elton John', 'Lady Gaga', 'Rihanna', 'Justin Bieber'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'In the 2010 Nightmare on Elm Street reboot, who played Freddy Kruger?',
			options: ['Tyler Mane', 'Jackie Earle Haley', 'Derek Mears', 'Gunnar Hansen'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Bela Lugosi was a Hungarian-American actor best known for his starring role of what 1931 horror film?',
			options: ['Dr Frankenstein', 'Werewolf', 'The Creature from the Black Lagoon', 'Count Dracula'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'What team did England beat in the semi-final stage to win in the 1966 World Cup final?',
			options: ['West Germany', 'Portugal', 'Soviet Union', 'Brazil'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Who was the top scorer of the 2014 FIFA World Cup?',
			options: ['Thomas Müller', 'Lionel Messi', 'James Rodríguez', 'Neymar'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'What is the exact length of one non-curved part in Lane 1 of an Olympic Track?',
			options: ['100m', '100yd', '84.39m', '109.36yd'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Which country hosted the 2018 FIFA World Cup?',
			options: ['Russia', 'Germany', 'United States', 'Saudi Arabia'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Which country is hosting the 2022 FIFA World Cup?',
			options: ['Qatar', 'Uganda', 'Vietnam', 'Bolivia'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Which year was the third Super Bowl held?',
			options: ['1968', '1971', '1969', '1970'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Which of these NHL players have never won a Hart Trophy for Regular Season MVP?',
			options: ['Chris Pronger', 'Jose Theodore', 'Steve Yzerman', 'Henrik Sedin'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'What national team won the first UEFA Nations League?',
			options: ['Netherlands', 'England', 'Switzerland', 'Portugal'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Which of the following pitchers was named National League Rookie of the Year for the 2013 season?',
			options: ['Jacob deGrom', 'Jose Fernandez', 'Shelby Miller', 'Matt Harvey'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Which country won the 2018 FIFA World Cup hosted in Russia?',
			options: ['France', 'Croatia', 'Belgium', 'England'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Which NBA player has the most games played over the course of their career?',
			options: ['Kareem Abdul-Jabbar', 'Kevin Garnett', 'Kobe Bryant', 'Robert Parish'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'In what sport is a "shuttlecock" used?',
			options: ['Badminton', 'Table Tennis', 'Rugby', 'Cricket'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Who won NFL Super Bowl LI? (51)',
			options: ['Falcons', 'Broncos', 'Eagles', 'Patriots'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Which team was the 2015-2016 NBA Champions?',
			options: ['Golden State Warriors', 'Toronto Raptors', 'Cleveland Cavaliers', 'Oklahoma City Thunders'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Which team won the 2015-16 English Premier League?',
			options: ['Liverpool', 'Leicester City', 'Cheslea', 'Manchester United'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'What sport features the terms love, deuce, match and volley?',
			options: ['Tennis', 'Cricket', 'Basketball', 'Curling'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'How many soccer players should be on the field at the same time?',
			options: ['20', '22', '24', '26'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Which African American is in part responsible for integrating  Major League baseball?',
			options: ['Jackie Robinson', 'Curt Flood', 'Roy Campanella', 'Satchell Paige'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Who won the "Champions League" in 1999?',
			options: ['Barcelona', 'Manchester United', 'Bayern Munich', 'Liverpool'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Which professional wrestler fell from the rafters to his death during a live Pay-Per-View event in 1999?',
			options: ['Chris Benoit', 'Lex Luger', 'Al Snow', 'Owen Hart'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Which female player won the gold medal of table tennis singles in 2016 Olympics Games?',
			options: ['LI Xiaoxia (China)', 'Ai FUKUHARA (Japan)', 'Song KIM (North Korea)', 'DING Ning (China)'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Who has played the most tournaments on the Brazilian national soccer team?',
			options: ['Cafu', 'Ronaldo', 'Kaká', 'Roberto Carlos'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'What is "The Sport of Kings"?',
			options: ['Horse Racing', 'Chess', 'Jousting', 'Fencing'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Who won the 2011 Stanley Cup?',
			options: ['Boston Bruins', 'Montreal Canadiens', 'New York Rangers', 'Toronto Maple Leafs'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Which car manufacturer won the 2017 24 Hours of Le Mans?',
			options: ['Porsche', 'Toyota', 'Audi', 'Chevrolet'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: "Which wrestler won the 2019 Men's Royal Rumble?",
			options: ['Seth Rollins', 'Braun Strowman', 'AJ Styles', 'Andrade'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'The song "Three Lions" by the Lightning Seeds was made for which major football event in 1996?',
			options: ['World Cup', 'Champions League', 'European Championships', 'Confederations Cup'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Who was the British professional wrestler Shirley Crabtree better known as?',
			options: ['Giant Haystacks', 'Kendo Nagasaki', 'Masambula', 'Big Daddy'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Which of these teams isn\'t a member of the NHL\'s "Original Six" era?',
			options: ['New York Rangers', 'Toronto Maple Leafs', 'Boston Bruins', 'Philadelphia Flyers'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: "Which city features all of their professional sports teams' jersey's with the same color scheme?",
			options: ['Pittsburgh', 'New York', 'Seattle', 'Tampa Bay'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Which driver has been the Formula 1 world champion for a record 7 times?',
			options: ['Ayrton Senna', 'Michael Schumacher', 'Fernando Alonso', 'Jim Clark'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'In Canadian football, scoring a rouge is worth how many points?',
			options: ['2', '3', '1', '4'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'What was the year of estabilishment of the Bari Italian Football Club?',
			options: ['1945', '1908', '2014', '1895'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'A stimpmeter measures the speed of a ball over what surface?',
			options: [' Football Pitch', 'Golf Putting Green', 'Cricket Outfield', 'Pinball Table'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: "What is the name of Manchester United's home stadium?",
			options: ['Old Trafford', 'Anfield', 'City of Manchester Stadium', 'St James Park'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: "The Rio 2016 Summer Olympics held it's closing ceremony on what date?",
			options: ['August 23', 'August 19', 'August 17', 'August 21'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'The Windows OS was delevoped by which company?',
			options: ['Apple', 'Microsoft', 'Nokia', 'IBM'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'In programming, the ternary operator is mostly defined with what symbol(s)?',
			options: ['??', 'if then', '?:', '?'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'What is the most preferred image format used for logos in the Wikimedia database?',
			options: ['.png', '.jpeg', '.svg', '.gif'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'What does the term GPU stand for?',
			options: ['Graphics Processing Unit', 'Gaming Processor Unit', 'Graphite Producing Unit', 'Graphical Proprietary Unit'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Dutch computer scientist Mark Overmars is known for creating which game development engine?',
			options: ['Stencyl', 'Game Maker', 'Construct', 'Torque 2D'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'The C programming language was created by this American computer scientist. ',
			options: ['Tim Berners Lee', 'al-Khwārizmī', 'Dennis Ritchie', 'Willis Ware'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'What was the first company to use the term "Golden Master"?',
			options: ['IBM', 'Microsoft', 'Google', 'Apple'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'What does AD stand for in relation to Windows Operating Systems? ',
			options: ['Alternative Drive', 'Automated Database', 'Active Directory', 'Active Department'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which of these is not a key value of Agile software development?',
			options: [
				'Individuals and interactions',
				'Customer collaboration',
				'Responding to change',
				'Comprehensive documentation'
			],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'What is the name of the default theme that is installed with Windows XP?',
			options: ['Neptune', 'Whistler', 'Bliss', 'Luna'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'The Harvard architecture for micro-controllers added which additional bus?',
			options: ['Instruction', 'Address', 'Data', 'Control'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which of these is not a layer in the OSI model for data communications?',
			options: ['Connection Layer', 'Application Layer', 'Transport Layer', 'Physical Layer'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: '.at is the top-level domain for what country?',
			options: ['Argentina', 'Australia', 'Austria', 'Angola'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which programming language was developed by Sun Microsystems in 1995?',
			options: ['Python', 'Solaris OS', 'C++', 'Java'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'CMOS is tech used for constructing integrated circuits. What does CMOS stand for?',
			options: [
				'Complementary magnetic-ohms-semiconductor',
				'Complementary metal&ndash;oxide&ndash;semiconductor',
				'Computer-made operating system',
				'Computer-made oscillating static'
			],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'What was the name of the security vulnerability found in Bash in 2014?',
			options: ['Heartbleed', 'Bashbug', 'Stagefright', 'Shellshock'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'What is the maximum value of a 32-bit signed binary integer?',
			options: ['255', '2,147,483,647', '2048', '9,223,372,036,854,775,807'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: "What does the 'S' in the RSA encryption algorithm stand for?",
			options: ['Secure', 'Schottky', 'Stable', 'Shamir'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: "What is the commonly used keyboard shortcut for the 'Copy' function on Windows OS?",
			options: ['Ctrl + X', 'Alt + C', 'Alt + X', 'Ctrl + C'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Approximately how many Apple I personal computers were created?',
			options: ['200', '100', '500', '1000'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'How fast is USB 3.1 Gen 2 theoretically?',
			options: ['5 Gb/s', '8 Gb/s', '1 Gb/s', '10 Gb/s'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Unix Time is defined as the number of seconds that have elapsed since when?',
			options: [
				'Midnight, July 4, 1976',
				"Midnight on the creator of Unix's birthday",
				'Midnight, January 1, 1970',
				'Midnight, July 4, 1980'
			],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'In computing, what does MIDI stand for?',
			options: [
				'Musical Interface of Digital Instruments',
				'Musical Instrument Digital Interface',
				'Modular Interface of Digital Instruments',
				'Musical Instrument Data Interface'
			],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question:
				'Originally used in PCM adapters, what frequency is the standard for sampling audio in the Compact Disc Digital Audio format?',
			options: ['32.0 kHz', '1.5 MHz', '44.1 kHz', '20.5 kHz'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which of the following physical typologies are used with Ethernet Networks?',
			options: ['Star', 'Ring', 'Mesh', 'Hex'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'What was the name of the image that features as the default background wallpaper for Windows XP?',
			options: ['Bliss', 'Azul', 'Red moon desert', 'Tulips'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'What vulnerability ranked #1 on the OWASP Top 10 in 2013?',
			options: ['Broken Authentication', 'Cross-Site Scripting', 'Insecure Direct Object References', 'Injection '],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Laserjet and inkjet printers are both examples of what type of printer?',
			options: ['Non-impact printer', 'Impact printer', 'Daisywheel printer', 'Dot matrix printer'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'What does the computer software acronym JVM stand for?',
			options: ['Java Vendor Machine', 'Java Visual Machine', 'Java Virtual Machine', 'Just Virtual Machine'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which computer language would you associate Django framework with?',
			options: ['C#', 'C++', 'Java', 'Python'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'On a standard American QWERTY keyboard, what symbol will you enter if you hold the shift key and press 1?',
			options: ['Exclamation Mark', 'Dollar Sign', 'Percent Sign', 'Asterisk'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Generally, which component of a computer draws the most power?',
			options: ['Video Card', 'Hard Drive', 'Processor', 'Power Supply'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Which of these programming languages is a low-level language?',
			options: ['Python', 'C#', 'Pascal', 'Assembly'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'What was the first commerically available computer processor?',
			options: ['Intel 4004', 'Intel 486SX', 'TMS 1000', 'AMD AM386'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'All of the following programs are classified as raster graphics editors EXCEPT:',
			options: ['Inkscape', 'Paint.NET', 'GIMP', 'Adobe Photoshop'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'How many kilobytes in one gigabyte (in decimal)?',
			options: ['1024', '1000', '1000000', '1048576'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'What does the term USB stand for?',
			options: ['Universal Simtex Blot', 'Universal Serial Bus', 'Unified Signal Bus', 'Unityped Semtex Backer'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'What bird is born with claws on its wing digits?',
			options: ['Cormorant', 'Cassowary', 'Secretary bird', 'Hoatzin'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Which dog breed is named after a region in Croatia',
			options: ['Pekingnese', 'Dalmatian', 'Chihuahua ', 'Pomeranian'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Which of these animals are not real?',
			options: ['Nemean Lion', 'Sea Dragon', 'Tasmanian Devil', 'Giant Squid'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Which of the following is another name for the "Poecilotheria Metallica Tarantula"?',
			options: ['Gooty', 'Hopper', 'Silver Stripe', 'Woebegone'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'What is the scientific name for modern day humans?',
			options: ['Homo Ergaster', 'Homo Erectus', 'Homo Sapiens', 'Homo Neanderthalensis'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'What is the average amount of chinchillas born into a single litter?',
			options: ['10-15', '5-8', '2-3', '15-18'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: "What is Grumpy Cat's real name?",
			options: ['Tardar Sauce', 'Sauce', 'Minnie', 'Broccoli'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'What is the average lifespan of a domestic rabbit?',
			options: ['1-2 years', '8-12 years', '4-7 years', '14-20 years'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Cashmere is the wool from which kind of animal?',
			options: ['Sheep', 'Camel', 'Goat', 'Llama'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'A carnivorous animal eats flesh, what does a nucivorous animal eat?',
			options: ['Nothing', 'Fruit', 'Nuts', 'Seaweed'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'What is the name of the copper-rich protein that creates the blue blood in the Antarctic octopus?',
			options: ['Cytochrome', 'Iron', 'Methionine', 'Hemocyanin'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'What is the scientific name of the Common Chimpanzee?',
			options: ['Gorilla gorilla', 'Pan troglodytes', 'Pan paniscus', 'Panthera leo'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'What scientific family does the Aardwolf belong to?',
			options: ['Canidae', 'Felidae', 'Hyaenidae', 'Eupleridae'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'What is the scientific name of the Budgerigar?',
			options: ['Nymphicus hollandicus', 'Melopsittacus undulatus', 'Pyrrhura molinae', 'Ara macao'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Which breed of dog is traditionally associated with firefighters?',
			options: ['Dalmatians', 'German Shepard', 'Great Dane', 'Mastiff'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'What is the scientific name for the Bald Eagle?',
			options: ['Haliaeetus Leucocephalus ', 'Tyto Alba', 'Cyanocitta Cristata', 'Aquila Chrysaetos'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'What is the full title of the Prime Minister of the UK?',
			options: [
				'First Lord of the Treasury',
				'Duke of Cambridge',
				"Her Majesty's Loyal Opposition",
				'Manager of the Crown Estate'
			],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'What is the defining characteristic of someone who is described as hirsute?',
			options: ['Rude', 'Funny', 'Tall', 'Hairy'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Which of these companies does NOT manufacture automobiles?',
			options: ['Nissan', 'GMC', 'Fiat', 'Ducati'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Sciophobia is the fear of what?',
			options: ['Eating', 'Bright lights', 'Transportation', 'Shadows'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'This field is sometimes known as "The Dismal Science."',
			options: ['Philosophy', 'Politics', 'Physics', 'Economics'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Which country has the Union Jack in its flag?',
			options: ['South Africa', 'Canada', 'Hong Kong', 'New Zealand'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Out of these four buildings, which one is the tallest, with a height of 1,776 ft (541.3 m)?',
			options: [
				'Taipei 101, Taiwan',
				'Willis Tower, United States',
				'Jin Mao Tower, China',
				'One World Trade Center, United States'
			],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'What direction does the Statue of Liberty face?',
			options: ['Southeast', 'Southwest', 'Northwest', 'Northeast'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Which sign of the zodiac is represented by the Crab?',
			options: ['Cancer', 'Libra', 'Virgo', 'Sagittarius'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: "Which of the General Mills Corporation's monster cereals was the last to be released in the 1970's?",
			options: ['Fruit Brute', 'Count Chocula', 'Franken Berry', 'Boo-Berry'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'What is the name of the very first video uploaded to YouTube?',
			options: ['tribute', 'Me at the zoo', 'carrie rides a truck', 'Her new puppy from great grandpa vern.'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'What fruit is a traditional ingredient of a Black Forest Gateau?',
			options: ['Apricots', 'Cherries', 'Raisins', 'Apples'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'What is the name of the extra pedal on a manual or standard transmission car?',
			options: ['Shifter', 'Booster', 'Parking Brake', 'Clutch'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Bob and Mike Bryan were well known brothers in which sport?',
			options: ['Basketball', 'Football', 'Tennis', 'Baseball'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Which mountain has the highest peak in North America?',
			options: ['Mount Saint Elias, US/Canada border', 'Mount Logan, Canada', 'Pico de Orizaba, Mexico', 'Denali, USA'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Which American president appears on a one dollar bill?',
			options: ['Thomas Jefferson', 'Abraham Lincoln', 'George Washington', 'Benjamin Franklin'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'What is the German word for "spoon"?',
			options: ['Löffel', 'Gabel', 'Messer', 'Essstäbchen'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'What year was Walt Disney born?',
			options: ['1901', '1902', '1903', '1900'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'The buried remains of which English explorer of Australia were found in London  in January 2019? ',
			options: ['William Bourke', 'Abel Tasman', 'Matthew Flinders', 'Dirk Hartog'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'What is the last letter of the Greek alphabet?',
			options: ['Omega', 'Mu', 'Epsilon', 'Kappa'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Which of the following languages does NOT use gender as a part of its grammar?',
			options: ['German', 'Danish', 'Polish', 'Turkish'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Apple co-founder Steve Jobs died from complications of which form of cancer?',
			options: ['Bone', 'Pancreatic', 'Liver', 'Stomach'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Which of these words refers to something made, distributed, or sold illegally?',
			options: ['Bootblack', 'Bootleg', 'Bootlace', 'Bootstrap'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: "What is the famous Papa John's last name?",
			options: ['Chowder', 'Schnatter', 'Williams', 'ANDERSON'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Originally another word for poppy, coquelicot is a shade of what?',
			options: ['Red', 'Green', 'Blue', 'Pink'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'The word "abulia" means which of the following?',
			options: [
				'The inability to make decisions',
				'The inability to stand up',
				'The inability to concentrate on anything',
				"A feverish desire to rip one's clothes off"
			],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Which of the following is not an Ivy League University?',
			options: ['University of Pennsylvania', 'Harvard', 'Stanford', 'Princeton'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'What is the official language of Brazil?',
			options: ['Brazilian', 'Spanish', 'English', 'Portuguese'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'What company developed the vocaloid Hatsune Miku?',
			options: ['Sega', 'Sony', 'Crypton Future Media', 'Yamaha Corporation'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Frank Lloyd Wright was the architect behind what famous building?',
			options: ['Villa Savoye', 'The Guggenheim', 'Sydney Opera House', 'The Space Needle'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Which essential condiment is also known as Japanese horseradish?',
			options: ['Mentsuyu', 'Karashi', 'Ponzu', 'Wasabi '],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Virgin Trains, Virgin Atlantic and Virgin Racing, are all companies owned by which famous entrepreneur?   ',
			options: ['Alan Sugar', 'Donald Trump', 'Richard Branson', 'Bill Gates'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'In which country was the 1992 Summer Olympics Games held?',
			options: ['Spain', 'Russia', 'Korea', 'USA'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'What is the largest rapid transit system in the world by number of stations, with 472 stations in operation?',
			options: ['New York City Subway', 'Shanghai Metro', 'London Underground', 'Berlin U-Bahn'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: "What is Cuba's official, most widely spoken language?",
			options: ['Portuguese', 'French', 'Italian', 'Spanish'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'What is H2O?',
			options: ['Water', 'Oxygen', 'Hydrogen', 'None'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'How many letters are there in the English alphabet?',
			options: ['28', '26', '23', '24'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Which one of the following rhythm games was made by Harmonix?',
			options: ['Meat Beat Mania', 'Guitar Hero Live', 'Rock Band', 'Dance Dance Revolution'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Which river flows through the Scottish city of Glasgow?',
			options: ['Clyde', 'Tay', 'Dee', 'Tweed'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: "What is the world's most expensive spice by weight?",
			options: ['Cinnamon', 'Cardamom', 'Saffron', 'Vanilla'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'Which of the following Mesopotamian mythological figures was NOT a deity?',
			options: ['Enki', 'Enlil', 'Enkidu', 'Enkimdu'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question:
				'Which Greek & Roman god was known as the god of music, truth and prophecy, healing, the sun and light, plague, poetry, and more?',
			options: ['Aphrodite', 'Apollo', 'Artemis', 'Athena'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: "What was the punishment for Sysiphus's craftiness?",
			options: [
				'Cursed to roll a boulder up a hill for eternity.',
				'Tied to a boulder for eternity, being pecked by birds.',
				'Standing in a lake filled with water he could not drink.',
				'To fell a tree that regenerated after every axe swing.'
			],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question:
				"This Greek goddess's name was chosen for the dwarf planet responsible for discord on Pluto's classification amongst astronomers.",
			options: ['Charon', 'Ceres', 'Dysnomia', 'Eris'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Which of the following is not true about the life of Tiresias?',
			options: [
				'Sailed with the Argonauts to find the golden fleece',
				'Athena turned him into a woman, and then years later back into a man',
				'Hera blinded him after he agreed with Zeus in an argument',
				'Revealed to Oedipus that Oedipus had married his own mother'
			],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'In Norse mythology, what is the name of the serpent which eats the roots of the ash tree Yggdrasil?',
			options: ['Bragi', 'Nidhogg', 'Odin', 'Ymir'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'The Norse god Odin has two pet crows named "Huginn" and "Muninn".  What do their names mean?',
			options: ['Thought & Memory', 'Power & Peace', 'War & Learning', 'Sleeping & Waking'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Which of these companies does NOT manufacture motorcycles?',
			options: ['Honda', 'Kawasaki', 'Yamaha', 'Toyota'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: "Which country has the international vehicle registration letter 'A'?",
			options: ['Austria', 'Afghanistan', 'Australia', 'Armenia'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Which animal features on the logo for Abarth, the motorsport division of Fiat?',
			options: ['Scorpion', 'Snake', 'Bull', 'Horse'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Which of the following car models has been badge-engineered (rebadged) the most?',
			options: ['Isuzu Trooper', 'Holden Monaro', 'Suzuki Swift', 'Chevy Camaro'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Which supercar company is from Sweden?',
			options: ['Bugatti', 'Lamborghini', 'McLaren', 'Koenigsegg'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Which one of the following is not made by Ford?',
			options: ['Fusion', 'Model A', 'F-150', 'Camry'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Jaguar Cars was previously owned by which car manfacturer?',
			options: ['Chrysler', 'General Motors', 'Fiat', 'Ford'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'How many wheels does a unicycle have?',
			options: ['1', '4', '3', '6'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Which of the following vehicles featured a full glass roof at base model?',
			options: ['Renault Avantime', 'Chevy Volt', 'Mercedes-Benz A-Class', 'Honda Odyssey'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Which of these is NOT a car model produced by Malaysian car manufacturer Proton?',
			options: ['Saga', 'Kelisa', 'Perdana', 'Inspira'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'What manufacturer made the car used in Back to the Future?',
			options: ['Ford', 'Toyota', 'Daihatsu', 'DeLorean'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'What is the fastest road legal car in the world?',
			options: ['Hennessy Venom GT', 'Bugatti Veyron Super Sport', 'Koenigsegg Agera RS', 'Pagani Huayra BC'],
			correct: 2
		},
		{
			category: 'VEHICLES',
			question: "Volkswagen's legendary VR6 engine has cylinders positioned at what degree angle?",
			options: ['30 Degree', '15 Degree', '45 Degree', '90 Degree'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: "What is the name of the three headed dog in Harry Potter and the Sorcerer's Stone?",
			options: ['Spike', 'Fluffy', 'Poofy', 'Spot'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question:
				'This play is generally considered to be the most adaptable of Shakespeare\'s works, and follows two "star-crossed lovers".',
			options: ['Romeo and Juliet', 'Hamlet', 'The Tempest', 'King Lear'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Which of the following authors was not born in England? ',
			options: ['Graham Greene', 'H G Wells', 'Arthur C Clarke', 'Arthur Conan Doyle'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'George Orwell wrote this book, which is often considered a statement on government oversight.',
			options: ['1984', 'The Old Man and the Sea', 'Catcher and the Rye', 'To Kill a Mockingbird'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'What is the name of the gang that Ponyboy is a part of in the book, The Outsiders?',
			options: ['The Outsiders', 'The Mafia', 'The Socs', 'The Greasers'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'In Michael Crichton\'s novel "Jurassic Park", John Hammond meets his demise at the claws of which dinosaur?',
			options: ['Dilophosaurus', 'Tyrannosaurus Rex', 'Procompsognathus', 'Velociraptor'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'What is the title of the first Sherlock Holmes book by Arthur Conan Doyle?',
			options: ['The Sign of the Four', 'A Study in Scarlet', 'A Case of Identity', 'The Doings of Raffles Haw'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'Which is NOT a book in the Harry Potter Series?',
			options: ['The Chamber of Secrets', 'The House Elf', 'The Prisoner of Azkaban', 'The Deathly Hallows'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'In the "Harry Potter" series, what is Headmaster Dumbledore\'s full name?',
			options: [
				'Albus Valum Jetta Mobius Dumbledore',
				'Albus James Lunae Otto Dumbledore',
				'Albus Percival Wulfric Brian Dumbledore',
				'Albus Valencium Horatio Kul Dumbledore'
			],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'The novel "Jane Eyre" was written by what author? ',
			options: ['Emily Brontë', 'Jane Austen', 'Louisa May Alcott', 'Charlotte Brontë'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'Which famous spy novelist wrote the childrens\' story "Chitty-Chitty-Bang-Bang"?',
			options: ['Joseph Conrad', 'John Buchan', 'Ian Fleming', 'Graham Greene'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'Where does the book "The Silence of the Lambs" get its title from?',
			options: [
				'The relation it has with killing the innocents',
				"The villain's favourite meal",
				"The main character's trauma in childhood",
				'The voice of innocent people being shut by the powerful'
			],
			correct: 2
		},
		{
			category: 'BOOKS',
			question:
				'In the novel 1984, written by George Orwell, what is the name of the totalitarian regime that controls Oceania?',
			options: ['INGSOC', 'Neo-Bolshevism', 'Obliteration of the Self', 'Earth Alliance'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: "American illustrator and writer Maurice Sendak is most well-known for writing which children's book?",
			options: [
				'The Neverending Story',
				'Where The Wild Things Are',
				'Charlie and the Chocolate Factory',
				'The Cat in the Hat'
			],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'Who wrote the novel "Moby-Dick"?',
			options: ['William Golding', 'William Shakespeare', 'Herman Melville', 'J. R. R. Tolkien'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'What position does Harry Potter play in Quidditch?',
			options: ['Seeker', 'Beater', 'Chaser', 'Keeper'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Which of these books was NOT written by the Czech author Karel Čapek?',
			options: [
				'The War with the Newts',
				'Journey to the Center of the Earth',
				"R.U.R. (Rossum's Universal Robots)",
				'Dashenka, or the Life of a Puppy'
			],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'Who wrote the young adult novel "The Fault in Our Stars"?',
			options: ['John Green', 'Stephenie Meyer', 'Suzanne Collins', 'Stephen Chbosky'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Who wrote "The Scarlet Letter", published in 1850?',
			options: ['Washington Irving', 'James Fenimore Cooper', 'Catherine Maria Sedgwick', 'Nathaniel Hawthorne'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: "In the Harry Potter universe, what is Cornelius Fudge's middle name?",
			options: ['James', 'Harold', 'Christopher', 'Oswald'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: "In Terry Pratchett's Discworld novel 'Wyrd Sisters', which of these are not one of the three main witches?",
			options: ['Winny Hathersham', 'Granny Weatherwax', 'Nanny Ogg', 'Magrat Garlick'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Which of the following is NOT a work done by Shakespeare?',
			options: ['Measure For Measure', 'Titus Andronicus', 'Cymbeline', 'Trial of Temperance'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'Who wrote the "A Song of Ice And Fire" fantasy novel series?',
			options: ['George Lucas', 'George R. R. Martin', 'George Orwell', 'George Eliot'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: "What is the name of the protagonist of J.D. Salinger's novel Catcher in the Rye?",
			options: ['Fletcher Christian', 'Jay Gatsby', 'Randall Flagg', 'Holden Caulfield'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: "By what nickname is Jack Dawkins known in the Charles Dickens novel, 'Oliver Twist'?",
			options: ['The Artful Dodger', 'Fagin', "Bull's-eye", 'Mr. Fang'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'In the book "The Martian", how long was Mark Watney trapped on Mars (in Sols)?',
			options: ['549 Days', '765 Days', '401 Days', '324 Days'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Who wrote the children\'s story "The Little Match Girl"?',
			options: ['Charles Dickens', 'Lewis Carroll', 'Hans Christian Andersen', 'Oscar Wilde'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'What is the name of Eragon\'s dragon in "Eragon"?',
			options: ['Glaedr', 'Thorn', 'Arya', 'Saphira'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question:
				'What was Sir Handel\'s original name in "The Railway Series" and it\'s animated counterpart "Thomas and Friends?"',
			options: ['Eagle', 'Kyte', 'Falcon', 'Swallow'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: "According to Bram Stoker's novel, in which British coastal town did Dracula come ashore?",
			options: ['Scarborough', 'Whitby', 'Brighton', 'Portsmouth'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'Who was the author of the 1954 novel, "Lord of the Flies"?',
			options: ['William Golding', 'Stephen King', 'F. Scott Fitzgerald', 'Hunter Fox'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Which Russian author wrote the epic novel War and Peace?',
			options: ['Fyodor Dostoyevsky', 'Leo Tolstoy', 'Alexander Pushkin', 'Vladimir Nabokov'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: "What's the second book in George R. R. Martin's 'A Song of Ice and Fire' series?",
			options: ['A Dance with Dragons', 'A Storm of Swords', 'A Feast for Crows', 'A Clash of Kings'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'What book series published by Jim Butcher follows a wizard in modern day Chicago?',
			options: ['A Hat in Time', 'The Dresden Files', 'The Cinder Spires', 'My Life as a Teenage Wizard'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'J.K. Rowling completed "Harry Potter and the Deathly Hallows" in which hotel in Edinburgh, Scotland?',
			options: ['The Dunstane Hotel', 'Hotel Novotel', 'Sheraton Grand Hotel & Spa', 'The Balmoral'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'In The Lies Of Locke Lamora, what does "Lamora" mean in Throne Therin?',
			options: ['Thievery', 'Justice', 'Shadow', 'Chaos'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'Which of these does Charlie NOT read in The Perks of Being a Wallflower?',
			options: ['Hamlet', 'The Grapes of Wrath', 'The Great Gatsby', 'Peter Pan'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'What was the first ever entry written for the SCP Foundation collaborative writing project?',
			options: ['SCP-173', 'SCP-001', 'SCP-999', 'SCP-1459'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question:
				'Which novel by John Grisham was conceived on a road trip to Florida while thinking about stolen books with his wife?',
			options: ['Rogue Lawyer', 'Gray Mountain', 'The Litigators', 'Camino Island'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'By what name was the author Eric Blair better known?',
			options: ['Aldous Huxley', 'Ernest Hemingway', 'George Orwell', 'Ray Bradbury'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'Mary Shelley is the author of what classic horror story?',
			options: ['Dracula', 'Strange Case of Dr Jekyll and Mr Hyde', 'Frankenstein', 'The Legend of Sleepy Hollow'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: "What is Ron Weasley's middle name?",
			options: ['Bilius', 'Arthur', 'John', 'Dominic'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: "What is the name of Sherlock Holmes's brother?",
			options: ['Mederi Holmes', 'Mycroft Holmes', 'Martin Holmes', 'Herbie Hancock Holmes'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'In The Lies of Locke Lamora, what title is Locke known by in the criminal world?',
			options: ['The Thorn of Camorr', 'The Rose of the Marrows', 'The Thorn of Emberlain', 'The Thorn of the Marrows'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Who was the original author of Frankenstein?',
			options: ['Edgar Allan Poe', 'Mary Shelley', 'Bram Stoker', 'H. P. Lovecraft'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'What is the make and model of the tour vehicles in "Jurassic Park" (1990)?',
			options: ['1989 Jeep Wrangler YJ Sahar', '1989 Ford Explorer XLT', 'Mercedes M-Class', '1989 Toyota Land Cruiser'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'George Orwell\'s novel "Animal Farm" was inspired by which historical event?',
			options: [
				"The rise of communism and Stalin's policies.",
				'The rise of Imperial Japan and Pacific control.',
				"The rise of fascism and Hitler's influences.",
				"Franklin D. Roosevelt's New Deal and its effects on The Great Depression."
			],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'What is the name of the town in which Lily and James Potter are buried?',
			options: ["Godric's Hollow", 'Hogsmeade', 'Ottery St. Catchpole', 'Little Hangleton'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Which of the following is not a work authored by Fyodor Dostoevsky?',
			options: ['Notes from the Underground', 'Anna Karenina', 'Crime and Punishment', 'The Brothers Karamazov'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'In the "Harry Potter" novels, what must a Hogwarts student do to enter the Ravenclaw Common Room?',
			options: ['Answer a riddle', 'Rhythmically tap barrels with a wand', 'Speak a password', 'Knock in sequence'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Which member of the Wu-Tang Clan had only one verse in their debut album Enter the Wu-Tang (36 Chambers)?',
			options: ['Method Man', 'Inspectah Deck', 'GZA', 'Masta Killa'],
			correct: 3
		},
		{
			category: 'MUSIC',
			question: 'Which popular jazz standard begins with the line "Someday, when I\'m awfully low"?',
			options: ['Autumn Leaves', 'Dream a Little Dream of Me', 'All the Things You Are', 'The Way You Look Tonight'],
			correct: 3
		},
		{
			category: 'MUSIC',
			question: 'What is the stage name of New Zealand singer Phillipa "Pip" Brown?',
			options: ['Ladyhawke', 'Lorde', 'Kesha', 'Anika Moa'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: "What was the progressive rock band Rush's first single?",
			options: ['Tom Sawyer', 'Working Man', 'Owner of a Lonely Heart', 'Not Fade Away'],
			correct: 3
		},
		{
			category: 'MUSIC',
			question: 'Which classical composer wrote the "Moonlight Sonata"?',
			options: ['Chief Keef', 'Wolfgang Amadeus Mozart', 'Ludvig Van Beethoven', 'Johannes Brahms'],
			correct: 2
		},
		{
			category: 'MUSIC',
			question: 'The song "Old Town Road" by American rapper Lil Nas X samples the song "34 Ghosts IV" by which band?',
			options: ['Death Grips', 'Nine Inch Nails', 'Iron Maiden', 'Animal Collective'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: "What rock group is named after a gym teacher who taught at the original band members' high school?",
			options: ['Jefferson Airplane', 'Pink Floyd', 'The Byrds', 'Lynyrd Skynyrd'],
			correct: 3
		},
		{
			category: 'MUSIC',
			question: 'Who had hits in the 70s with the songs "Lonely Boy" and "Never Let Her Slip Away"?',
			options: ['Elton John', 'Leo Sayer', 'Andrew Gold', 'Barry White '],
			correct: 2
		},
		{
			category: 'MUSIC',
			question: 'What was the best selling album of 2015?',
			options: ['Adele, 25', 'Fetty Wap, Fetty Wap', 'Taylor Swift, 1989', 'Justin Bieber, Purpose'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Who was the first white band to play the Apollo Theater?',
			options: ['Buddy Holly and The Crickets', 'Chuck Berry', 'The Beatles', 'Elvis'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'What was the title of ABBA`s first UK hit single?',
			options: ['Mamma Mia', 'Fernando', 'Dancing Queen', 'Waterloo'],
			correct: 3
		},
		{
			category: 'MUSIC',
			question: 'What date is referenced in the 1971 song "September" by Earth, Wind & Fire?',
			options: ['26th of September', '21st of September', '23rd of September', '24th of September'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'Which genre of music is John Coltrane primarily associated with?',
			options: ['Rock and Roll', 'Jazz', 'Death Metal', 'Folk'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: '"Make You Feel My Love" was originally written and performed by which singer-songwriter?',
			options: ['Elvis', 'Bob Dylan', 'Adele', 'Billy Joel'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'Which brass instrument has the lowest pitch in an orchestra?',
			options: ['Trumpet', 'Saxophone', 'Trombone', 'Tuba'],
			correct: 3
		},
		{
			category: 'MUSIC',
			question: 'African-American performer Sammy Davis Jr. was known for losing which part of his body in a car accident?',
			options: ['Right Ear', 'Left Eye', 'Right Middle Finger', 'Nose'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: "What album is the song 'New Slang' by The Shins found on?",
			options: ['Wincing The Night Away', 'Oh, Inverted World', 'Chutes Too Narrow', 'Port Of Morrow'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'Which famous artist featured on Rowdy Rebel\'s 2015 song "Computers"?',
			options: ['Bobby Shmurda ', 'Lil Wayne', 'Will.I.AM', 'Kendrick Lamar'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'When did Radiohead release their album "OK Computer"?',
			options: ['1995', '1997', '2000', '1993'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question:
				'Long John Baldry, the voice of Dr. Robotnik in Adventures Of Sonic The Hedgehog, was in a band with which music artist in the 1960s?',
			options: ['Freddie Mercury', 'Elton John', 'Paul McCartney', 'Johnny Cash'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question:
				'Moby, an American DJ, singer, and musician, achieved worldwide success for the 1999 release of which of the following albums?',
			options: ['Everything Is Wrong', 'Play', 'Moby', '18'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'What song includes the words "Numa Numa" which was subject to a Viral Video in 2004?',
			options: ['Dragostea Din Tei', 'Despacito', 'Gangnam Style', 'Asereje'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: "What is the name of French electronic music producer Madeon's 2015 debut studio album?",
			options: ['The City', 'Adventure', 'Icarus', 'Pop Culture'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'What band featured Sting, Stewart Copeland and Andy Summers?',
			options: ['The Police', 'Def Leppard', 'The Cure', 'Bon Jovi'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: '"All the Boys" by Panic! At the Disco was released as a bonus track on what album?',
			options: [
				'Too Weird To Live, Too Rare To Die!',
				"A Fever You Can't Sweat Out",
				'Death Of A Bachelor',
				'Vices & Virtues'
			],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'What was Raekwon the Chefs debut solo album?',
			options: ['Shaolin vs Wu-Tang', 'The Wild', 'Only Built 4 Cuban Linx', 'The Lex Diamond Story'],
			correct: 2
		},
		{
			category: 'MUSIC',
			question:
				'Which novelty band was best known for their UK chart hits "Combine Harvester" and "I Am a Cider Drinker" in 1976?',
			options: ['Goldie Lookin Chain', 'Bonzo Dog Doo-Dah Band', 'The Wurzels', 'The Firm'],
			correct: 2
		},
		{
			category: 'MUSIC',
			question: 'Chino Moreno is the lead singer of which alternative metal band?',
			options: ['Tool', 'Deftones', 'Korn', 'Type O Negative'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'Who is the lead singer of Arctic Monkeys?',
			options: ['Jamie Cook', 'Alex Turner', 'Matt Helders', "Nick O'Malley"],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'Which of the following is not a studio album by the band Pink Floyd?',
			options: ['Moving Pictures', 'The Dark Side of the Moon', 'Wish You Were Here', 'Animals'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'The letters in the name of the band "TWRP" stand for what?',
			options: [
				'Totally Wicked Robot Performers',
				'Team Wild and the Radio Pirates',
				'Taiwan Roleplay',
				'Tupperware Remix Party'
			],
			correct: 3
		},
		{
			category: 'MUSIC',
			question:
				"In the Panic! At the Disco's song \"Nothern Downpour\", which lyric follows 'I know the world's a broken bone'.",
			options: [
				'"So sing your song until you\'re home"',
				'"So let them know they\'re on their own"',
				'"So melt your headaches call it home"',
				'"So start a fire in their cold stone"'
			],
			correct: 2
		},
		{
			category: 'MUSIC',
			question: 'Which song on Daft Punk\'s "Random Access Memories" features Pharrell Williams?',
			options: ['Get Lucky', "Doin' It Right", 'Instant Crush', 'The Game of Love'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Who is the lead singer of The Lumineers?',
			options: ['Wesley Schultz', 'Jeremiah Fraites', 'Jay Van Dyke', 'Neyla Pekarek'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: "Which Canadian reggae musician had a 1993 hit with the song 'Informer'?",
			options: ['Rain', 'Snow', 'Hail', 'Sleet'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question:
				'What was the name of the cold-war singer who has a song in Grand Theft Auto IV, and a wall landmark in Moscow for his memorial?',
			options: ['Jimi Hendrix', 'Viktor Tsoi', 'Brian Jones', 'Vladimir Vysotsky'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'Which of these songs is not on the "untitled" album by Led Zeppelin?',
			options: ['Celebration Day', 'Stairway to Heaven', 'Black Dog', 'Rock and Roll'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: "Which of the following songs did Elton John perform following Princess Diane's passing?",
			options: ['Candles in the Wind', "I Guess That's Why They Call It The Blues", 'Your Song', 'Island Girl'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Which singer was featured in Swedish producer Avicii\'s song "Wake Me Up"?',
			options: ['John Legend', 'CeeLo Green', 'Aloe Blacc', 'Pharrell Williams'],
			correct: 2
		},
		{
			category: 'MUSIC',
			question: 'Which English guitarist has the nickname "Slowhand"?',
			options: ['Mark Knopfler', 'Jeff Beck', 'Eric Clapton', 'Jimmy Page'],
			correct: 2
		},
		{
			category: 'MUSIC',
			question: 'Who is the lead singer of Green Day?',
			options: ['Billie Joe Armstrong', 'Mike Dirnt', 'Sean Hughes', 'Tré Cool'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question:
				'What animal is featured on the cover of English electronic music group The Prodigy\'s album, "The Fat of the Land"?',
			options: ['Fox', 'Elephant', 'Tiger', 'Crab'],
			correct: 3
		},
		{
			category: 'MUSIC',
			question: 'Who is the musical artist who released the hit song, "Love Song," in 2007?',
			options: ['Taylor Swift', 'Sara Bareilles', 'Katy Perry', 'Sarah Silverman'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question:
				'Which song by Swedish electronic musician Avicii samples the song "Something\'s Got A Hold On Me" by Etta James?',
			options: ['Fade Into Darkness', 'Levels', 'Silhouettes', 'Seek Bromance'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: "Who is the founder and leader of industrial rock band, 'Nine Inch Nails'?",
			options: ['Trent Reznor', 'Marilyn Manson', 'Robin Finck', 'Josh Homme'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: "For which civil rights activist did Stevie Wonder write the song 'Happy Birthday' in 1980?",
			options: ['Martin Luther King Jr', 'Rosa Parks', 'Nelson Mandella', 'Booker T. Washington'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Which one of these Rammstein songs has two official music videos?',
			options: ['Du Riechst So Gut', 'Du Hast', 'Benzin', 'Mein Teil'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Who was the most streamed artist on Spotify in 2019?',
			options: ['Billie Eilish', 'Ariana Grande', 'Post Malone', 'Drake'],
			correct: 2
		},
		{
			category: 'MUSIC',
			question: 'Which of these artists did NOT remix the song "Faded" by Alan Walker?',
			options: ['Skrillex', 'Tiësto', 'Slushii', 'Dash Berlin'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Which one of these rappers is NOT a member of the rap group Wu-Tang Clan?',
			options: ['Dr.Dre', "Ol' Dirty Bastard", 'GZA', 'Method Man'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'In the episode of SpongeBob SquarePants, "Survival of the Idiots", Spongebob called Patrick which nickname?',
			options: ['Starfish', 'Larry', 'Dirty Dan', 'Pinhead'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Who was the winner of "Big Brother" Season 10?',
			options: ['Bryce Kranyik', 'Dan Gheesling', 'Ryan Sutfin', 'Chris Mundorf'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'When did Spongebob Squarepants first air?',
			options: ['July 20, 2000', 'February 6, 2003', 'June 27, 1997', 'May 1, 1999'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: "What does Bart sell his soul for in The Simpsons episode 'Bart Sells His Soul'?",
			options: ['A Copy of Bonestorm 2', '$100', 'A Giant Gobstopper', '$5'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: "On the NBC show Community what was Star Burns' real name?",
			options: ['Todd', 'Neal', 'Alex', 'Grimus'],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: 'In Battlestar Galactica (2004), what is the name of the President of the Twelve Colonies?',
			options: ['William Adama', 'Tricia Helfer', 'Harry Stills', 'Laura Roslin'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'In the show "Futurama" what is Fry\'s full name?',
			options: ['Fry J. Philip', 'Fry Rodríguez', 'Fry Philip', 'Philip J. Fry'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: "What is the surname of the character Daryl in AMC's show The Walking Dead?",
			options: ['Dixon', 'Grimes', 'Dickinson', 'Dicketson'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'On the show "Rick and Morty", in episode "Total Rickall", who was a parasite?',
			options: ['Beth Smith', 'Summer Smith', 'Mr. Poopy Butthole', 'Pencilvester'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'In the Sci-Fi television show Doctor Who, who plays the Tenth Doctor?',
			options: ['William Hartnell', 'Peter Capaldi', 'David Tennant', 'Peter Davison'],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: 'British actor David Morrissey stars as which role in "The Walking Dead"?',
			options: ['The Governor', 'Negan', 'Rick Grimes', 'Daryl Dixon'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Who was the first Big Brother US winner to win with a perfect game?',
			options: ['Ian Terry', 'Jordan Lloyd', 'Rachael Reilly', 'Dan Gheesling'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'In the Doctor Who universe, how many times can a time lord normally regenerate?',
			options: ['11', '13', '15', '12'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Which character does voice actress Tara Strong NOT voice?',
			options: ['Twilight Sparkle', 'Bubbles (2016)', 'Timmy Turner', 'Harley Quinn'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'Which of following is rude and dishonorable by Klingon standards?',
			options: [
				'Insulting and laughing at him at the dinner table',
				'Reaching over and taking his meal',
				"Taking his D'k tahg",
				'Punching him and taking his ship station position'
			],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: 'In "Star Trek", who was the founder of the Klingon Empire and its philosophy?',
			options: ['Lady Lukara of the Great Hall', 'Molor the Unforgiving', 'Dahar Master Kor', 'Kahless the Unforgettable'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question:
				'In season one of the Netflix political drama "House of Cards", what government position does Frank Underwood hold?',
			options: ['Attorney General', 'House Majority Whip', 'President', 'Chief of Staff'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'What NBC sitcom once saw two of its characters try to pitch NBC on a sitcom about nothing?',
			options: ['Seinfeld', 'Frasier', 'Becker', 'Friends'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'In "Rick And Morty", who shot "Mr. Poopybutthole" in the episode "Total Rickall"?',
			options: ['Rick', 'Jerry', 'Morty', 'Beth'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'What is the name of the main character in "The Flash" TV series?',
			options: ['Oliver Queen', 'Bart Allen', 'Bruce Wayne', 'Barry Allen'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Who is the star of the AMC series Breaking Bad?',
			options: ['Walter White', 'Saul Goodman', 'Jesse Pinkman', 'Skyler White'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'The theme for the popular science fiction series "Doctor Who" was composed by who?',
			options: ['Murray Gold', 'Delia Derbyshire', 'Peter Howell', 'Ron Grainer'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question:
				'What was the name of the inflatable duck sacrified to the crowd at the end of Episode 34 of the 18th season of Big Brother?',
			options: ['Pablo', 'Esteban', 'Carlos', 'Duckster'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: "Who plays the character of Dennis Reynolds on It's Always Sunny in Philadelphia?",
			options: ['Rob McElhenney', 'Glenn Howerton', 'Charlie Day', 'Danny DeVito'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'What is the name of Chris\'s brother in "Everybody Hates Chris"?',
			options: ['Jerome', 'Drew', 'Greg', 'Joe'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'How many seasons did the Sci-Fi television show "Stargate Universe" have?',
			options: ['2', '10', '5', '3'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Which actor from The Young Ones also played Lord Flashheart in one episode of Blackadder II?',
			options: ['Rik Mayall', 'Adrian Edmondson', 'Nigel Planer', 'Christopher Ryan'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Out of the 3 Tots in Tots TV, who speaks French in the UK Version and Spanish in the US Version?',
			options: ['Tilly', 'Tom', 'Tiny', 'None of the Above'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'In "Star Trek", what is the Klingon death ritual?',
			options: [
				'Kiss the jagged forehead before burial.',
				'Look into sky and yell loudly in mourning.',
				'Shoot into space in a torpedo casing.',
				"Split the deceased's earnings between bloodkin."
			],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question:
				'At which university do "The Big Bang Theory" characters Mr. Wolowitz and Drs. Cooper, Hofstadter and Koothrappali work?',
			options: ['UCLA', 'MIT', 'UC Berkeley ', 'Caltech'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'In what year did "The Big Bang Theory" debut on CBS?',
			options: ['2008', '2006', '2009', '2007'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: "In Star Trek: The Next Generation, what is the name of Data's cat?",
			options: ['Mittens', 'Spot', 'Tom', 'Kitty'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'Which actor portrays "Walter White" in the series "Breaking Bad"?',
			options: ['Andrew Lincoln', ' Bryan Cranston', 'Aaron Paul', 'RJ Mitte'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'The first half-hour CGI cartoon, ReBoot, aired on which year?',
			options: ['1993', '1998', '1994', '1999'],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: 'What was the callsign of Commander William Adama in Battlestar Galactica (2004)?',
			options: ['Husker', 'Starbuck', 'Apollo', 'Crashdown'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'What was the name of the police officer in the cartoon "Top Cat"?',
			options: ['Barbrady', 'Mahoney', 'Murphy', 'Dibble'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'What is the real name of the famous spanish humorist, El Risitas?',
			options: ['Gabriel Garcia Marquez', 'Jesus Quintero', 'Juan Joya Borga', 'Ernesto Guevara'],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: 'Which of these in the Star Trek series is NOT Klingon food?',
			options: ["Hors d'oeuvre", 'Racht', 'Gagh', 'Bloodwine'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'In Naruto: Shippuden, which of the following elements is a "Kekkei Tōta?"',
			options: ['Particle Style', 'Any Doujutsu', 'Shadow Style', 'Ice Style'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Who played the Waitress in the Spam sketch of "Monty Python\'s Flying Circus"?',
			options: ['Eric Idle', 'Graham Chapman', 'Terry Jones', 'John Cleese'],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question:
				'In season one of the US Kitchen Nightmares, Gordan Ramsay tried to save 10 different restaurants. How many ended up closing afterwards?',
			options: ['9', '6', '3', '0'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'The "Psycho" series of videos on YouTube was created by which of the following?',
			options: ['Dan Bell', 'RiDGiD STUDiOS', 'Billy Familia', 'VeganGainz'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'Who was the star of the TV series "24"?',
			options: ['Kiefer Sutherland', 'Kevin Bacon', 'Hugh Laurie', 'Rob Lowe'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: "In the show 'Doctor Who', what is the name of the time-capsule model stolen by 'the Doctor'?",
			options: [
				'TT Type 1, Mark 3 (TARDIS)',
				'TT Type 40, Mark 5 (TARDIS)',
				'TT Type 40, Mark 3 (TARDIS)',
				'TT Type 1, Mark 5 (TARDIS)'
			],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: "In the show Stranger Things, what is Eleven's favorite breakfast food?",
			options: ['Toast', 'Captain Crunch', 'Bacon and Eggs', 'Eggo Waffles'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: "In Supernatural, what's is Sam's brothers name?",
			options: ['Dave', 'Dean', 'Steve', 'Mike'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'What is the setting of the show "Parks and Recreation"?',
			options: ['Eagleton, Indiana', 'Pasadena, California', 'Pawnee, Indiana', 'London, England'],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: 'Which actor was not a major character in TV Show Freaks and Geeks?',
			options: ['Jason Segel', 'Jonah Hill', 'Seth Rogen', 'James Franco'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'When did the TV show Rick and Morty first air on Adult Swim?',
			options: ['2014', '2016', '2013', '2015'],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question:
				"What is the title of The Allman Brothers Band instrumental used as the theme to the BBC motoring show, 'Top Gear'?",
			options: ['Angela', 'Erica', 'Sandra', 'Jessica'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Before Super Smash Bros. contained Nintendo characters, what was it known as internally?',
			options: ['Contest of Champions', 'Smash and Pummel', 'Dragon King: The Fighting Game', 'Fighter of the Ages: Conquest'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'In the Fallout series, on which date did The Great War happen?',
			options: ['May 15th, 2058', 'October 23rd, 2077', 'December 14th, 2069', 'November 5th, 2076'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'Rincewind from the 1995 Discworld game was voiced by which member of Monty Python?',
			options: ['John Cleese', 'Terry Gilliam', 'Michael Palin', 'Eric Idle'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'In the game "The Sims", how many Simoleons does each family start with?',
			options: ['10,000', '20,000', '15,000', '25,000'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'Which of the following is not a character in the video game Doki Doki Literature Club?',
			options: ['Monika', 'Natsuki', 'Sayori', 'Nico'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Which of these is not a playable character in "Enter The Gungeon?"',
			options: ['The Bullet', 'The Robot', 'The Heavy', 'The Cultist'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'What is the first primary weapon the player gets in "PAYDAY: The Heist"?',
			options: ['Brenner 21', 'Reinbeck', 'M308', 'AMCAR-4'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'How many obsidian blocks are required to build a nether portal in Minecraft?',
			options: ['14', '13', '10', '16'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'Which of these is NOT a faction included in the game Counter-Strike: Global Offensive?',
			options: ['GSG-9', 'Elite Crew', 'Phoenix Connexion', 'BOPE'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'What video game sparked controversy because of its hidden "Hot Coffee" minigame?',
			options: ['Grand Theft Auto: Vice City', 'Hitman: Blood Money', 'Grand Theft Auto: San Andreas', 'Cooking Mama'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: "In the Assassin's Creed series,what was the name of Desmond Miles given by Abstergo?",
			options: ['Subject 16', 'Subject 17', 'Subject 18', "Alta&iuml;r Ibn-La'Ahad"],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'When was the original Star Wars: Battlefront II released?',
			options: ['December 18, 2004', 'October 31, 2005', 'November 21, 2006', 'September 9, 2007'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: "What is the name of the virus that infected New York in Tom Clancy's The Division?",
			options: ['Ebola', 'Red Poison', 'Dollar Flu', 'Smallpox'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question:
				'In the title of the game "Luigi\'s Mansion", what is the only letter to not appear with a pair of eyes in it?',
			options: ['n', 'i', 's', 'm'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question:
				"In the Nintendo DS game 'Ghost Trick: Phantom Detective', what is the name of the hitman seen at the start of the game?",
			options: ['Nearsighted Jeego', 'One Step Ahead Tengo', 'Missile', 'Cabanela'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'In the "Pikmin" games, which of the following pikmin colors lacks it\'s own "Onion" nest?',
			options: ['Winged', 'Blue', 'Rock', 'Purple'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'The creeper in Minecraft was the result of a bug while implementing which creature?',
			options: ['Zombie', 'Chicken', 'Cow', 'Pig'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'The protagonist of the hit game, Half-Life 2 is called:',
			options: ['Alyx Vance', 'Gordon Freeman', 'Isaac Kleiner', 'Wallace Breen'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'In the beginning of the game "Sonic Adventure", what color Chaos Emerald does Tails own?',
			options: ['Red', 'Green', 'Purple', 'Blue'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'What is the Alien Race in the game "Lego Racers 2" known as?',
			options: ['Ramas', 'Slizers', 'Roboriders', 'Turagas'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'In World of Warcraft the default UI color that signifies Druid is what?',
			options: ['Orange', 'Brown', 'Green', 'Blue'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'In World of Warcraft, What was the original level cap?',
			options: ['70', '60', '50', '100'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: "Which Game Development company made No Man's Sky?",
			options: ['Dovetail Games', 'Hello Games', 'Valve', 'Blizzard Entertainment'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'In Overwatch, which ape species is the hero Winston?',
			options: ['Orangutan', 'Gorilla', 'Chimpanzee', 'Gibbon'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: "Which of these is NOT the name of a rival gang in the video game Saint's Row 2?",
			options: ['The Brotherhood', 'The Ronin', 'The Sons of Samedi', 'The Zin Empire'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'In the "Portal" series, who was Cave Johnson\'s personal assistant?',
			options: ['Heather', 'Caroline', 'Melissa', 'Jane'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'What is the main character\'s name in "Braid"?',
			options: ['Boregard', 'James', 'Tim', 'Jackson'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'Which of the following games has the largest map size?',
			options: ['Grand Theft Auto 5', 'The Elder Scrolls 4:  Oblivion', 'Just Cause 2', 'The Witcher 3:  Wild Hunt'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question:
				'Which character, in the game "Morenatsu", has the most possible endings to their route, at a total of four different endings?',
			options: ['Shin Kuroi', 'Kouya Aotsuki', 'Soutarou Touno', 'Torahiko Ooshima'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'In Splatoon 2, who are the members of Off The Hook?',
			options: ['Pearl & Marina', 'Callie & Marie', 'Diamond & Aquamarina', 'DJ Octavio & Crusty Sean'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'In the game "Subnautica", which feature was removed due to performance issues in 2016?',
			options: ['Building', 'Crafting', 'Multiplayer', 'Terraforming'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'When was the Valve Corporation founded?',
			options: ['December 26, 1994', 'August 24, 1996', 'March 22, 1997', 'March 13, 1997'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'Who created the digital distribution platform Steam?',
			options: ['Pixeltail Games', 'Ubisoft', 'Electronic Arts', 'Valve'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'What is the maximum HP in Terraria?',
			options: ['500', '400', '1000', '100'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'In the "Halo" franchise, in what country is New Mombasa?',
			options: ['Kenya', 'India', 'Turkey', 'Slovakia'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'What is the name of the City in Saints Row The Third?',
			options: ['Steelport', 'Stilwater', 'Carcer', 'Liberty'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'Who voices GLaDOS in the Portal games?',
			options: ['Ellen McLain', 'Michelle Forbes ', 'Mary Kae Irvin ', 'Natasha Radski'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'In Yakuza 0, what is the order of the fighting styles acquired as Kazuma Kiryu?',
			options: [
				'Brawler, Rush, Beast, Legend',
				'Legend, Rush, Brawler, Beast',
				'Brawler, Beast, Rush, Legend',
				'Beast, Brawler, Rush, Legend'
			],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'According to the lore of "Starbound", what does the "Colony Deed" do when it is placed down?',
			options: [
				'Teleports somebody from somewhere on the planet it is placed.',
				'Teleports a random person to the location.',
				"Materializes a new being at it's location.",
				'Sends out an advertisement for someone to move in.'
			],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'In Minecraft, what update did foods like steak become stackable?',
			options: ['Alpha 1.2.0', 'Release 1.12.1', 'Release 1.7.2', 'Beta 1.8'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'What was the name of the canceled projected by Blizzard Entertainment that would be later become Overwatch?',
			options: ['Omnic', 'Omega', 'Titan', 'Ghost'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'The video game publishers known as "tinyBuild" published which of these games?',
			options: ["Don't Starve", 'Stardew Valley', 'Clustertruck', 'Slime Rancher'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'In Need for Speed: Underground, what car does Eddie drive?',
			options: ['Mazda RX-7 FD3S', 'Acura Integra Type R', 'Subaru Impreza 2.5 RS', 'Nissan Skyline GT-R (R34)'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Who is the leader of Team Instinct in Pokémon Go?',
			options: ['Candela', 'Blanche', 'Spark', 'Willow'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question:
				'GoldenEye 007 on the Nintendo 64 was planned to allow you to play as all previous Bond actors, with the exception of who?',
			options: ['George Lazenby', 'Roger Moore', 'Sean Connery', 'Timothy Dalton'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question:
				'In Diablo lore, this lesser evil spawned from one of the seven heads of Tathamet, and was known as the Maiden of Anguish.',
			options: ['Valla', 'Andariel', 'Malthael', 'Kashya'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'Who is the main character in "The Stanley Parable"?',
			options: ['The Adventure Line', 'The Narrator', 'Stanley', 'The Boss'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'Which of these is NOT a playable character in the 2016 video game Overwatch?',
			options: ['Mercy', 'Winston', 'Invoker', 'Zenyatta'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: "Which one of these games wasn't released in 2016?",
			options: ["Tom Clancy's The Division", 'Killing Floor 2', 'Hitman', 'Metal Gear Solid V'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'In Undertale, MEGALOVANIA is a theme for which character?',
			options: ['Flowey', 'Papyrus', 'Sans', 'Undyne'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'At the start of a standard game of the Monopoly, if you throw a double six, which square would you land on?',
			options: ['Electric Company', 'Water Works', 'Chance', 'Community Chest'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Carcassonne is based on which French town?',
			options: ['Paris', 'Marseille', 'Carcassonne', 'Clermont-Ferrand'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'Europa Universalis is a strategy video game based on which French board game?',
			options: ['Europe and the Universe', 'Europa!', 'Europa Universalis', 'Power in Europe'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'In Magic: The Gathering, what card\'s flavor text is "Catch!"?',
			options: ['Lava Axe', 'Stone-Throwing Devils', 'Ember Shot', 'Throwing Knife'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'How many spaces are there on a standard Monopoly board?',
			options: ['28', '55', '36', '40'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'How many dice are used in the game of Yahtzee?',
			options: ['Four', 'Six', 'Eight', 'Five'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'How many points is the Z tile worth in Scrabble?',
			options: ['10', '8', '5', '6'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'The board game Monopoly takes its street names from which real American city?',
			options: ['Las Vegas, Nevada', 'Duluth, Minnesota', 'Charleston, South Carolina', 'Atlantic City, New Jersey'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'Which of these cards from "Magic: The Gathering" has a flavor text that begins with "Oi oi oi"?',
			options: ['Uthden Troll', 'Lotleth Troll', 'Albino Troll', 'Harvester Troll'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Which of the following characters is not in the board game Clue?',
			options: ['Colonel Mustard', 'Reverend Green', 'Mister Indigo', 'Miss Scarlet'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'How many pieces are there on the board at the start of a game of chess?',
			options: ['16', '20', '36', '32'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'Which card is on the cover of the Beta rulebook of "Magic: The Gathering"?',
			options: ['Island', 'Bog Wraith', 'Rock Hydra', 'Elvish Archers'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'In Yu-Gi-Oh, how does a player perform an Xyz Summon?',
			options: [
				'Overlay at least 2 Monsters of the Same Level',
				'Activate a Spell and Send Monsters to the Graveyard',
				"Add the Monsters' Levels Together to Match the Xyz Monster",
				'Banish A Number of Monsters From Your Hand And Deck'
			],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'The board game "Monopoly" is a variation of what board game?',
			options: ['Territorial Dispute', 'Property Feud', "The Monopolist's Game", "The Landlord's Game"],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: "In standard Monopoly, what's the rent if you land on Park Place with no houses?",
			options: ['$35', '$30', '$50', '$45'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'When Magic: The Gathering was first solicited, which of the following was it originally titled?',
			options: ['Mana Clash', 'Magic', 'Magic Clash', 'Mana Duels'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question:
				'In board games, an additional or ammended rule that applies to a certain group or place is informally known as a "what" rule?',
			options: ['Custom', 'Extra', 'Change', 'House'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'What is the most challenging monster in the Dungeons & Dragons 5th Edition Monster Manual?',
			options: ['Beholder', 'Displacer Beast', 'Lich', 'Tarrasque'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: "What is the world's oldest board game?",
			options: ['Senet', 'Chess', 'Checkers', 'Go'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Which board game was first released on February 6th, 1935?',
			options: ['Risk', 'Clue', 'Candy Land', 'Monopoly'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'When was the board game Twister, released to the public?',
			options: ['September 1965', 'April 1966', 'January 1969', 'February 1966'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'Which Pokemon is #39 in the National Pokedex?',
			options: ['Jigglypuff', 'Pikachu', 'Psyduck', 'Fearow'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question:
				'What was the development code name for the "Weatherlight" expansion for "Magic: The Gathering", released in 1997?',
			options: ['Decaf', 'Mocha Latte', 'Frappuccino', 'Macchiato'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'Which one of these is not a real game in the Dungeons & Dragons series?',
			options: [
				'Extreme Dungeons & Dragons',
				'Advanced Dungeons & Dragons',
				'Dungeons & Dragons 3.5th edition',
				'Advanced Dungeons & Dragons 2nd edition'
			],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'How many rooms are there, not including the hallways and the set of stairs, in the board game "Clue"?',
			options: ['1', '6', '9', '10'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'Which of these cities is NOT featured in the Pandemic board game?',
			options: ['Ho Chi Minh City', 'Lagos', 'Berlin', 'Karachi'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'In a standard game of Monopoly, what colour are the two cheapest properties?',
			options: ['Green', 'Yellow', 'Blue', 'Brown'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'In which year was the pen and paper RPG "Deadlands" released?',
			options: ['1996', '2003', '1999', '1993'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question:
				'In "Magic: The Gathering", during the design for Planar Chaos, what color did the developers think of adding in as the sixth color?',
			options: ['Purple', 'Brown', 'Pink', 'Orange'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'In "Magic: The Gathering", what instant card has the highest converted mana cost?',
			options: ['Vitalizing Wind', 'Blinkmoth Infusion', ' Chant of Vitu-Ghazi', 'Assert Authority'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: "What do you declare in Rīchi Mahjong when you've drawn your winning tile?",
			options: ['Ron', 'Tsumo', 'Rīchi', 'Kan'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'What letter is used to refer to blue mana in the card game Magic The Gathering?',
			options: ['B', 'U', 'L', 'E'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'Who was the first official world chess champion?',
			options: ['José Raúl Capablanca', 'Emanuel Lasker', 'Wilhelm Steinitz', 'Bobby Fischer'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'In what year was the card game Magic: the Gathering first introduced?',
			options: ['1993', '1987', '1998', '2003'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'How many dots are on a single die?',
			options: ['21', '24', '15', '18'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: "In Magic: The Gathering, what was a tribute card to Jamie Wakefield's late wife Marilyn, who loved horses?",
			options: ['Loyal Pegasus', 'Vryn Wingmare', 'Sungrace Pegasus', 'Timbermare'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'The board game, Nightmare was released in what year?',
			options: ['1992', '1989', '1995', '1991'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'What is the sum of all the tiles in a standard box of Scrabble?',
			options: ['207', '197', '187', '177'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'What special item did the creators of Cards Against Humanity ship for their Black Friday pack?',
			options: ['A Card Expansion', 'Bull Feces', 'A Racist Toy', 'Cat Urine'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'In Chess, the Queen has the combined movement of which two pieces?',
			options: ['Rook and King', 'Bishop and Rook', 'Knight and Bishop', 'King and Knight'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: "On a standard Monopoly board, which square is diagonally opposite 'Go'? ",
			options: ['Go to Jail', 'Jail', 'Free Parking', 'The Electric Company'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'Which of these board games do NOT utilize standard 6-sided dice?',
			options: ['Monopoly', 'Risk', 'The Game of Life', 'Snakes and Ladders'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'In poker, "EV" means what?',
			options: ['Equity Value', 'Expected Value', 'Equivalent Variation', 'Equity Variation'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: "What Magic: The Gathering card's flavor text is just 'Ribbit.'?",
			options: ['Turn to Frog', 'Spore Frog', 'Bloated Toad', 'Frogmite'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'In Dungeons and Dragons (5th edition), what stat do you normally add onto your initiative die roll?',
			options: ['Dexterity', 'Speed', 'Strength', 'Wisdom'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'In the Board Game, Settlers of Catan, a die roll of what number causes the Robber to attack? ',
			options: ['3', '7', '10', '1'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'On a standard Monopoly board, how much do you have to pay for Tennessee Ave?',
			options: ['$180', '$200', '$160', '$220'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'The Dice Tower network of board game podcasts and videos is run by which individual?',
			options: ['Tom Vasel', 'Jason LeVine', 'Borth Sampson', 'Uncle Pennybags'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Which of these games includes the phrase "Do not pass Go, do not collect $200"?',
			options: ['Pay Day', 'Cluedo', 'Coppit', 'Monopoly'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'What is the maximum level you can have in a single class in Dungeons and Dragons (5e)?',
			options: ['20', '30', '15', '25'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'What is the name of a nine sided polygon?',
			options: ['Hexagon', 'Octagon', 'Nonagon', 'Heptagon'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'Which of these probability distributions is NOT discrete?',
			options: ['Binomial', 'Normal', 'Poisson', 'Hyper-geometric'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'Which mathematician refused the Fields Medal?',
			options: ['Andrew Wiles', 'Grigori Perelman', 'Terence Tao', 'Edward Witten'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'What shape does sin(x) or cos(x) make on a graph?',
			options: ['A Parabola', 'Waves', 'A Straight Line', 'Zig-Zags'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'What is the only Millennium Prize Problem that has been solved so far?',
			options: ['P vs. NP problem', 'Riemann Hypothesis', 'Poincaré conjecture', "Fermat's conjecture"],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: "What's the square root of 49?",
			options: ['4', '7', '12', '9'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'What comes after a Million, a Billion, and a Trillion?',
			options: ['Sextillion', 'Quintillion', 'Septillion', 'Quadrillion'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'A mathematical constant, known as "The Golden Ratio", is most commonly represented by which greek letter?',
			options: ['&pi; (pi)', '&Psi; (psi)', '&Phi; (phi)', '&Tau; (tau)'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: "What is the mathematician Euler's first name?",
			options: ['Leonhard', 'Lionel', 'Andrin', 'Ajan'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'What is the approximate value of mathematical constant e?',
			options: ['2.72', '3.14', '1.62', '1.41'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'In the hexadecimal system, what number comes after 9?',
			options: ['10', 'The Number 0', 'The Letter A', '16'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'Which of the following is not one of the seven Millennium Prize Problems?',
			options: ['Naviér conjecture', 'Birch and Swinnerton-Dyer Conjecture', 'Riemann hypothesis', 'Poincaré conjecture'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'How many sides does a heptagon have?',
			options: ['7', '5', '4', '9'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'What type of function is x&sup2;+2x+1?',
			options: ['Quadratic', 'Rational', 'Linear', 'Exponential'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'What are the first 6 digits of the number "Pi"?',
			options: ['3.14159', '3.14169', '3.12423', '3.25812'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'In a normal distribution, 95% of the data lies within how many standard deviations of the mean?',
			options: ['2', '1', '3', '4'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'How many zeptometres are inside one femtometre?',
			options: ['10', '1,000,000,000', '1,000,000', '1000'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'What is the first Mersenne prime exponent over 1000?',
			options: ['2203', '1009', '1279', '1069'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question:
				'Which of these numbers is closest to the total number of possible states for an army standard Enigma Machine?',
			options: ['1.58 x 10^20', '1.58 x 10^22', '1.58 x  10^18', '1.58 x 10^24'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question:
				'Which greek mathematician ran through the streets of Syracuse naked while shouting "Eureka" after discovering the principle of displacement?',
			options: ['Euclid', 'Homer', 'Archimedes', 'Eratosthenes'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'In the complex plane, multiplying a given function by i rotates it anti-clockwise by how many degrees?',
			options: ['90', '180', '270', '0'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'What is the smallest number that can be expressed as the sum of two positive cubes in two different ways?',
			options: ['91', '1729', '561', '4104'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'What is the alphanumeric representation of the imaginary number?',
			options: ['i', 'e', 'n', 'x'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: "Who proved Fermat's Last Theorem?",
			options: ['Leonhard Euler', 'Carl Friedrich Gauss', 'Srinivasa Ramanujan', 'Andrew Wiles'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'Which of these did mathematician Leonhard Euler NOT develop?',
			options: [
				'A method of solving first-order differential equations',
				'An improvement to the Fast Fourier Transform',
				'An identity linking the numbers e, pi and i',
				'A formula linking vertices, edges and faces on a graph'
			],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: "What is the plane curve proposed by Descartes to challenge Fermat's extremum-finding techniques called?",
			options: ['Folium of Descartes', 'Elliptic Paraboloid of Descartes', 'Cartesian Coordinates', "Descarte's Helicoid"],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Which of the following mathematicians made major contributions to game theory?',
			options: ['John Von Neumann', 'Carl Friedrich Gauss', 'Leonhard Euler', 'Stefan Banach'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'How many sides does a trapezium have?',
			options: ['3', '4', '5', '6'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'Which two men are credited with independently discovering differential calculus? ',
			options: ['Plato and Aristotle', 'Asiimov and Rutherford', 'Newton and Leibnitz', 'Dvorak and Smith'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'The metric prefix "atto-" makes a measurement how much smaller than the base unit?',
			options: ['One Billionth', 'One Quadrillionth', 'One Septillionth', 'One Quintillionth'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'In Roman Numerals, what does XL equate to?',
			options: ['40', '60', '15', '90'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'What is the least number of sides a polygon can have?',
			options: ['1', '2', '7', '3'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'The French mathematician &Eacute;variste Galois is primarily known for his work in which?',
			options: ["Galois' Continued Fractions", 'Galois Theory', "Galois' Method for PDE's ", 'Abelian Integration'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'What is a polygon with eight sides called?',
			options: ['Hexagon', 'Nanagon', 'Heptagon', 'Octagon'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: "How many books are in Euclid's Elements of Geometry?",
			options: ['8', '13', '10', '17'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'How many zeros are there in a googol?',
			options: ['10', '1,000', '100', '1,000,000'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'What is the area of a circle with a diameter of 20 inches if &pi;= 3.1415?',
			options: ['314.15 Inches', '380.1215 Inches', '3141.5 Inches', '1256.6 Inches'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'What is the correct order of operations for solving equations?',
			options: [
				'Addition, Multiplication, Division, Subtraction, Addition, Parentheses',
				'Parentheses, Exponents, Addition, Substraction, Multiplication, Division',
				'The order in which the operations are written.',
				'Parentheses, Exponents, Multiplication, Division, Addition, Subtraction'
			],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'How many sides does a Möbius strip have?',
			options: ['1', '2', '3', '4'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'How many Millibars (mbar) to 1 Inch of Mercury (inHg)',
			options: ['30.0', '33.9', '27.4', '10.6'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'What prime number comes next after 19?',
			options: ['25', '23', '21', '27'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question:
				'The notion of a "set that contains all sets which do not contain themselves" is a paradoxical idea attributed to which English philosopher?',
			options: ['Francis Bacon', 'John Locke', 'Bertrand Russel', 'Alfred North Whitehead'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'How many square faces does a cube have?',
			options: ['6', '4', '8', '10'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'How many sides does a pentagon have?',
			options: ['9', '5', '6', '4'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'What is the fourth digit of &pi;?',
			options: ['1', '2', '3', '4'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'What is the Roman numeral for 500?',
			options: ['L', 'C', 'X', 'D'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'Which of the following famous mathematicians died in a duel at the age of 20?',
			options: ['Abel', 'Euler', 'Gauss', 'Galois'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'What is the derivative of Acceleration with respect to time?',
			options: ['Shift', 'Bump', 'Slide', 'Jerk'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'What Greek letter is used to signify summation?',
			options: ['Delta', 'Alpha', 'Omega', 'Sigma'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Which city is the seat of government of the Netherlands?',
			options: ['Amsterdam', 'Utrecht', 'Rotterdam', 'The Hague'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Which U.S. president is said to have had the longest beard?',
			options: ['Zachary Taylor', 'John Quincy Adams', 'Rutherford B. Hayes', 'James A. Garfield'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question:
				'In United States history, how many vice presidents did Franklin D. Roosevelt have during his time in office as president?',
			options: ['1', '2', '3', '0'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'What candidate won the 2012 US Presidential Election?',
			options: ['Barack Obama', 'Mitt Romney', 'Bob Hope', 'Ross Perot'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Which of these was an official candidate in the 2017 British General Election?',
			options: ['Lord Buckethead', 'James Francis', 'Robert Wimbledon', 'Sir Crumpetsby'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Which former US president was nicknamed "Teddy" after he refused to shoot a defenseless black bear?',
			options: ['Woodrow Wilson', 'James F. Fielder', 'Theodore Roosevelt', 'Andrew Jackson'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'What country saw a world record 315 million voters turn out for elections on May 20, 1991?',
			options: ['United States of America', 'Soviet Union', 'India', 'Poland'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question:
				'Due to the Nagoya Resolution, China agreed to allow Taiwan to compete separately in international sporting events under what name?',
			options: ['Chinese Taiwan', 'Republic of Taiwan', 'Republic of Taipei ', 'Chinese Taipei'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Whose 2016 presidential campaign slogan was "Make America Great Again"?',
			options: ['Ted Cruz', 'Donald Trump', 'Marco Rubio', 'Bernie Sanders'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question:
				'Which Native American tribe/nation requires at least one half blood quantum (equivalent to one parent) to be eligible for membership?',
			options: ['Standing Rock Sioux Tribe', 'Kiowa Tribe of Oklahoma', 'Yomba Shoshone Tribe', 'Pawnee Nation of Oklahoma'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Who is the only US president to serve two non-consecutive terms in office?',
			options: ['James K. Polk', 'Franklin D. Roosevelt', 'Grover Cleveland', 'Thomas Jefferson'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Between 1973 to 1990, what country was ruled by dictator Augusto Pinochet?',
			options: ['Ethiopia', 'Indonesia', 'Nicaragua', 'Chile'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Who was elected leader of the UK Labour Party in September 2015?',
			options: ['Jeremy Corbyn', 'Ed Miliband', 'David Cameron', 'Theresa May'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'What year did Gerald Ford Become President?',
			options: ['1977', '1973', '1969', '1974'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Which of the following United States Presidents served the shortest term in office?',
			options: ['William Henry Harrison', 'Zachary Taylor', 'James A. Garfield', 'Warren G. Harding'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Who was the British Prime Minister at the outbreak of the Second World War?',
			options: ['Clement Attlee', 'Neville Chamberlain', 'Winston Churchill', 'Stanley Baldwin'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'Who became Prime Minister of the United Kingdom in July 2016?',
			options: ['Boris Johnson', 'David Cameron', 'Tony Blair', 'Theresa May'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'How many people are in the U.S. House of Representatives?',
			options: ['435', '260', '415', '50'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'What is the primary purpose of the Fourth Amendment to the US Constitution?',
			options: [
				'Preventing cruel and unusual punishments',
				'Protecting against imprisonment without due process of law',
				'Protecting the right to keep and bear arms',
				'Preventing unreasonable searches and seizures'
			],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: "What is former United States President Bill Clinton's full name?",
			options: ['William Roosevelt Clinton', 'William Truman Clinton', 'William Jefferson Clinton', 'William Lincoln Clinton'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Who is one of the co-princes of Andorra?',
			options: ['The monarch of the UK', 'The president of France', 'The Pope', 'No-one (the position is vacant)'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question:
				'According to the United States Constitution, how old must a person be to be elected President of the United States?',
			options: ['30', '40', '45', '35'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'The largest consumer market in 2015 was...',
			options: ['Germany', 'The United States of America', 'Japan', 'United Kingdom'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: "Who was South Africa's first Black President?",
			options: ['Nelson Mandela', 'Mangosuthu Buthelezi', 'Steve Biko ', 'Bishop Tutu'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'What are the first names of the first father and son pair that were both Prime Ministers of Canada?',
			options: ['Justin and Pierre', 'John and Louis', 'Brian and Justin', 'Brian and Pierre'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'What is centralism?',
			options: [
				'Conforming to one single common political agenda.',
				'Remaining politically neutral.',
				'The grey area in the spectrum of political left and right.',
				' Concentration of power and authority in a central organization.'
			],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: '"Yes, America Can!" was this United States politician\'s de facto campaign slogan in 2004.',
			options: ['John Kerry', 'George W. Bush', 'Barack Obama', 'Al Gore'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'The 2014 movie "The Raid 2: Berandal" was mainly filmed in which Asian country?',
			options: ['Thailand', 'Brunei', 'Indonesia', 'Malaysia'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Who was the only president to not be in office in Washington D.C?',
			options: ['Abraham Lincoln', 'George Washington', 'Richard Nixon', 'Thomas Jefferson'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'Which nation joined NATO as its 29th member in 2017?',
			options: ['Estonia', 'Andorra', 'Montenegro', 'Iceland'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question:
				'Starting from 2000, China banned manufacturing and sales of all video game consoles. On which year was this ban lifted?',
			options: ['2012', '2008', '2017', '2015'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: "Which of these is NOT one of Donald Trump's children?",
			options: ['Julius', 'Donald Jr.', 'Ivanka', 'Eric'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Which US state was the first to allow women to vote in 1869?',
			options: ['California', 'Wyoming', 'Delaware', 'Virginia'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'Who was the longest-serving senator in US history, serving from 1959 to 2010?',
			options: ['Daniel Inouye', 'Strom Thurmond', 'Joe Biden', 'Robert Byrd'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Who succeeded Joseph Stalin as General Secretary of the Communist Party of the Soviet Union?',
			options: ['Nikita Khrushchev', 'Leonid Brezhnev', 'Mikhail Gorbachev', 'Boris Yeltsin'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Before 2011, "True Capitalist Radio" was known by a different name. What was that name?',
			options: ['True Republican Radio', 'Texan Capitalist Radio', 'United Capitalists', 'True Conservative Radio'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Former United States President Bill Clinton famously played which instrument?',
			options: ['Saxophone', 'Baritone horn', 'Piano', 'Violin'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: "Which major bank's collapse was notable as one of the causes of the Financal Crisis of 2008?",
			options: ['HSBC', 'Lehman Brothers', 'Barclays', 'Lloyds'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'The Watergate Scandal occured in what year?',
			options: ['1972', '1973', '1974', '1971'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Which United Nations principal organ has been suspended since 1994?',
			options: ['Secretariat', 'Trusteeship Council', 'General Assembly', 'Economic and Social Council'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'What was the personal nickname of the 40th Governor of the US State Louisiana, Huey Long?',
			options: ['The Champ', 'The Hoot Owl', 'The Kingfish', 'The Oracle'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Which of the following United States senators is known for performing a 24-hour long filibuster?',
			options: ['Roy Blunt', 'John Barrasso', 'Strom Thurmond', 'Chuck Schumer'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Which letter do you need to have on a European driver license in order to ride any motorbikes?',
			options: ['A', 'X', 'D', 'B'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question:
				'In June 2017, Saudi Arabia and Egypt broke off ties with which country over its supposed support for terrorism?',
			options: ['Bahrain', 'United States of America', 'Russia', 'Qatar'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question:
				'Which former US president used "Let\'s Make America Great Again" as his campaign slogan before Donald Trump\'s campaign?',
			options: ['Jimmy Carter', 'Gerald Ford', 'Richard Nixon', 'Ronald Reagan'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Who was the 40th President of the USA?',
			options: ['Jimmy Carter', 'Ronald Reagan', 'Bill Clinton', 'Richard Nixon'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'Which of the following Pacific Islander countries is ruled by a constitutional monarchy?',
			options: ['Palau', 'Fiji', 'Tonga', 'Kiribati'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'What year did the effort to deploy the Common Core State Standards (CCSS) in the US begin?',
			options: ['2012', '2006', '1997', '2009'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question:
				"What is the name of Niccol&ograve; Machiavelli's work that argued effective leaders needed to crush their opponents at all costs?",
			options: ['The Rape of Lucrece', 'Will to Power', "Love's Labours Lost", 'The Prince'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Which president erased the national debt of the United States?',
			options: ['Andrew Jackson', 'Ronald Reagan', 'John F. Kennedy', 'Franklin Roosevelt'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'In "Homestuck" what is Dave Strider\'s guardian?',
			options: ['Becquerel', 'Doc Scratch', 'Halley', 'Bro'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'In Marvel comics, which of the following is not one of the infinity stones?',
			options: ['Energy', 'Time', 'Power', 'Soul'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Which universe crossover was introduced in the "Sonic the Hedgehog" comic issue #247?',
			options: ['Super Mario Brothers', 'Mega Man', 'Alex Kidd', 'Super Monkey Ball'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: 'In the Marvel Universe, the planet of Svartalfheim is home to what race?',
			options: ['Dark Elves', 'Frost Giants', 'Kronans', 'Skrulls'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'What otherworldly land does Thor come from?',
			options: ['Midgard', 'Asgard', 'Jotunheim', 'Sovengarde'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: "What's the weakness of american vampires (Scott Snyder's American Vampire)?",
			options: ['Sunlight', 'Wood', 'Silver', 'Gold'],
			correct: 3
		},
		{
			category: 'COMICS',
			question:
				"Found in the Marvel Comics fictional universe, what is the name of the nearly indestructible metal that coats Wolverine's bones and claws?",
			options: ['Titanium', 'Vibranium', 'Carbonadium', 'Adamantium'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Which planet did Superman come from?',
			options: ['Avalon', 'Xolnar', 'Krypton', 'Starhaven'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'Who wrote the Batman comic series "The Killing Joke"?',
			options: ['Bill Finger', 'Frank Miller', 'Alan Moore', 'Jerry Siegel'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: "Who was the first American Vampire (Scott Snyder's American Vampire)?",
			options: ['Hattie Hargrove', 'Pearl Jones', 'James "Jim" Book', 'Skinner Sweet'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'In Black Hammer, what city did the heroes save from the Anti-God?',
			options: ['Spiral City', 'Mega-City One', 'Rockwood', 'Star City'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: "In DC comics, what is Owlman's real name?",
			options: ['Thomas Wayne Jr.', 'Thomas Wayne', 'Bruce Wayne', 'Joseph Chill '],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'In 1978, Superman teamed up with what celebrity, to defeat an alien invasion?',
			options: ['Mike Tyson', 'Sylvester Stallone', 'Muhammad Ali', 'Arnold Schwarzenegger'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: "What's the name of Batman's parents?",
			options: ['Joey & Jackie', 'Jason & Sarah', 'Todd & Mira', 'Thomas & Martha'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'What is the name of the main character in the webcomic Gunnerkrigg Court by Tom Siddell?',
			options: ['Bismuth', 'Antimony', 'Mercury', 'Cobalt'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: 'What are the Three Virtues of Bionicle?',
			options: ['Build, Play, Change', 'Work, Play, Live', 'Forge, Build, Fight', 'Unity, Duty, Destiny'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Who is Batman?',
			options: ['Clark Kent', 'Barry Allen', 'Bruce Wayne', 'Tony Stark'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'In Black Hammer, what dimension does Colonel Weird travel through?',
			options: ['Hyperspace', 'Mirror Universe', 'Para-Zone', 'Phantom Zone'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'In "Homestuck" the "Kingdom of Darkness" is also known as?',
			options: ['Skaia', 'Prospit', 'Derse', 'The Medium'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'What is the real name of the "Master Of Magnetism" Magneto?',
			options: ['Charles Xavier', 'Max Eisenhardt', 'Pietro Maximoff', 'Johann Schmidt'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: 'The main six year old protagonist in Calvin and Hobbes is named after what theologian?',
			options: ['John Calvin', 'Calvin Klein', 'Calvin Coolidge', 'Phillip Calvin McGraw'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'In the "Archie" comics, who was Jughead\'s first girlfriend?',
			options: ['Joani', 'Ethel', 'Debbi', 'Margret'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'In "Sonic the Hedgehog" comic, who was the creator of Roboticizer? ',
			options: ['Julian Robotnik', 'Ivo Robotnik', 'Snively Robotnik', 'Professor Charles the Hedgehog'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: "What is Hellboy's true name?",
			options: ['Right Hand of Doom', 'Ogdru Jahad', 'Azzael', 'Anung Un Rama'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'The stuffed tiger in Calvin and Hobbes is named after what philosopher?',
			options: ['David Hobbes', 'John Hobbes', 'Thomas Hobbes', 'Nathaniel Hobbes'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'What is the real hair colour of the mainstream comic book version (Earth-616) of Daredevil?',
			options: ['Auburn', 'Blonde', 'Brown', 'Black'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: "In Calvin and Hobbes, what is the name of the babysitter's boyfriend?",
			options: ['Dave', 'Charlie', 'Charles', 'Nathaniel'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: 'Which of these game-based comics were published in 2011 by DC Comics?',
			options: ['Left 4 Dead: The Sacrifice', 'Prototype', 'Kane & Lynch', 'Infamous'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Who is the second person to take up the mantle of Night Owl in the Watchmen graphic novel?',
			options: ['Daniel Dreiberg', 'Nelson Gardner', 'Hollis Mason', 'Adrian Veidt'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'In Bionicle, who was formerly a Av-Matoran and is now the Toa of Light?',
			options: ['Takua', 'Jaller', 'Vakama', 'Tahu'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'In the Hellboy universe, who founded the BPRD?',
			options: ['Trevor Bruttenholm', 'Kate Corrigan', 'Johann Kraus', 'Benjamin Daimio'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Which superhero is known for his super speed?',
			options: ['Superman', 'Batman', 'Spiderman', 'Flash'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'When Batman trolls the online chat rooms, what alias does he use?',
			options: ['iAmBatman', 'JonDoe297', 'BWayne13', 'BW1129'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: 'In what Homestuck Update was [S] Game Over released?',
			options: ['April 13th, 2009', 'April 8th, 2012', 'October 25th, 2014', 'August 28th, 2003'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'What is the real full name of Captain America?',
			options: ['Steven John Rogers', 'Steven Peggy Rogers', 'Steven William Rogers', 'Steven Grant Rogers '],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Which "Green Arrow" sidekick commonly wears a baseball cap?',
			options: ['Black Canary', 'Emiko Queen', 'Dick Grayson', 'Roy Harper'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'In the webcomic "Ava\'s Demon", what sin is "Nevy Nervine" based off of? ',
			options: ['Sloth', 'Wrath ', 'Lust', 'Envy '],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'When was the Garfield comic first published?',
			options: ['1982', '1973', '1978', '1988'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: "In the Hellboy universe, what was Abe Sapien's birth name?",
			options: ['Langdon Everett Caul', 'Lord Baltimore', 'Sir Edward Grey', 'Landis Pope'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Which issue of the "Sonic the Hedgehog" comic did Scourge the Hedgehog make his first appearance?',
			options: ['Sonic the Hedgehog #11', 'Sonic Universe #32', 'Sonic the Hedgehog #161', 'Sonic the Hedgehog #47'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Who is the creator of the comic series "The Walking Dead"?',
			options: ['Robert Kirkman', 'Stan Lee', 'Malcolm Wheeler-Nicholson', 'Robert Crumb'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'What is the name of the comic about a young boy, and a tiger who is actually a stuffed animal?',
			options: ['Winnie the Pooh', 'Albert and Pogo', 'Calvin and Hobbes', 'Peanuts'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'Which pulp hero made appearances in Hellboy and BPRD comics before getting his own spin-off?',
			options: ['Roger the Homunculus', 'Lobster Johnson', 'The Spider', 'The Wendigo'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: "Better known by his nickname Logan, what is Wolverine's birth name?",
			options: ['James Howlett', 'Logan Wolf', 'Thomas Wilde', 'John Savage'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'What year was the first San Diego Comic-Con?',
			options: ['1970', '2000', '1990', '1985'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'What are the names of the two "Canon fan trolls" in "Homestuck"?',
			options: [
				'The Wrycrown and Voksea Olkido',
				'Aikter Frekik and Xagrai Ollomu',
				'Grekei Ceknux and Riya Camacho',
				'Mierfa Durgas and Nektan Whelan'
			],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'When was Marvel Comics founded?',
			options: ['1939', '1932', '1951', '1936'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'In the Homestuck Series, what is the alternate name for the Kingdom of Lights?',
			options: ['No Name', 'Golden City', 'Yellow Moon', 'Prospit'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'In the Batman comics, by what other name is the villain Dr. Jonathan Crane known?',
			options: ['Bane', 'Calendar Man', 'Scarecrow', 'Clayface'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'What is the designation given to the Marvel Cinematic Universe?',
			options: ['Earth-199999', 'Earth-616', 'Earth-10005', 'Earth-2008'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Who was given the title "Full Metal" in the anime series "Full Metal Alchemist"?',
			options: ['Edward Elric', 'Alphonse Elric', 'Van Hohenheim', 'Izumi Curtis'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Who is the armored titan in "Attack On Titan"?',
			options: ['Armin Arlelt', 'Mikasa Ackermann', 'Eren Jaeger', 'Reiner Braun'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'What is the last name of Edward and Alphonse in the Fullmetal Alchemist series.',
			options: ['Ellis', 'Eliek', 'Elwood', 'Elric'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'Which song was the callsign for Stefan Verdemann\'s KWFM radio station in Urasawa Naoki\'s "Monster"?',
			options: ['What a Wonderful World', 'Over the Rainbow', 'When You Wish Upon A Star', 'Singing In The Rain'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'In which manga did the "404 Girl" from 4chan originate from?',
			options: ['Azumanga Daioh', 'Lucky Star', 'Clover', 'Yotsuba&!'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'Who wrote and directed the animated movie "Spirited Away" (2001)?',
			options: ['Isao Takahata', 'Mamoru Hosoda', 'Hayao Miyazaki', 'Hidetaka Miyazaki'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'Who was the Author of the manga Uzumaki?',
			options: ['Junji Ito', '\tNoboru Takahashi', 'Akira Toriyama', 'Masashi Kishimoto'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Which animation studio produced "Log Horizon"?',
			options: ['Sunrise', 'Xebec', 'Satelite', 'Production I.G'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'When was the first episode of Soul Eater released?',
			options: ['2003', '2005', '2011', '2008'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'Which studio made Cowboy Bebop?',
			options: ['Sunrise', 'Bones', 'Madhouse', 'Pierriot'],
			correct: 0
		},
		{
			category: 'ANIME',
			question:
				'"Silhouette", a song performed by the group \'KANA-BOON\' is featured as the sixteenth opening of which anime?',
			options: ['One Piece', 'Naruto: Shippūden', 'Naruto', 'Gurren Lagann'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Which band name isn\'t a Stand in "JoJo\'s Bizarre Adventure"?',
			options: ['Green Day', 'AC/DC', 'Survivor', 'Red Hot Chili Peppers'],
			correct: 1
		},
		{
			category: 'ANIME',
			question:
				'Which person from "JoJo\'s Bizarre Adventure" does NOT house a reference to a band, artist, or song earlier than 1980?',
			options: ['Giorno Giovanna', 'Josuke Higashikata', 'Jolyne Cujoh', 'Johnny Joestar'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Who is the main character with yellow hair in the anime Naruto?',
			options: ['Naruto', 'Ten Ten', 'Sasuke', 'Kakashi'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'What is the name of the stuffed lion in Bleach?',
			options: ['Jo', 'Urdiu', 'Chad', 'Kon'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'Which animation studio animated "Psycho Pass"?',
			options: ['Kyoto Animation', 'Shaft', 'Production I.G', 'Trigger'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: "What was Ash Ketchum's second Pokemon?",
			options: ['Charmander', 'Pikachu', 'Pidgey', 'Caterpie'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: "Which JoJo's Bizarre Adventure character possesses the Stand named Silver Chariot?",
			options: ['Noriaki Kakyoin', 'Jean Pierre Polnareff', 'Hol Horse', 'Hermes Costello'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'In the "Re:Zero" manga series, which of the following Sin Archbishops eats Rem\'s existence?',
			options: ['Roy Alphard', 'Ley Batenkaitos', 'Petelgeuse Romanee-Conti', 'Louis Arneb'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Who is the horror manga artist who made Uzumaki?',
			options: ['Junji Ito', 'Kazuo Umezu', 'Shintaro Kago', 'Sui Ishida'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'In "Little Witch Academia", what is Shiny Chariot\'s alias at Luna Nova Academy?',
			options: ['Croix Meridies', 'Ursula Callistis', 'Miranda Holbrook', 'Anne Finnelan'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'What name is the main character Chihiro given in the 2001 movie "Spirited Away"?',
			options: ['Hyaku (Hundred)', 'Sen (Thousand)', 'Ichiman (Ten thousand)', 'Juu (Ten)'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'In "To Love-Ru", Ren and Run are from what planet?',
			options: ['Deviluke', 'Mistletoe', 'Okiwana', 'Memorze'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'In the anime "My Hero Academia", which character is shown with the ability to manipulate gravity?',
			options: ['Bakugo', 'Uraraka', 'Deku', 'Asui '],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'What anime studio was in charge of the hit anime "Made in Abyss"?',
			options: ['Trigger', 'Studio 3hz', 'Kinema Citrus', '8bit'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: "The name of Junko Enoshima's imposter at the beginning of Danganronpa: Trigger Happy Havoc is?",
			options: ['Ryota Mitarai', 'Mukuro Ikusaba', 'Ultimate Imposter', 'Komaru Naegi'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Who was the first Legendary Pokemon to be defeated by Ash Ketchum in the Pokémon anime?',
			options: ['Darkrai', 'Latios', 'Articuno', 'Regice'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'Who voices "Shou Suzuki" in the English dub of "Mob Psycho 100"?',
			options: ['Ben Diskin', 'Chris Niosi', 'David Naughton', 'Casey Mongillo'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'In "Shakugan no Shana" what was the Shana usually referred as?',
			options: ['Flame Haze', 'Flame-Haired Burning-Eyed Haze', 'Shana', 'Flame-Haired Burning-Eyed Hunter'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: "The main antagonist of the second part of JoJo's Bizarre Adventure is which of the following?",
			options: ['Kars', 'Erina Joestar', 'Santana', 'Wired Beck'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'What is the age of Ash Ketchum in Pokemon when he starts his journey?',
			options: ['11', '12', '9', '10'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: "Which part from the JoJo's Bizarre Adventure manga is about a horse race across America?",
			options: ['Part 6: Stone Ocean', 'Part 7: Steel Ball Run', 'Part 3: Stardust Crusaders', 'Part 5: Golden Wind'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Kirito and Asuna are main characters from which anime?',
			options: ['One Piece', 'Death Note', 'Sword Art Online', 'Fairy Tail'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'In "Jewelpet Sunshine", what is the song that plays when Kanon and her friends bust out of prison?',
			options: ["I Don't Want to Miss a Thing", 'Eye Of The Tiger', 'Born to be Wild', 'Ruby Ring'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'In "One Piece", who confirms the existence of the legendary treasure, One Piece?',
			options: [
				'Former Marine Fleet Admiral Sengoku',
				'Pirate King Gol D Roger',
				'Silvers Rayleigh',
				'Edward "Whitebeard" Newgate'
			],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'In what year did the manga "Ping Pong" begin serialization?',
			options: ['2014', '1996', '2010', '2003'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'What is the name of the infamous pachinko machine from "Kaiji"?',
			options: ['The Bog', 'The Devil', 'The Undefeated', 'The Dragon'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: "The main protagonist of the fifth part of JoJo's Bizarre Adventure is which of the following?",
			options: ['Guido Mista', 'Giorno Giovanna', 'Jonathan Joestar', 'Joey JoJo'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Which animation studio animated the 2016 anime "Mob Psycho 100"?',
			options: ['A-1 Pictures', 'Shaft', 'Bones', 'Madhouse'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'Who was the Director of the 1988 Anime film "Grave of the Fireflies"?',
			options: ['Isao Takahata', 'Hayao Miyazaki', 'Satoshi Kon', 'Sunao Katabuchi'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'In the superhero anime, "One Punch Man", what is the main protagonist\'s Hero name?',
			options: ['Caped Baldy', 'Strong Fist', 'Mad Boxer', 'Justice Puncher'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'In the anime, "Hunter X Hunter", what is the main protagonist\'s name?',
			options: ['Gin', 'Gan', 'Gen', 'Gon'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'Which animation studio produced the anime adaptation of "xxxHolic"?',
			options: ['Sunrise', 'Xebec', 'Production I.G', 'Kyoto Animation'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'In the anime, "Fullmetal Alchemist", who is known as the \'Flame Alchemist\'?',
			options: ['Roy Mustang', 'Edward Elric', 'Maes Hughes', 'Lin Yao'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'In JoJo\'s Bizarre Adventure, who says "Yare yare daze"?',
			options: ['Jotaro Kujo', 'Joseph Joestar', 'Jolyne Cujoh', 'Koichi Hirose'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Which of these anime have over 7,500 episodes?',
			options: ['Naruto', 'Sazae-san', 'One Piece', 'Chibi Maruko-chan'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'The two main characters of "No Game No Life", Sora and Shiro, together go by what name?',
			options: ['Immanity', 'Blank', 'Disboard', 'Warbeasts'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'The "To Love-Ru" Manga was started in what year?',
			options: ['2007', '2004', '2006', '2005'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'Who is One Punch Man voiced by in the Japanese version.',
			options: ['Zach Aguilar', 'Kaito Ishikawa', 'Makoto Furukawa', 'Max Mittelman '],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'In the 2012 animated film "Wolf Children", what are the names of the wolf children?',
			options: ['Ame & Yuki', 'Hana & Yuki', 'Ame & Hana', 'Chuck & Anna'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'In the "Star Wars" universe, what species is Grand Admiral Thrawn?',
			options: ['Chiss', 'Gungans', 'Pantorans', "Twi'lek"],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: "What was the name of Jonny's pet dog in The Adventures of Jonny Quest?",
			options: ['Lucky', 'Rocky', 'Max', 'Bandit'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Which of these is not a real character in the cartoon series My Little Pony: Friendship is Magic?',
			options: ['Pinkie Pie', 'Maud Pie', 'Rainbow Dash', 'Rose Marene'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Nickelodeon is owned by what parent company?',
			options: ['CBS', 'FOX', 'ABC', 'Viacom'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: "The song 'Little April Shower' features in which Disney cartoon film?",
			options: ['Cinderella', 'Bambi', 'Pinocchio', 'The Jungle Book'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question:
				'Which episode from The Amazing World Of Gumball won the Childrens Choice Award at the British Animation Awards in 2016?',
			options: ['The Limit', 'The Kids', 'The Shell', 'The Gripes'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Who voices for Ruby in the animated series RWBY?',
			options: ['Tara Strong', 'Jessica Nigri', 'Lindsay Jones', 'Hayden Panettiere'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Which of the following films was Don Bluth both the writer, director, and producer for?',
			options: ['Titan A.E.', 'Anastasia', 'All Dogs Go To Heaven', 'The Land Before Time'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'In what year did the anime adaptation of "March Comes In Like A Lion" air?',
			options: ['2017', '2016', '2018', '2015'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'In the animated series RWBY, what is the name of the weapon used by Weiss Schnee?',
			options: ['Gambol Shroud', 'Myrtenaster', 'Crescent Rose', 'Ember Celica'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'What animated internet character is known to answer emails with his boxing gloves?',
			options: ['Strong Sad', 'Strong Bad', 'Strong Mad', 'Strong Glad'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'What ability does Princess Sofia the First have from her amulet that allows her to breathe underwater?',
			options: ['Mermaid Transformation', 'Artificial Gills', 'Bubble Head', 'Bubble Shield'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'In "My Little Pony: Friendship is Magic", which of these ponies represents the quality of honesty?',
			options: ['Twilight Sparkle', 'Pinkie Pie', 'Applejack', 'Rarity'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'What is the name of Sid\'s dog in "Toy Story"?',
			options: ['Buster', 'Whiskers', 'Mr. Jones', 'Scud'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question:
				'Benny, Brain, Fancy-Fancy, Spook and Choo-Choo were known associates of what Hanna Barbera cartoon character?',
			options: ['Yogi Bear', 'Snagglepuss', 'Scooby-Doo', 'Top Cat'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Which "Toy Story" character was voiced by Don Rickles?',
			options: ['Slinky Dog', 'Mr. Potato Head', 'Hamm', 'Rex'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question:
				'Which singer provided the voice of Metroid\'s Mother Brain in the animated series "Captain N: The Game Master"?',
			options: ['Levi Stubbs', 'Freddie Mercury', 'Janet Jackson', 'Joan Jett'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'What is the name of the city that The Flintstones is based in?',
			options: ['Stoneville', 'Rockhampton', 'Bedrock', 'Boulder City'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Who is the "dumb blonde" character in Nickelodeon\'s "The Loud House"?',
			options: ['Luan', 'Luna', 'Lincoln', 'Leni'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'What is the surname of one of the male teachers in the BBC series Postman Pat?',
			options: ['Walker', 'Pringle', 'Dorito', 'Lays'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: "Which 'Family Guy' character got his own spin-off show in 2009?",
			options: ['Glenn Quagmire', 'Joe Swanson', 'Cleveland Brown', 'The Greased-up Deaf Guy'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'In the 1993 Disney animated series "Bonkers", what is the name of Bonker\'s second partner?',
			options: ['Miranda Wright', 'Dick Tracy', 'Eddie Valiant', 'Dr. Ludwig von Drake'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'Who is the only voice actor to have a speaking part in all of the Disney Pixar feature films? ',
			options: ['Tom Hanks', 'Dave Foley', 'Geoffrey Rush', 'John Ratzenberger'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Who voiced Finn in Adventure Time?',
			options: ['Nolan North', 'John DiMaggio', 'Jeremy Shada', 'Tom Kenny'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'In "Gravity Falls", what does Quentin Trembley do when he is driven out from the White House?',
			options: [
				'Leave in peace.',
				'Eat a salamander and jump out the window.',
				'Jump out the window.',
				'Release 1,000 captive salamanders into the white house.'
			],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'What is the cartoon character, Andy Capp, known as in Germany?',
			options: ['Dick Tingeler', 'Helmut Schmacker', 'Rod Tapper', 'Willi Wakker'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'What is the standard frame rate for animation?',
			options: ['12 FPS', '30 FPS', '60 FPS', '24 FPS'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: "What is Scooby Doo's full name?",
			options: ['Scooter Doo', 'Scooby Dooby Doo', 'Scoobert Doo', 'Scoobity Doo'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Who voiced the Genie in Disney\'s "Aladdin"?',
			options: ['Billy Crystal', 'Adam Sandler', 'Jim Carrey', 'Robin Williams'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'What is the name of the creatures that the protagonists of the webshow RWBY fight against?',
			options: ['Grimm', 'Reavers', 'Heartless', 'Dark Ones'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'Before becoming the Autobot leader, Optimus Prime was known by what name on Cybertron?',
			options: ['Long Haul', 'P-138', 'Orion Pax', 'Teletran-1'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question:
				'In the 1969 Cartoon show "Dastardly and Muttley in Their Flying Machines", which were NOT one of the lyrics in the opening theme?',
			options: ['Nab him', 'Jab him', 'Tab him', 'Stab him'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: "Who was the villain of ''The Lion King''?",
			options: ['Scar', 'Fred', 'Jafar', 'Vada'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'In the show "Fat Albert and the Cosby Kids", what is the name of the characters\' fictional gang?',
			options: ['The Junkyard Gang', 'The Trash Troupe', 'The Scrapyard Seven', 'The Rotten Posse'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'What was the number on Gerald\'s shirt in "Hey Arnold!"?',
			options: ['88', '38', '83', '33'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Who created the Cartoon Network series "Adventure Time"?',
			options: ['J. G. Quintel', 'Pendleton Ward', 'Ben Bocquelet', 'Rebecca Sugar'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'Which of these characters live in a pineapple under the sea in the cartoon "SpongeBob SquarePants".',
			options: ['Patrick Star', 'Squidward Tentacles', 'SpongeBob SquarePants ', 'Mr. Krabs'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'What is the relationship between Rick and Morty in the show "Rick and Morty"?',
			options: ['Father and Son', 'Best Friends', 'Grandfather and Grandson', 'Crimefighting Partners'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'What year was the Disney film "A Goofy Movie" released?',
			options: ['1999', '2001', '1995', '1997'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Who created the Cartoon Network series "Regular Show"?',
			options: ['Ben Bocquelet', 'J. G. Quintel', 'Pendleton Ward', 'Rebecca Sugar'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'Which one of these cartoon characters is NOT voiced by Rob Paulsen?',
			options: [
				'Carl Wheezer (Jimmy Neutron)',
				'Yakko Warner (Animaniacs)',
				'The Mask (The Mask, TV Series)',
				'Max Tennyson (Ben 10)'
			],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'In "Gravity Falls", how much does Waddles weigh when Mable wins him in "The Time Traveler\'s Pig"?',
			options: ['20 pounds', '10 pounds', '15 pounds', '30 pounds'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'What is Everest\'s favorite food in the Nickelodeon/Nick Jr. series "PAW Patrol"?',
			options: ['Chicken', 'Liver', 'Steak', 'Caribou'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'Adam West was the mayor of which cartoon town?',
			options: ['Springfield', 'South Park', 'Quahog', 'Langley Falls'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Which of these is NOT a catchphrase used by Rick Sanchez in the TV show "Rick and Morty"?',
			options: ['Hit the sack, Jack!', 'Rikki-Tikki-Tavi, biatch!', 'Wubba-lubba-dub-dub!', 'Slam dunk, nothing but net!'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Which of these characters from "SpongeBob SquarePants" is not a squid?',
			options: ['Gary', 'Orvillie', 'Squidward', 'Squidette'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'Which cartoon family lives in 31 Spooner Street, Quahog, Rhode Island USA?',
			options: ['The Simpsons', 'The Jetsons', 'The Hills', 'The Griffins'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Wendy O. Koopa appeared in the Super Mario DIC Cartoons, but what was she known as?',
			options: ['Sweetie Pie', 'Wendy Pie', 'Honey Pie', 'Kootie Pie'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'What was the release date of the first episode of "The Powerpuff Girls"?',
			options: ['November 18, 1998', 'June 25, 1999', 'July 28, 2000', 'April 14, 2001'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'In "Avatar: The Last Airbender", which element does Aang begin to learn after being defrosted?',
			options: ['Air', 'Earth', 'Fire', 'Water'],
			correct: 3
		}
	]
});
