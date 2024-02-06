import { Avatar, Space, Typography } from "antd";
import { CSSProperties } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Icons } from "~/services/blueprint.server";
import { formatNumber } from "~/utils/utils";

const Icon: React.FC<{
  style: CSSProperties;
  iconPath?: string;
  lazy?: boolean;
}> = ({ iconPath, style, lazy = true }) => {
  if (iconPath) {
    if (!lazy) {
      return <img style={style} src={"/images/" + iconPath + ".png"} />;
    }
    return <LazyLoadImage style={style} src={"/images/" + iconPath + ".png"} />;
  }
  return <div style={style}></div>;
};

export const GameIcon: React.FC<{
  icons: Icons;
  style: CSSProperties;
  className?: string;
}> = ({ className, icons, style }) => {
  switch (icons.Layout) {
    case 10:
      return (
        <div className={className} style={style}>
          <Icon
            style={{
              display: "block",
              width: "60%",
              height: "auto",
            }}
            iconPath={icons.Icon0?.IconPath}
          />
        </div>
      );
    case 11:
      return (
        <div className={className} style={style}>
          <Icon
            style={{
              display: "block",
              width: "30%",
              height: "auto",
            }}
            iconPath={icons.Icon0?.IconPath}
          />
        </div>
      );
    case 20:
      return (
        <div className={className} style={style}>
          <Icon
            style={{
              display: "block",
              width: "40%",
              height: "auto",
            }}
            iconPath={icons.Icon0?.IconPath}
          />
          <Icon
            style={{
              display: "block",
              width: "40%",
              height: "auto",
            }}
            iconPath={icons.Icon1?.IconPath}
          />
        </div>
      );
    case 21:
      style.position = "relative";
      return (
        <div className={className} style={style}>
          <Icon
            style={{
              position: "relative",
              display: "block",
              width: "60%",
              height: "auto",
            }}
            iconPath={icons.Icon0?.IconPath}
          />
          <Icon
            style={{
              position: "absolute",
              right: "20%",
              bottom: "10%",
              display: "block",
              width: "25%",
              height: "auto",
            }}
            iconPath={icons.Icon1?.IconPath}
          />
        </div>
      );
    case 22:
      style.position = "relative";
      return (
        <div className={className} style={style}>
          <Icon
            style={{
              position: "relative",
              display: "block",
              width: "60%",
              height: "auto",
            }}
            iconPath={icons.Icon0?.IconPath}
          />
          <Icon
            style={{
              position: "absolute",
              right: "20%",
              top: "10%",
              display: "block",
              width: "25%",
              height: "auto",
            }}
            iconPath={icons.Icon1?.IconPath}
          />
        </div>
      );
    case 23:
      style.position = "relative";
      return (
        <div className={className} style={style}>
          <Icon
            style={{
              position: "relative",
              display: "block",
              width: "60%",
              height: "auto",
            }}
            iconPath={icons.Icon0?.IconPath}
          />
          <Icon
            style={{
              position: "absolute",
              left: "20%",
              top: "10%",
              display: "block",
              width: "25%",
              height: "auto",
            }}
            iconPath={icons.Icon1?.IconPath}
          />
        </div>
      );
    case 24:
      style.position = "relative";
      return (
        <div className={className} style={style}>
          <Icon
            style={{
              position: "relative",
              display: "block",
              width: "60%",
              height: "auto",
            }}
            iconPath={icons.Icon0?.IconPath}
          />
          <Icon
            style={{
              position: "absolute",
              left: "20%",
              bottom: "10%",
              display: "block",
              width: "25%",
              height: "auto",
            }}
            iconPath={icons.Icon1?.IconPath}
          />
        </div>
      );
    case 30:
      return (
        <div className={className} style={style}>
          <div className="flex flex-row w-full justify-center">
            <Icon
              style={{
                display: "block",
                width: "35%",
                height: "auto",
              }}
              iconPath={icons.Icon0?.IconPath}
            />
          </div>
          <Icon
            style={{
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon1?.IconPath}
          />
          <Icon
            style={{
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon2?.IconPath}
          />
        </div>
      );
    case 31:
      return (
        <div className={className} style={style}>
          <Icon
            style={{
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon1?.IconPath}
          />
          <Icon
            style={{
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon2?.IconPath}
          />
          <Icon
            style={{
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon0?.IconPath}
          />
        </div>
      );
    case 32:
      style.position = "relative";
      return (
        <div className={className} style={style}>
          <Icon
            style={{
              display: "block",
              width: "60%",
              height: "auto",
            }}
            iconPath={icons.Icon0?.IconPath}
          />
          <Icon
            style={{
              position: "absolute",
              left: "20%",
              top: "10%",
              display: "block",
              width: "25%",
              height: "auto",
            }}
            iconPath={icons.Icon1?.IconPath}
          />
          <Icon
            style={{
              position: "absolute",
              right: "20%",
              bottom: "10%",
              display: "block",
              width: "25%",
              height: "auto",
            }}
            iconPath={icons.Icon2?.IconPath}
          />
        </div>
      );
    case 33:
      style.position = "relative";
      return (
        <div className={className} style={style}>
          <Icon
            style={{
              display: "block",
              width: "60%",
              height: "auto",
            }}
            iconPath={icons.Icon0?.IconPath}
          />
          <Icon
            style={{
              position: "absolute",
              left: "20%",
              top: "10%",
              display: "block",
              width: "25%",
              height: "auto",
            }}
            iconPath={icons.Icon1?.IconPath}
          />
          <Icon
            style={{
              position: "absolute",
              right: "20%",
              bottom: "10%",
              display: "block",
              width: "25%",
              height: "auto",
            }}
            iconPath={icons.Icon2?.IconPath}
          />
        </div>
      );
    case 40:
      return (
        <div className={className} style={style}>
          <Icon
            style={{
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon0?.IconPath}
          />
          <Icon
            style={{
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon1?.IconPath}
          />
          <Icon
            style={{
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon2?.IconPath}
          />
          <Icon
            style={{
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon3?.IconPath}
          />
        </div>
      );
    case 41:
      style.position = "relative";
      return (
        <div className={className} style={style}>
          <Icon
            style={{
              position: "relative",
              top: "25%",
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon0?.IconPath}
          />
          <Icon
            style={{
              position: "relative",
              top: "25%",
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon1?.IconPath}
          />
          <Icon
            style={{
              position: "relative",
              bottom: "53%",
              left: "16%",
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon2?.IconPath}
          />
          <Icon
            style={{
              position: "relative",
              right: "16%",
              bottom: "-3%",
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon3?.IconPath}
          />
        </div>
      );
    case 50:
      style.position = "relative";
      return (
        <div className={className} style={style}>
          <Icon
            style={{
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon0?.IconPath}
          />
          <Icon
            style={{
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon1?.IconPath}
          />
          <Icon
            style={{
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon2?.IconPath}
          />
          <Icon
            style={{
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon3?.IconPath}
          />
          <Icon
            style={{
              position: "absolute",
              top: "25%",
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon4?.IconPath}
          />
        </div>
      );
    case 51:
      style.position = "relative";
      return (
        <div className={className} style={style}>
          <Icon
            style={{
              position: "relative",
              left: "4%",
              top: "50%",
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon0?.IconPath}
          />
          <Icon
            style={{
              right: "4%",
              top: "50%",
              position: "relative",
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon1?.IconPath}
          />
          <Icon
            style={{
              position: "relative",
              bottom: "30%",
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon2?.IconPath}
          />
          <Icon
            style={{
              position: "absolute",
              top: "0%",
              display: "block",
              width: "35%",
              height: "auto",
            }}
            lazy={false}
            iconPath={icons.Icon4?.IconPath}
          />
          <Icon
            style={{
              position: "relative",
              bottom: "30%",
              display: "block",
              width: "35%",
              height: "auto",
            }}
            iconPath={icons.Icon3?.IconPath}
          />
        </div>
      );
  }
  return (
    <LazyLoadImage
      style={{
        height: "200px",
        borderRadius: 0,
        objectFit: "contain",
      }}
      height={"200px"}
      width={"100%"}
      src={
        "https://media.st.dl.eccdnx.com/steam/apps/1366540/header_schinese.jpg?t=1702624498"
      }
    />
  );
};

export const DSPProduct: React.FC<{
  style: CSSProperties;
  className?: string;
  item?: {
    item_id: number;
    name?: string;
    icon_path?: string;
    count: number;
  }[];
}> = ({ style, item, className }) => {
  let tmpClassName = "flex flex-row justify-center items-center";
  tmpClassName += className ? " " + className : "";
  style.background = "#246cb9";
  style.display = "flex";
  style.flexWrap = "wrap";
  style.justifyItems = "center";
  style.alignItems = "center";
  style.justifyContent = "center";

  switch (item?.length) {
    case 1:
      return (
        <div className={tmpClassName} style={style}>
          <div
            className="flex flex-col items-center gap-2"
            style={{
              display: "block",
              width: "50%",
              height: "auto",
            }}
          >
            <LazyLoadImage
              style={{
                width: "100%",
                height: "auto",
              }}
              src={"/images/" + item[0].icon_path + ".png"}
            />
            <Typography.Title className="text-center" level={4}>
              {formatNumber(item[0].count)}/min
            </Typography.Title>
          </div>
        </div>
      );
    case 2:
      return (
        <div style={style}>
          <div
            className="flex flex-col items-center gap-2"
            style={{
              width: "33%",
              height: "auto",
            }}
          >
            <LazyLoadImage
              style={{
                width: "100%",
                height: "auto",
              }}
              src={"/images/" + item[0].icon_path + ".png"}
            />
            <Typography.Title className="text-center" level={4}>
              {formatNumber(item[0].count)}/min
            </Typography.Title>
          </div>
          <div
            className="flex flex-col items-center gap-2"
            style={{
              width: "33%",
              height: "auto",
            }}
          >
            <LazyLoadImage
              style={{
                width: "100%",
                height: "auto",
              }}
              src={"/images/" + item[1].icon_path + ".png"}
            />
            <Typography.Title className="text-center" level={4}>
              {formatNumber(item[1].count)}/min
            </Typography.Title>
          </div>
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
            <div
              className="flex flex-col items-center"
              style={{
                width: "25%",
                height: "auto",
              }}
            >
              <LazyLoadImage src={"/images/" + item[0].icon_path + ".png"} />
              <Typography.Title
                className="text-center"
                level={5}
                style={{ margin: 0 }}
              >
                {formatNumber(item[0].count)}/min
              </Typography.Title>
            </div>
          </div>
          <div style={style2}>
            <div
              className="flex flex-col items-center"
              style={{
                width: "25%",
                height: "auto",
              }}
            >
              <LazyLoadImage src={"/images/" + item[1].icon_path + ".png"} />
              <Typography.Title
                className="text-center"
                level={5}
                style={{ margin: 0 }}
              >
                {formatNumber(item[1].count)}/min
              </Typography.Title>
            </div>
            <div
              className="flex flex-col items-center"
              style={{
                width: "25%",
                height: "auto",
              }}
            >
              <LazyLoadImage src={"/images/" + item[2].icon_path + ".png"} />
              <Typography.Title
                className="text-center"
                level={5}
                style={{ margin: 0 }}
              >
                {formatNumber(item[2].count)}/min
              </Typography.Title>
            </div>
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
            <div
              className="flex flex-col items-center"
              style={{
                width: "25%",
                height: "auto",
              }}
            >
              <LazyLoadImage src={"/images/" + item[0].icon_path + ".png"} />
              <Typography.Title
                className="text-center"
                level={5}
                style={{ margin: 0 }}
              >
                {formatNumber(item[0].count)}/min
              </Typography.Title>
            </div>
            <div
              className="flex flex-col items-center"
              style={{
                width: "25%",
                height: "auto",
              }}
            >
              <LazyLoadImage src={"/images/" + item[1].icon_path + ".png"} />
              <Typography.Title
                className="text-center"
                level={5}
                style={{ margin: 0 }}
              >
                {formatNumber(item[1].count)}/min
              </Typography.Title>
            </div>
          </div>
          <div style={style2}>
            <div
              className="flex flex-col items-center"
              style={{
                width: "25%",
                height: "auto",
              }}
            >
              <LazyLoadImage src={"/images/" + item[2].icon_path + ".png"} />
              <Typography.Title
                className="text-center"
                level={5}
                style={{ margin: 0 }}
              >
                {formatNumber(item[2].count)}/min
              </Typography.Title>
            </div>
            <div
              className="flex flex-col items-center"
              style={{
                width: "25%",
                height: "auto",
              }}
            >
              <LazyLoadImage src={"/images/" + item[3].icon_path + ".png"} />
              <Typography.Title
                className="text-center"
                level={5}
                style={{ margin: 0 }}
              >
                {formatNumber(item[3].count)}/min
              </Typography.Title>
            </div>
          </div>
        </div>
      );
    }
  }

  return <></>;
};

const DSPCover: React.FC<{
  style: CSSProperties;
  className?: string;
  tags?: { item_id: number; name?: string; icon_path?: string }[];
  icons?: string | null;
  layout?: "tag" | "icon";
}> = ({ style, tags, icons, className }) => {
  let tmpClassName = "flex flex-row justify-center items-center";
  tmpClassName += className ? " " + className : "";
  style.background = "#246cb9";
  style.display = "flex";
  style.flexWrap = "wrap";
  style.justifyItems = "center";
  style.alignItems = "center";
  style.justifyContent = "center";
  if (icons) {
    try {
      const data = JSON.parse(icons) as Icons;
      if (data.Layout) {
        return <GameIcon className={className} style={style} icons={data} />;
      }
    } catch (e) {
      console.error(e);
    }
  }
  switch (tags?.length) {
    case 1:
      return (
        <div className={tmpClassName} style={style}>
          <LazyLoadImage
            style={{
              display: "block",
              width: "50%",
              height: "auto",
            }}
            src={"/images/" + tags[0].icon_path + ".png"}
          />
        </div>
      );
    case 2:
      return (
        <div style={style}>
          <LazyLoadImage
            style={{
              display: "block",
              width: "33%",
              height: "auto",
            }}
            src={"/images/" + tags[0].icon_path + ".png"}
          />
          <LazyLoadImage
            style={{
              display: "block",
              width: "33%",
              height: "auto",
            }}
            src={"/images/" + tags[1].icon_path + ".png"}
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
            <LazyLoadImage
              style={{
                display: "block",
                width: "33%",
                height: "auto",
              }}
              src={"/images/" + tags[0].icon_path + ".png"}
            />
          </div>
          <div style={style2}>
            <LazyLoadImage
              style={{
                display: "block",
                width: "33%",
                height: "auto",
              }}
              src={"/images/" + tags[1].icon_path + ".png"}
            />
            <LazyLoadImage
              style={{
                display: "block",
                width: "33%",
                height: "auto",
              }}
              src={"/images/" + tags[2].icon_path + ".png"}
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
              src={"/images/" + tags[0].icon_path + ".png"}
            />
            <Avatar
              style={{
                display: "block",
                width: "33%",
                height: "auto",
              }}
              shape="square"
              src={"/images/" + tags[1].icon_path + ".png"}
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
              src={"/images/" + tags[2].icon_path + ".png"}
            />
            <Avatar
              style={{
                display: "block",
                width: "33%",
                height: "auto",
              }}
              shape="square"
              src={"/images/" + tags[3].icon_path + ".png"}
            />
          </div>
        </div>
      );
    }
  }
  return (
    <LazyLoadImage
      style={{
        height: "200px",
        borderRadius: 0,
        objectFit: "contain",
      }}
      height={"200px"}
      width={"100%"}
      src={
        "https://media.st.dl.eccdnx.com/steam/apps/1366540/header_schinese.jpg?t=1702624498"
      }
    />
  );
};

export default DSPCover;
