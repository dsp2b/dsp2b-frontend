import dayjs from "dayjs";
import i18next from "i18next";

export function formatDate(date: Date) {
  // 如果大于一年，显示年月日
  if (date.getTime() < new Date().getTime() / 1000 - 365 * 24 * 60 * 60) {
    return dayjs(date).format(i18next.t("time_format"));
  }
  return dayjs(date).fromNow();
}

// 1000=>1k 10000=>10k
export function formatNumber(num: number) {
  if (num < 1000) {
    return num;
  }
  return `${(num / 1000).toFixed(1)}k`;
}
