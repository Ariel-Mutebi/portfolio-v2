export interface Skill {
  name: string;
  level: number;
  link: string;
}

export interface SkillSet {
  skillSet: string;
  skills: Skill[];
}
