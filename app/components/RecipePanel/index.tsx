import { useFetcher } from "@remix-run/react";
import { Avatar, Button, Popover } from "antd";
import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "remix-i18next";
import {
  GetRecipePanel,
  GetRecipePanelResponse,
  RecipePanelItem,
} from "~/services/blueprint.server";
import { useRequest } from "~/utils/api";

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
              {val.item_id ? (
                <Avatar
                  shape="square"
                  src={"/images/" + val.icon_path + ".png"}
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
  defaultPanel,
}: {
  children?: ReactNode;
  onClickOutSide: () => void;
  onSelect: (item: RecipePanelItem) => void;
  visible: boolean;
  defaultPanel?: "thing" | "building";
}) {
  const request = useRequest<GetRecipePanel>("create.blueprint.$(id)");
  const [firstVisible, setFirstVisible] = useState(false);
  const [showThingPanel, setShowThingPanel] = useState(
    defaultPanel != "building"
  );
  const { t } = useTranslation();
  useEffect(() => {
    if (visible) {
      setFirstVisible(true);
    }
  }, [visible]);
  useEffect(() => {
    if (firstVisible && !request.data && !request.loading) {
      request
        .submit({
          params: {
            id: "",
          },
          search: "action=recipe_panel",
          method: "POST",
        })
        .success((data) => {
          request.setData(data);
        });
    }
  }, [firstVisible]);

  return (
    <Popover
      open={visible}
      trigger="click"
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
            panel={request.data?.thing_panel || []}
            onClick={(val) => {
              onSelect(val);
            }}
          />
          <Panel
            style={{
              display: showThingPanel ? "none" : "flex",
            }}
            panel={request.data?.building_panel || []}
            onClick={(val) => {
              onSelect(val);
            }}
          />
        </div>
      }
      onOpenChange={(open) => {
        if (!open) {
          onClickOutSide();
        }
      }}
    >
      {children}
    </Popover>
  );
}
