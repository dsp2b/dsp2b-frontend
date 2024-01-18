import { RiDiscordLine } from "@remixicon/react";
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  Space,
  Typography,
  Upload,
} from "antd";
import { useTranslation } from "react-i18next";
import Icon from "@ant-design/icons";

export default function Edit() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  return (
    <Card>
      <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 14 }}>
        <Upload />
        <Form.Item label="用户名">
          <Input disabled />
        </Form.Item>
        <Form.Item label="自我介绍">
          <Input.TextArea maxLength={200} showCount />
        </Form.Item>
        <Form.Item label="老密码">
          <Input.Password />
        </Form.Item>
        <Form.Item label="新密码">
          <Input.Password />
        </Form.Item>
        <Form.Item label="确认密码">
          <Input.Password />
        </Form.Item>
        <Form.Item label={t("oauth_login")}>
          <div className="flex flex-row justify-center gap-3 w-full">
            <Button href="/login/oauth?type=discord" disabled>
              <Space>
                <RiDiscordLine
                  style={{
                    color: "#5a64ea",
                  }}
                />
                <Typography.Text>未绑定</Typography.Text>
              </Space>
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Card>
  );
}
