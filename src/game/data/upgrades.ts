export type UpgradeId =
  | "fire-rate"
  | "bullet-damage"
  | "move-speed"
  | "bullet-speed"
  | "multi-shot"
  | "dash-cooldown";

export type Upgrade = {
  id: UpgradeId;
  title: string;
  description: string;
};

export const ALL_UPGRADES: Upgrade[] = [
  {
    id: "fire-rate",
    title: "Quick Fingers",
    description: "Shoot faster",
  },
  {
    id: "bullet-damage",
    title: "Heavy Rounds",
    description: "Bullets deal more damage",
  },
  {
    id: "move-speed",
    title: "Swift Boots",
    description: "Move faster",
  },
  {
    id: "bullet-speed",
    title: "Rail Powder",
    description: "Bullets fly faster",
  },
  {
    id: "multi-shot",
    title: "Twin Fang",
    description: "Shoot one extra bullet",
  },
  {
    id: "dash-cooldown",
    title: "Blink Core",
    description: "Dash recharges faster",
  },
];

export function getRandomUpgrades(count: number): Upgrade[] {
  const copy = [...ALL_UPGRADES];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy.slice(0, count);
}