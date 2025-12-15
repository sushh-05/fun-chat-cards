// src/utils/randomTopics.js
export const RANDOM_TOPICS = [
  "coffee cravings",
  "awkward first date",
  "group projects",
  "midnight snacks",
  "graduation day",
  "office small talk",
  "lost phone panic",
  "sneaky nap at work",
  "study procrastination",
  "the perfect weekend",
  "pizza opinions",
  "gym motivation",
  "travel bucket list",
  "failed DIY",
  "meeting that could be email"
];

export function randomTopic() {
  const idx = Math.floor(Math.random() * RANDOM_TOPICS.length);
  return RANDOM_TOPICS[idx];
}
