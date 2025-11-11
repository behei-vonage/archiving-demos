const SHORT_FACTS = [
  "A day on Venus is longer than its year",
  "Cows have best friends",
  "The Eiffel Tower can grow 6 inches in summer",
  "Mantis shrimp can punch with force of a bullet",
  "Strawberries aren't berries but avocados are",
  "Water can boil and freeze simultaneously",
  "A group of flamingos is a flamboyance",
  "Giraffes hum to each other at night",
  "Rain smells because of bacteria",
  "Trees can send warnings to each other",
  "The human body glows in the dark",
  "Zombies are real in nature",
  "Lobsters can live over 100 years",
  "A cloud can weigh a million pounds",
  "Pineapples take 2 years to grow",
  "You can hear a blue whale 500 miles away",
  "Neutron stars can spin 600 times per second",
  "Humans share 60% DNA with bananas",
  "A single bolt has enough lightning for 250000 toasts",
  "Baby puffins are called pufflings"
];

export const getRandomFact = (): string => {
  const randomIndex = Math.floor(Math.random() * SHORT_FACTS.length);
  return SHORT_FACTS[randomIndex];
};
