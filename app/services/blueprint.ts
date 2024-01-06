import { APIDataResponse } from "./api";

export type ParseBlueprintResponse = APIDataResponse<{
  blueprint: {
    ShortDesc: string;
    Desc: string;
  };
  buildings: Buildings[];
  products: Products[];
}>;

export interface Buildings {
  item_id: number;
  name: string;
  icon_path: string;
  count: number;
}

export interface Products {
  item_id: number;
  name: string;
  icon_path: string;
  count: number;
}

export type GetRecipePanelResponse = APIDataResponse<{
  thing_panel: RecipePanelItem[][];
  building_panel: RecipePanelItem[][];
}>;

export interface RecipePanelItem {
  id: number;
  name: string;
  icon_path: string;
}
