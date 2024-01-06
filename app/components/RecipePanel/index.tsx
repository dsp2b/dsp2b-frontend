import { Avatar, Button, Popover } from "@douyinfe/semi-ui";
import { useFetcher } from "@remix-run/react";
import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GetRecipePanelResponse, RecipePanelItem } from "~/services/blueprint";

const Panel: React.FC<{
  panel: RecipePanelItem[][];
  style?: React.CSSProperties;
  onClick: (item: RecipePanelItem) => void;
}> = ({ panel, style, onClick }) => {
  return (
    <div
      style={style}
      className="flex flex-row flex-wrap border-2 border-gray-500"
    >
      {panel.map((val, index) => {
        if (index == 0) {
          return <></>;
        }
        return val.map((val) => {
          return (
            <div
              className="bg-gray-400 dark:bg-gray-600 border-2 border-gray-500"
              style={{
                height: 44,
                width: 44,
              }}
            >
              {val.id ? (
                <Avatar
                  shape="square"
                  src={"/images/icons/item_recipe/" + val.icon_path + ".png"}
                  style={{
                    height: 40,
                    width: 40,
                  }}
                  alt={val.name}
                  onClick={() => {
                    onClick(val);
                  }}
                >
                  {val.name}
                </Avatar>
              ) : (
                <></>
              )}
            </div>
          );
        });
      })}
    </div>
  );
};

export default function RecipePanel({
  children,
  onClickOutSide,
  onSelect,
  visible,
}: {
  children: ReactNode;
  onClickOutSide: () => void;
  onSelect: (item: RecipePanelItem) => void;
  visible: boolean;
}) {
  const fetcher = useFetcher<GetRecipePanelResponse>({ key: "panel" });
  const [thingPanel, setThingPanel] = useState<RecipePanelItem[][]>([]);
  const [firstVisible, setFirstVisible] = useState(false);
  const [showThingPanel, setShowThingPanel] = useState(true);
  const [buildingPanel, setBuildingPanel] = useState<RecipePanelItem[][]>([]);
  const { t } = useTranslation();
  useEffect(() => {
    console.log(fetcher);
    if (fetcher.state == "idle" && firstVisible) {
      fetcher.submit(
        {
          blueprint: "",
        },
        { action: "/publish?action=recipe_panel", method: "POST" }
      );
    }
  }, [firstVisible]);
  useEffect(() => {
    if (fetcher.data) {
      setThingPanel(fetcher.data.data.thing_panel);
      setBuildingPanel(fetcher.data.data.building_panel);
    }
  }, [fetcher]);

  return (
    <Popover
      position="topLeft"
      visible={visible}
      keepDOM
      trigger="click"
      onClickOutSide={onClickOutSide}
      content={
        <div
          className="flex flex-col p-4 bg-gray-600 dark:bg-gray-800 gap-2"
          style={{
            width: 652,
          }}
        >
          <div className="flex flex-row gap-6">
            <Button
              onClick={() => {
                setShowThingPanel(true);
              }}
            >
              {t("things")}
            </Button>
            <Button
              onClick={() => {
                setShowThingPanel(false);
              }}
            >
              {t("buildings")}
            </Button>
          </div>
          <Panel
            style={{
              display: showThingPanel ? "flex" : "none",
            }}
            panel={thingPanel}
            onClick={(val) => {
              onSelect(val);
            }}
          />
          <Panel
            style={{
              display: showThingPanel ? "none" : "flex",
            }}
            panel={buildingPanel}
            onClick={(val) => {
              onSelect(val);
            }}
          />
        </div>
      }
      onVisibleChange={() => {
        setFirstVisible(true);
      }}
    >
      {children}
    </Popover>
  );
}
