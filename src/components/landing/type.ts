import { GraduationCap, Sparkles, CloudCheck } from "lucide-react";

export const tabs = [
  {
    icon: Sparkles,
    title: "Clean UI",
    isNew: false,
    backgroundPositionX: 0,
    backgroundPositionY: 0,
    backgroundSizeX: 150,
  },
  {
    icon: GraduationCap,
    title: "Quick Learning",
    isNew: false,
    backgroundPositionX: 100,
    backgroundPositionY: 27,
    backgroundSizeX: 177,
  },
  {
    icon: CloudCheck,
    title: "Saved Progress",
    isNew: false,
    backgroundPositionX: 98,
    backgroundPositionY: 100,
    backgroundSizeX: 135,
  },
];

export type TabType = typeof tabs;