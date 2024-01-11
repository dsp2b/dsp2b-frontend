import { FolderOutlined } from "@ant-design/icons";
import { Button, Card, Dropdown, Typography } from "antd";

export type CollectionFolderItem = { title: string };

const CollectionFolder: React.FC<{
  title: string;
  list: Array<CollectionFolderItem>;
  bordered?: boolean;
  style?: React.CSSProperties;
}> = ({ title, list, bordered = true, style }) => {
  return (
    <Card title={title} bordered={bordered} headStyle={style}>
      <div className="flex flex-row flex-wrap">
        {list.map((item, index) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "open",
                  label: "打开",
                },
                {
                  key: "open_desc",
                  label: "打开描述页",
                },
                {
                  key: "share",
                  label: "分享",
                },
                {
                  key: "manage",
                  label: "管理",
                },
              ],
            }}
          >
            <Button
              style={{
                width: "100px",
                height: "100px",
              }}
            >
              <div
                className="flex flex-col items-center justify-between w-full"
                style={{
                  height: "80px",
                }}
              >
                <FolderOutlined />
                <Typography.Text
                  style={{
                    width: "90px",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                >
                  {item.title + index}
                </Typography.Text>
              </div>
            </Button>
          </Dropdown>
        ))}
      </div>
    </Card>
  );
};

export default CollectionFolder;
