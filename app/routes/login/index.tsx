import { Card } from "@douyinfe/semi-ui";
import { PrismaClient } from "@prisma/client";
import { json } from "@remix-run/node";
const prisma = new PrismaClient();

export const loader = async () => {
  return json({});
};

export default function Index() {
  return <Card>login</Card>;
}
