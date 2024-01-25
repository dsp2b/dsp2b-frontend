import { FolderFilled, FolderOutlined } from "@ant-design/icons";
import { Button, Card, Dropdown, Typography } from "antd";
import { useLocale } from "remix-i18next";

export type CollectionFolderItem = { id: string; title: string };

const CollectionFolder: React.FC<{
  title: string;
  list: Array<CollectionFolderItem>;
  bordered?: boolean;
  bodyStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  headStyle?: React.CSSProperties;
}> = ({ title, list, bordered = true, style, bodyStyle, headStyle }) => {
  const uLocale = "/" + useLocale();
  return (
    <Card
      title={title}
      bordered={bordered}
      headStyle={headStyle}
      bodyStyle={bodyStyle}
      style={style}
    >
      <div className="flex flex-row flex-wrap gap-3">
        {list.map((item, index) => (
          <Button
            style={{
              width: "100px",
              height: "100px",
            }}
            type="text"
            href={uLocale + "/collection/" + item.id}
          >
            <div
              className="flex flex-col items-center justify-between w-full"
              style={{
                height: "80px",
              }}
            >
              <FolderFilled
                className="text-5xl"
                style={{
                  color: "#26b3ff",
                }}
              />
              <Typography.Text
                style={{
                  width: "90px",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {item.title}
              </Typography.Text>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default CollectionFolder;
