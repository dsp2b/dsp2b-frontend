import { Avatar } from "antd";
import { CSSProperties } from "react";

const DSPCover: React.FC<{
  style: CSSProperties;
  className?: string;
  items: { item_id: number; name?: string; icon_path?: string }[];
}> = ({ style, items, className }) => {
  let tmpClassName = "flex flex-row justify-center items-center";
  tmpClassName += className ? " " + className : "";
  style.background = "#246cb9";
  style.display = "flex";
  style.flexWrap = "wrap";
  style.justifyItems = "center";
  style.alignItems = "center";
  style.justifyContent = "center";
  items = items.length > 4 ? items.slice(0, 4) : items;
  switch (items.length) {
    case 0:
      return <div className={tmpClassName} style={style}></div>;
    case 1:
      return (
        <div className={tmpClassName} style={style}>
          <Avatar
            shape="square"
            style={{
              display: "block",
              width: "50%",
              height: "auto",
            }}
            src={"/images/icons/item_recipe/" + items[0].icon_path + ".png"}
          />
        </div>
      );
    case 2:
      return (
        <div style={style}>
          <Avatar
            shape="square"
            style={{
              display: "block",
              width: "33%",
              height: "auto",
            }}
            src={"/images/icons/item_recipe/" + items[0].icon_path + ".png"}
          />
          <Avatar
            style={{
              display: "block",
              width: "33%",
              height: "auto",
            }}
            shape="square"
            src={"/images/icons/item_recipe/" + items[1].icon_path + ".png"}
          />
        </div>
      );
    case 3: {
      const style2: CSSProperties = {
        display: "flex",
        width: "100%",
        justifyContent: "center",
      };
      return (
        <div style={style}>
          <div style={style2}>
            <Avatar
              shape="square"
              style={{
                display: "block",
                width: "33%",
                height: "auto",
              }}
              src={"/images/icons/item_recipe/" + items[0].icon_path + ".png"}
            />
          </div>
          <div style={style2}>
            <Avatar
              style={{
                display: "block",
                width: "33%",
                height: "auto",
              }}
              shape="square"
              src={"/images/icons/item_recipe/" + items[1].icon_path + ".png"}
            />
            <Avatar
              style={{
                display: "block",
                width: "33%",
                height: "auto",
              }}
              shape="square"
              src={"/images/icons/item_recipe/" + items[2].icon_path + ".png"}
            />
          </div>
        </div>
      );
    }
    case 4: {
      const style2: CSSProperties = {
        display: "flex",
        width: "100%",
        justifyContent: "center",
      };
      return (
        <div style={style}>
          <div style={style2}>
            <Avatar
              shape="square"
              style={{
                display: "block",
                width: "33%",
                height: "auto",
              }}
              src={"/images/icons/item_recipe/" + items[0].icon_path + ".png"}
            />
            <Avatar
              style={{
                display: "block",
                width: "33%",
                height: "auto",
              }}
              shape="square"
              src={"/images/icons/item_recipe/" + items[1].icon_path + ".png"}
            />
          </div>
          <div style={style2}>
            <Avatar
              shape="square"
              style={{
                display: "block",
                width: "33%",
                height: "auto",
              }}
              src={"/images/icons/item_recipe/" + items[2].icon_path + ".png"}
            />
            <Avatar
              style={{
                display: "block",
                width: "33%",
                height: "auto",
              }}
              shape="square"
              src={"/images/icons/item_recipe/" + items[3].icon_path + ".png"}
            />
          </div>
        </div>
      );
    }
  }
  return <div style={style}></div>;
};

export default DSPCover;
