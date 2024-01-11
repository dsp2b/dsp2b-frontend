import { Card } from "@douyinfe/semi-ui";
import InfoHeader from "../InfoHeader";

const BlueprintList: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex flex-col flex-wrap gap-4"
        style={
          {
            //   border: "1px solid var(--semi-color-border)",
          }
        }
      >
        <InfoHeader />
        <InfoHeader />
        <InfoHeader />
        <InfoHeader />
      </div>
    </div>
  );
};

export default BlueprintList;
