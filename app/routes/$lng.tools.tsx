import { Button, Card, List, Typography } from "antd";
import { useTranslation } from "react-i18next";

export default function Tools() {
  const { t } = useTranslation();
  return (
    <Card title={t("tools")}>
      <List>
        <List.Item className="!flex !flex-row gap-3 !justify-start">
          <Button type="link" href="https://dsp-calc.pro/" target="_blank">
            戴森球计划量化计算器
          </Button>
          <Button
            type="link"
            href="https://www.svlik.com/t/dsq/"
            target="_blank"
          >
            戴森球计划量产量化计算器工具
          </Button>
        </List.Item>
        <List.Item className="!flex !flex-row gap-3 !justify-start">
          <Button
            type="link"
            href="https://huww98.github.io/dsp_blueprint_editor/"
            target="_blank"
          >
            戴森球计划蓝图预览
          </Button>
          <Button
            type="link"
            href="https://scriptcat.org/zh-CN/script-show-page/1524"
            target="_blank"
          >
            DSP2B戴森球蓝图预览工具（油猴脚本）
          </Button>
        </List.Item>
        <List.Item>
          <Button
            type="link"
            href="https://cying.xyz/DSP/editBluePrint/"
            target="_blank"
          >
            DSP蓝图变换工具
          </Button>
        </List.Item>
      </List>
    </Card>
  );
}
