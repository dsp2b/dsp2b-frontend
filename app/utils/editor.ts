// 蓝图 3D 预览编辑器地址（唯一定义处）
export const EDITOR_URL = "https://dsp2b.github.io/dsp_blueprint_editor/";

export const buildEditorUrl = (id: string) =>
  EDITOR_URL + "?id=" + encodeURIComponent(id);
