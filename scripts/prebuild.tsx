import fs from "fs";
import { extractStyle } from "@ant-design/static-style-extract";
import { StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider, theme } from "antd";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { ReactNode } from "react";

const outputPath = "./public/styles/antd.min.css";

const css = extractStyle((node: ReactNode) => (
  <>
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <StyleProvider hashPriority="high">{node}</StyleProvider>
    </ConfigProvider>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
      }}
    >
      <StyleProvider hashPriority="high">{node}</StyleProvider>
    </ConfigProvider>
  </>
));

// 创建目录
fs.mkdirSync("./public/styles", { recursive: true });
// 生成css
fs.writeFileSync(outputPath, css);
