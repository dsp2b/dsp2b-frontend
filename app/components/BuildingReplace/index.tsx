import { Avatar, Badge, Button, Modal, Typography, message } from "antd";
import { useEffect, useState } from "react";
import RecipePanel from "../RecipePanel";
import {
  CloseCircleFilled,
  PlusOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { IconInfo, RecipePanelItem } from "~/services/blueprint.server";
import { useTranslation } from "react-i18next";
import { useRequest } from "~/utils/api";
import copy from "copy-to-clipboard";

const BuildingReplace: React.FC<{
  open: boolean;
  blueprintId: string;
  onClose: () => void;
}> = ({ open, onClose, blueprintId }) => {
  const { t } = useTranslation();
  const [building, setBuilding] = useState<
    Array<{
      source: RecipePanelItem;
      target?: RecipePanelItem;
    }>
  >([]);
  const [recipe, setRecipe] = useState<
    Array<{
      source: RecipePanelItem;
      target?: RecipePanelItem;
    }>
  >([]);
  const [buildingVisible, setBuildingVisible] = useState<boolean>(false);
  const [index, setIndex] = useState<number>(0);
  const [isTarget, setIsTarget] = useState(true);
  const [recipeVisible, setRecipeVisible] = useState<boolean>(false);
  const request = useRequest<{
    blueprint: string;
  }>("blueprint.$id");
  useEffect(() => {
    if (localStorage["replace_building"]) {
      setBuilding(JSON.parse(localStorage["replace_building"]));
    }
    if (localStorage["replace_recipe"]) {
      setRecipe(JSON.parse(localStorage["replace_recipe"]));
    }
  }, []);

  const openPanel = (
    type: "building" | "recipe",
    index: number,
    isTarget: boolean
  ) => {
    setIndex(index);
    setIsTarget(isTarget);
    if (type == "building") {
      setBuildingVisible(true);
    } else {
      setRecipeVisible(true);
    }
  };

  return (
    <Modal
      title={t("building_repice_replace")}
      open={open}
      confirmLoading={request.loading}
      onOk={() => {
        localStorage["replace_building"] = JSON.stringify(building);
        localStorage["replace_recipe"] = JSON.stringify(recipe);
        request
          .submit({
            method: "POST",
            params: {
              id: blueprintId,
            },
            body: {
              action: "replace",
              building,
              recipe,
            },
          })
          .success((data) => {
            message.success(t("copy_replace_blueprint_success"));
            copy(data.blueprint);
          });
      }}
      onCancel={onClose}
      okText={t("replace_copy")}
      cancelText={t("close")}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <Typography.Text>
            {t("building_can_only_be_upgraded")}
          </Typography.Text>
          <div className="flex flex-row gap-4 items-center">
            {building.map((item, index) => {
              return (
                <Badge
                  count={
                    <CloseCircleFilled
                      onClick={() => {
                        console.log("building", building);
                        setBuilding((building) =>
                          building.filter((_, i) => i != index)
                        );
                      }}
                    />
                  }
                >
                  <Button
                    type="text"
                    size="large"
                    onClick={() => {
                      openPanel("building", index, false);
                    }}
                    icon={
                      <Avatar
                        shape="square"
                        src={"/images/" + item.source.icon_path + ".png"}
                      />
                    }
                  ></Button>
                  <RightOutlined />
                  {item.target ? (
                    <Button
                      type="text"
                      size="large"
                      onClick={() => {
                        openPanel("building", index, true);
                      }}
                      icon={
                        <Avatar
                          shape="square"
                          src={"/images/" + item.target.icon_path + ".png"}
                        />
                      }
                    ></Button>
                  ) : (
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => {
                        openPanel("building", index, true);
                      }}
                    />
                  )}
                </Badge>
              );
            })}
            <RecipePanel
              visible={buildingVisible}
              defaultPanel="building"
              onSelect={(item) => {
                if (!item.upgrades) {
                  message.error(t("building_not_allow_upgrade"));
                  return;
                }
                if (index != -1) {
                  setBuilding((val) => {
                    if (isTarget) {
                      if (
                        val[index].source.upgrades!.indexOf(item.item_id) == -1
                      ) {
                        message.error(t("building_not_in_upgrade"));
                        return val;
                      }
                      val[index].target = item;
                    } else {
                      val[index].source = item;
                    }
                    return val;
                  });
                } else {
                  setBuilding([
                    ...building,
                    {
                      source: item,
                    },
                  ]);
                }
                setBuildingVisible(false);
              }}
              onClickOutSide={() => {
                setBuildingVisible(false);
              }}
            >
              <Button
                icon={<PlusOutlined />}
                onClick={() => {
                  setIndex(-1);
                  setBuildingVisible(true);
                }}
              />
            </RecipePanel>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Typography.Text>{t("repice")}</Typography.Text>
          <div className="flex flex-row gap-4 items-center">
            {recipe.map((item, index) => {
              return (
                <Badge
                  count={
                    <CloseCircleFilled
                      onClick={() => {
                        setRecipe((recipe) =>
                          recipe.filter((_, i) => i != index)
                        );
                      }}
                    />
                  }
                >
                  <Button
                    type="text"
                    size="large"
                    onClick={() => {
                      openPanel("recipe", index, false);
                    }}
                    icon={
                      <Avatar
                        shape="square"
                        src={"/images/" + item.source.icon_path + ".png"}
                      />
                    }
                  ></Button>
                  <RightOutlined />
                  {item.target ? (
                    <Button
                      type="text"
                      size="large"
                      onClick={() => {
                        openPanel("recipe", index, true);
                      }}
                      icon={
                        <Avatar
                          shape="square"
                          src={"/images/" + item.target.icon_path + ".png"}
                        />
                      }
                    ></Button>
                  ) : (
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => {
                        openPanel("recipe", index, true);
                      }}
                    />
                  )}
                </Badge>
              );
            })}
            <RecipePanel
              visible={recipeVisible}
              onSelect={(item) => {
                if (index != -1) {
                  setRecipe((val) => {
                    if (isTarget) {
                      val[index].target = item;
                    } else {
                      val[index].source = item;
                    }
                    return val;
                  });
                } else {
                  setRecipe([
                    ...recipe,
                    {
                      source: item,
                    },
                  ]);
                }
                setRecipeVisible(false);
              }}
              onClickOutSide={() => {
                setRecipeVisible(false);
              }}
            >
              <Button
                icon={<PlusOutlined />}
                onClick={() => {
                  setIndex(-1);
                  setRecipeVisible(true);
                }}
              />
            </RecipePanel>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BuildingReplace;
