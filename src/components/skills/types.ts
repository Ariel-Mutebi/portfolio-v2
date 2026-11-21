export interface Skill {
  name: string;
  level: number;
  link: string;
}

export interface File {
  filename: string;
  title: string;
  description: string;
  skills: Skill[];
}

export interface WindowState extends File {
  id: number;
  closed: boolean;
}
