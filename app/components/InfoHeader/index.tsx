import { DownloadOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Typography } from "antd";
import React, { ReactNode } from "react";

const InfoHeader: React.FC<{ children?: ReactNode }> = ({ children }) => {
  return (
    <Card
      title={
        <Card.Meta
          title={<Typography.Text>用户名</Typography.Text>}
          description={<Typography.Title level={4}>蓝图名</Typography.Title>}
          avatar={<Avatar size="small">{"我一直"}</Avatar>}
        ></Card.Meta>
      }
    >
      <div>
        <div className="card-padding">miaoshu</div>
        {children}
        <div className="flex flex-row-reverse">
          <Button icon={<DownloadOutlined />}>下载蓝图集zip包</Button>
        </div>
      </div>
    </Card>
  );
};
export default InfoHeader;
