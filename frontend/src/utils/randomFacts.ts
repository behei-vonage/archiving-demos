const SHORT_FACTS = [
  "Honey never spoils",
  "Octopuses have 3 hearts",
  "Bananas are berries",
  "Sharks are older than trees",
  "Wombats poop cubes",
  "Flamingos are pink from shrimp",
  "Dolphins have names",
  "Cats can't taste sweetness",
  "Penguins propose with pebbles",
  "Butterflies taste with feet",
  "Elephants can't jump",
  "Goldfish have 3-month memory",
  "Snails can sleep 3 years",
  "Koalas sleep 22 hours daily",
  "Hummingbirds fly backwards",
  "Owls can rotate heads 270°",
  "Polar bears have black skin",
  "Seahorses mate for life",
  "Spiders silk is stronger than steel",
  "Bees dance to communicate"
];

export const getRandomFact = (): string => {
  const randomIndex = Math.floor(Math.random() * SHORT_FACTS.length);
  return SHORT_FACTS[randomIndex];
};
