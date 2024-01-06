export const lngMap: {
  [key: string]: {
    [key: string]: { name: string; value: string; hide?: boolean };
  };
} = {
  en: { en: { name: "English", value: "en" } },
  zh: {
    "zh-CN": { name: "简体中文", value: "zh-CN" },
  },
  ach: {
    "ach-UG": { name: "伪语言", value: "ach-UG", hide: true },
  },
};
