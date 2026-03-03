import type { Meal, Workout } from '../domain/types';
import { v4 as uuidv4 } from './uuid';

export function getSeedMeals(): Meal[] {
  return [
    {
      id: uuidv4(),
      name: "Joe's Keto Pizza (Fathead / Almond Flour)",
      tags: ['keto', 'pizza', 'fathead'],
      ingredients: [
        {
          id: uuidv4(),
          name: 'Mozzarella cheese (shredded)',
          quantity: '200g',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Almond flour',
          quantity: '100g',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Cream cheese',
          quantity: '50g',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Egg',
          quantity: '1 large',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Pizza sauce (sugar-free)',
          quantity: '100g',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Pepperoni',
          quantity: '50g',
          store: 'Coles',
        },
      ],
      instructions: [
        'Preheat oven to 200°C (400°F)',
        'Melt 200g mozzarella and cream cheese together in microwave',
        'Mix in almond flour and egg until dough forms',
        'Roll out dough between parchment paper',
        'Pre-bake crust for 8 minutes',
        'Add sauce, remaining mozzarella, and pepperoni',
        'Bake for 10-12 minutes until cheese is bubbly',
      ],
      prepTimeMins: 15,
      cookTimeMins: 20,
    },
    {
      id: uuidv4(),
      name: '250g Mince Taco Bowl',
      tags: ['keto', 'mexican', 'taco'],
      ingredients: [
        {
          id: uuidv4(),
          name: 'Beef mince',
          quantity: '250g',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Taco seasoning',
          quantity: '2 tbsp',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Lettuce',
          quantity: '2 cups shredded',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Cherry tomatoes',
          quantity: '100g',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Cheddar cheese',
          quantity: '50g',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Sour cream',
          quantity: '50g',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Avocado',
          quantity: '1/2',
          store: 'Coles',
        },
      ],
      instructions: [
        'Brown mince in a pan over medium-high heat',
        'Add taco seasoning and a splash of water',
        'Simmer for 5 minutes until seasoning is absorbed',
        'Assemble bowl with lettuce as base',
        'Top with seasoned mince, tomatoes, cheese',
        'Add sour cream and sliced avocado',
        'Optional: add jalapeños or hot sauce',
      ],
      prepTimeMins: 10,
      cookTimeMins: 15,
    },
    {
      id: uuidv4(),
      name: 'Salmon Salad',
      tags: ['keto', 'salad', 'fish'],
      ingredients: [
        {
          id: uuidv4(),
          name: 'Salmon fillet',
          quantity: '200g',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Mixed greens',
          quantity: '3 cups',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Cucumber',
          quantity: '1/2',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Cherry tomatoes',
          quantity: '100g',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Red onion',
          quantity: '1/4',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Feta cheese',
          quantity: '50g',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Olive oil',
          quantity: '2 tbsp',
          store: 'Coles',
        },
        {
          id: uuidv4(),
          name: 'Lemon',
          quantity: '1/2',
          store: 'Coles',
        },
      ],
      instructions: [
        'Season salmon with salt, pepper, and lemon juice',
        'Pan-fry salmon for 4-5 minutes per side',
        'Let salmon rest while preparing salad',
        'Combine mixed greens, cucumber, tomatoes, onion',
        'Drizzle with olive oil and lemon juice',
        'Top with crumbled feta',
        'Place cooked salmon on top or flake throughout',
      ],
      prepTimeMins: 10,
      cookTimeMins: 10,
    },
  ];
}

export function getSeedWorkouts(): Workout[] {
  return [
    {
      id: uuidv4(),
      name: 'Full Body Reset Workout A',
      exercises: [
        {
          id: uuidv4(),
          name: 'Dumbbell Goblet Squat',
          sets: 3,
          reps: '10-12',
          load: '15-20kg',
          notes: 'Focus on depth and form',
        },
        {
          id: uuidv4(),
          name: 'Dumbbell Bench Press',
          sets: 3,
          reps: '8-10',
          load: '12-15kg per hand',
          notes: 'Control the descent',
        },
        {
          id: uuidv4(),
          name: 'Bent-Over Dumbbell Row',
          sets: 3,
          reps: '10-12',
          load: '12-15kg per hand',
          notes: 'Pull to waist, squeeze shoulder blades',
        },
        {
          id: uuidv4(),
          name: 'Dumbbell Shoulder Press',
          sets: 3,
          reps: '10-12',
          load: '10-12kg per hand',
          notes: 'Press overhead, full range of motion',
        },
        {
          id: uuidv4(),
          name: 'Plank',
          sets: 3,
          reps: '30-60 seconds',
          notes: 'Keep core tight, neutral spine',
        },
      ],
    },
    {
      id: uuidv4(),
      name: 'Full Body Reset Workout B',
      exercises: [
        {
          id: uuidv4(),
          name: 'Dumbbell Romanian Deadlift',
          sets: 3,
          reps: '10-12',
          load: '15-20kg per hand',
          notes: 'Hinge at hips, feel hamstring stretch',
        },
        {
          id: uuidv4(),
          name: 'Dumbbell Lunge',
          sets: 3,
          reps: '10 per leg',
          load: '10-12kg per hand',
          notes: 'Step forward, 90-degree angles',
        },
        {
          id: uuidv4(),
          name: 'Dumbbell Chest Fly',
          sets: 3,
          reps: '10-12',
          load: '8-10kg per hand',
          notes: 'Slight bend in elbows, feel chest stretch',
        },
        {
          id: uuidv4(),
          name: 'Dumbbell Bicep Curl',
          sets: 3,
          reps: '12-15',
          load: '8-10kg per hand',
          notes: 'Control the movement, full range',
        },
        {
          id: uuidv4(),
          name: 'Dumbbell Overhead Tricep Extension',
          sets: 3,
          reps: '12-15',
          load: '10-12kg',
          notes: 'One dumbbell, behind head, elbows in',
        },
      ],
    },
  ];
}
