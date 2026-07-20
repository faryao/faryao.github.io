export type AppIcon = 'code' | 'diary' | 'people' | 'road';

export interface AppLink {
  name: string;
  description: string;
  href: string;
  icon: AppIcon;
  lang: string;
  isNew?: boolean;
}

export const projectApps: AppLink[] = [
  {
    name: 'Yuan’s Diary',
    description: 'A small public diary, written one day at a time.',
    href: 'https://faryao.github.io/public-diary/',
    icon: 'diary',
    lang: 'en',
    isNew: true,
  },
  {
    name: 'GitHub',
    description: 'Yuan Yao on GitHub',
    href: 'https://github.com/faryao',
    icon: 'code',
    lang: 'en',
  },
];

export const archiveApps: AppLink[] = [
  {
    name: '爱尔兰道路规则',
    description: '爱尔兰《道路规则》中文版',
    href: 'https://faryao.github.io/irish-driver-rules-zh/',
    icon: 'road',
    lang: 'zh-Hans',
  },
  {
    name: '道路使用者指南',
    description: '爱尔兰道路使用者指南中文版',
    href: 'https://faryao.github.io/rsa-road-users-zh/',
    icon: 'people',
    lang: 'zh-Hans',
  },
];
