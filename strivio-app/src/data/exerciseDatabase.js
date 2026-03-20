export const exerciseDatabase = [
  {
    id: 'squats',
    name: 'Squats',
    targetMuscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Core'],
    difficulty: 'Beginner',
    instructions: [
      { text: 'Stand with feet shoulder-width apart.', image: 'https://tse1.mm.bing.net/th?q=squat+exercise+starting+position+fitness' },
      { text: 'Keeping your back straight, bend your knees and lower your hips as if sitting in a chair.', image: 'https://tse1.mm.bing.net/th?q=squat+exercise+mid+phase+form' },
      { text: 'Go down until your thighs are parallel to the floor.', image: 'https://tse1.mm.bing.net/th?q=perfect+deep+squat+parallel+form' },
      { text: 'Push through your heels to return to the starting position.', image: 'https://tse1.mm.bing.net/th?q=squat+standing+up+power' }
    ],
    commonMistakes: [
      { text: 'Knees caving inwards.', image: 'https://tse1.mm.bing.net/th?q=squat+mistake+knees+caving+valgus' },
      { text: 'Rounding the lower back.', image: 'https://tse1.mm.bing.net/th?q=squat+mistake+rounded+back+butt+wink' },
      { text: 'Lifting heels off the ground.', image: 'https://tse1.mm.bing.net/th?q=squat+mistake+heels+lifting' }
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=aclHkVaku9U',
    videoPreviewUrl: 'https://img.youtube.com/vi/aclHkVaku9U/0.jpg'
  },
  {
    id: 'pushups',
    name: 'Pushups',
    targetMuscles: ['Chest', 'Shoulders', 'Triceps', 'Core'],
    difficulty: 'Intermediate',
    instructions: [
      { text: 'Start in a high plank position with hands slightly wider than shoulders.', image: 'https://tse1.mm.bing.net/th?q=pushup+starting+high+plank+position' },
      { text: 'Keep your body in a straight line from head to heels.', image: 'https://tse1.mm.bing.net/th?q=pushup+straight+body+line+posture' },
      { text: 'Lower your body until your chest nearly touches the floor.', image: 'https://tse1.mm.bing.net/th?q=pushup+bottom+position+chest+to+floor' },
      { text: 'Push back up to the starting position.', image: 'https://tse1.mm.bing.net/th?q=pushup+extension+power+up' }
    ],
    commonMistakes: [
      { text: 'Sagging the hips.', image: 'https://tse1.mm.bing.net/th?q=pushup+mistake+sagging+hips+lower+back' },
      { text: 'Flaring elbows out too wide.', image: 'https://tse1.mm.bing.net/th?q=pushup+mistake+flared+elbows' },
      { text: 'Not going down far enough.', image: 'https://tse1.mm.bing.net/th?q=pushup+mistake+half+rep+shallow' }
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    videoPreviewUrl: 'https://img.youtube.com/vi/IODxDxX7oi4/0.jpg'
  },
  {
    id: 'lunges',
    name: 'Lunges',
    targetMuscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
    difficulty: 'Beginner',
    instructions: [
      { text: 'Stand tall with feet hip-width apart.', image: 'https://tse1.mm.bing.net/th?q=lunge+starting+standing+position' },
      { text: 'Take a big step forward with your right leg.', image: 'https://tse1.mm.bing.net/th?q=lunge+step+forward+motion' },
      { text: 'Lower your body until your right thigh is parallel to the floor.', image: 'https://tse1.mm.bing.net/th?q=perfect+lunge+90+degree+angle' },
      { text: 'Push off your right foot to return to the start.', image: 'https://tse1.mm.bing.net/th?q=lunge+pushing+back+up' }
    ],
    commonMistakes: [
      { text: 'Letting the front knee go past the toes heavily.', image: 'https://tse1.mm.bing.net/th?q=lunge+mistake+knee+over+toes' },
      { text: 'Leaning the torso too far forward.', image: 'https://tse1.mm.bing.net/th?q=lunge+mistake+leaning+forward' },
      { text: 'Taking a step that is too short.', image: 'https://tse1.mm.bing.net/th?q=lunge+mistake+short+step+cramped' }
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=L8fvypPrzis',
    videoPreviewUrl: 'https://img.youtube.com/vi/L8fvypPrzis/0.jpg'
  },
  {
    id: 'pullups',
    name: 'Pullups',
    targetMuscles: ['Latissimus Dorsi', 'Biceps', 'Upper Back', 'Core'],
    difficulty: 'Advanced',
    instructions: [
      { text: 'Grip the pullup bar with palms facing away from you.', image: 'https://tse1.mm.bing.net/th?q=pullup+overhand+grip' },
      { text: 'Hang freely with arms fully extended.', image: 'https://tse1.mm.bing.net/th?q=pullup+dead+hang+starting+position' },
      { text: 'Pull yourself up until your chin clears the bar.', image: 'https://tse1.mm.bing.net/th?q=pullup+top+position+chin+over+bar' },
      { text: 'Lower yourself back down with control.', image: 'https://tse1.mm.bing.net/th?q=pullup+eccentric+lowering+phase' }
    ],
    commonMistakes: [
      { text: 'Using momentum (kipping) instead of muscle strength.', image: 'https://tse1.mm.bing.net/th?q=pullup+mistake+kipping+swinging' },
      { text: 'Not completing a full range of motion.', image: 'https://tse1.mm.bing.net/th?q=pullup+mistake+half+rep' },
      { text: 'Letting the shoulders shrug up to the ears.', image: 'https://tse1.mm.bing.net/th?q=pullup+mistake+shrugged+shoulders' }
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
    videoPreviewUrl: 'https://img.youtube.com/vi/eGo4IYlbE5g/0.jpg'
  },
  {
    id: 'plank',
    name: 'Plank',
    targetMuscles: ['Core', 'Shoulders', 'Back'],
    difficulty: 'Beginner',
    instructions: [
      { text: 'Start face down on the floor, resting on your forearms and toes.', image: 'https://tse1.mm.bing.net/th?q=forearm+plank+starting+position' },
      { text: 'Ensure your elbows are directly under your shoulders.', image: 'https://tse1.mm.bing.net/th?q=plank+elbows+under+shoulders' },
      { text: 'Keep your body in a straight line from head to heels.', image: 'https://tse1.mm.bing.net/th?q=perfect+straight+plank+form' },
      { text: 'Hold this position while bracing your core.', image: 'https://tse1.mm.bing.net/th?q=plank+core+bracing+fitness' }
    ],
    commonMistakes: [
      { text: 'Raising the hips too high (forming a tent).', image: 'https://tse1.mm.bing.net/th?q=plank+mistake+hips+too+high+tent' },
      { text: 'Letting the hips sag toward the ground.', image: 'https://tse1.mm.bing.net/th?q=plank+mistake+sagging+hips' },
      { text: 'Looking up and straining the neck.', image: 'https://tse1.mm.bing.net/th?q=plank+mistake+looking+up+neck+strain' }
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
    videoPreviewUrl: 'https://img.youtube.com/vi/ASdvN_XEl_c/0.jpg'
  },
  {
    id: 'jumping_jacks',
    name: 'Jumping Jacks',
    targetMuscles: ['Calves', 'Shoulders', 'Core'],
    difficulty: 'Beginner',
    instructions: [
      { text: 'Stand upright with your legs together and arms at your sides.', image: 'https://tse1.mm.bing.net/th?q=jumping+jack+starting+position' },
      { text: 'Bend your knees slightly and jump into the air.', image: 'https://tse1.mm.bing.net/th?q=jumping+jack+jump+motion' },
      { text: 'As you jump, spread your legs shoulder-width apart and stretch your arms out and over your head.', image: 'https://tse1.mm.bing.net/th?q=jumping+jack+star+position+arms+high' },
      { text: 'Jump back to the starting position.', image: 'https://tse1.mm.bing.net/th?q=jumping+jack+landing+position' }
    ],
    commonMistakes: [
      { text: 'Not raising arms fully overhead.', image: 'https://tse1.mm.bing.net/th?q=jumping+jack+mistake+arms+too+low' },
      { text: 'Landing heavily on your feet.', image: 'https://tse1.mm.bing.net/th?q=jumping+jack+mistake+heavy+landing' }
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=lmA3V2mVZlU',
    videoPreviewUrl: 'https://img.youtube.com/vi/lmA3V2mVZlU/0.jpg'
  },
  {
    id: 'legraises',
    name: 'Leg Raises',
    targetMuscles: ['Lower Abs', 'Hip Flexors'],
    difficulty: 'Intermediate',
    instructions: [
      { text: 'Lie flat on your back with legs straight and together.', image: 'https://tse1.mm.bing.net/th?q=leg+raises+starting+position+lying+flat' },
      { text: 'Keep your arms by your sides or under your lower back for support.', image: 'https://tse1.mm.bing.net/th?q=leg+raises+arms+under+back' },
      { text: 'Keeping the legs straight, lift them all the way up to the ceiling.', image: 'https://tse1.mm.bing.net/th?q=leg+raises+legs+up+90+degrees' },
      { text: 'Slowly lower them back down without letting them touch the floor.', image: 'https://tse1.mm.bing.net/th?q=leg+raises+lowering+phase' }
    ],
    commonMistakes: [
      { text: 'Arching the lower back off the floor.', image: 'https://tse1.mm.bing.net/th?q=leg+raises+mistake+arched+back' },
      { text: 'Using momentum instead of controlled motion.', image: 'https://tse1.mm.bing.net/th?q=leg+raises+mistake+momentum+swinging' },
      { text: 'Bending the knees excessively.', image: 'https://tse1.mm.bing.net/th?q=leg+raises+mistake+bent+knees' }
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=5lVjgVg-b0Q',
    videoPreviewUrl: 'https://img.youtube.com/vi/5lVjgVg-b0Q/0.jpg'
  },
  {
    id: 'bicep_curls',
    name: 'Bicep Curls',
    targetMuscles: ['Biceps', 'Forearms'],
    difficulty: 'Beginner',
    instructions: [
      { text: 'Stand tall holding dumbbells by your sides with palms facing forward.', image: 'https://tse1.mm.bing.net/th?q=bicep+curl+starting+position' },
      { text: 'Keep your chest up and elbows tucked close to your torso.', image: 'https://tse1.mm.bing.net/th?q=bicep+curl+elbows+tucked' },
      { text: 'Curl the weights upward while contracting your biceps.', image: 'https://tse1.mm.bing.net/th?q=bicep+curl+lifting+phase' },
      { text: 'Slowly lower the weights back to full extension.', image: 'https://tse1.mm.bing.net/th?q=bicep+curl+lowering+phase' }
    ],
    commonMistakes: [
      { text: 'Swinging the torso to use momentum.', image: 'https://tse1.mm.bing.net/th?q=bicep+curl+mistake+swinging+torso' },
      { text: 'Moving elbows forward instead of keeping them pinned.', image: 'https://tse1.mm.bing.net/th?q=bicep+curl+mistake+elbows+forward' },
      { text: 'Not fully extending arms at the bottom.', image: 'https://tse1.mm.bing.net/th?q=bicep+curl+mistake+half+rep' }
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    videoPreviewUrl: 'https://img.youtube.com/vi/ykJmrZ5v0Oo/0.jpg'
  }
];
