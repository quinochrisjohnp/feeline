import type { WellnessRule } from "../types/wellness";
export const wellnessDisclaimer = "FeELINE recognizes observable cues from images. It does not diagnose illness or replace professional veterinary advice.";
export const wellnessThresholdNote = "These are FeELINE check-in heuristics, not veterinarian-validated diagnostic thresholds.";
export const wellnessDoNotWait = "If you already notice a concerning physical or behavioral change, you do not need to wait for another FeELINE detection before seeking veterinary advice.";
export const notificationExplanation = "Allow notifications so FeELINE can remind you to check in with your cat at the time you choose.";
export function wellnessGuidance(name: string, rule: WellnessRule) {
  const general = [
    "Is " + name + " acting like their usual self?",
    "Is " + name + " eating and drinking normally?",
    "Have you noticed weakness, reduced activity, or more hiding than usual?",
    "Is " + name + " using the litter box normally?",
    "Have you noticed any wounds, swelling, skin irritation, parasites, or signs of discomfort?",
  ];
  const environment = [
    "Was the area unusually hot or poorly ventilated?",
    "Was there loud noise, machinery, fireworks, music, or another disturbance nearby?",
    "Were unfamiliar people or animals present?",
    "Was any furniture, food bowl, litter box, or familiar object recently moved?",
    "Could a repeated routine—such as someone leaving, feeding time, travel, or a clinic visit—be affecting " + name + "?",
    "Could a previous frightening experience or an unfamiliar situation be relevant?",
  ];
  const interaction = [
    "Would giving " + name + " a quiet space and reducing nearby stressors help?",
    "Can you allow " + name + " to approach voluntarily instead of forcing contact?",
    "Could a calm voice, slow movement, and a familiar routine help " + name + " settle?",
  ];
  return {
    summary: rule === "similar_time_pattern"
      ? "These detections appeared around similar times on several days. Could a routine or environmental change be influencing how " + name + " responds?"
      : "FeELINE noticed several Angry or Fearful detections for " + name + ". This does not confirm a health problem, but it may be helpful to check what was happening around those times.",
    primary: rule === "similar_time_pattern" ? [environment[0], environment[1], environment[4], general[1]] : general.slice(0,4),
    more: rule === "similar_time_pattern" ? [...general.filter((_,i) => i !== 1), ...environment.filter((_,i) => ![0,1,4].includes(i)), ...interaction]
      : [general[4], ...environment, ...interaction],
    safety: "If " + name + " moves away, hisses, growls, or shows other warning signs, give them space and avoid forcing contact.",
    veterinary: "If the behavior continues, becomes more frequent, or appears together with changes in appetite, drinking, activity, litter-box use, or physical condition, would it be safer to contact a veterinarian?",
  };
}
