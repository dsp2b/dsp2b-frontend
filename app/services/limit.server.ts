import prisma from "~/db.server";
import { errBadRequest } from "~/utils/errcode";

export class LimitSvc {
  static async limit<T>(
    request: Request,
    user: string,
    action: string,
    param: string,
    time: Date,
    limitCount: number,
    fn: () => Promise<T>
  ): Promise<[T | undefined, boolean]> {
    // 如果近5分钟内上传图片次数超过20次
    const count = await prisma.limit_record.count({
      where: {
        user_id: user,
        action: action,
        createtime: {
          gte: time,
        },
      },
    });
    if (count > 20) {
      return [undefined, true];
    }
    const result = await fn();
    await prisma.limit_record.create({
      data: {
        user_id: user,
        action: action,
        param: param,
        createtime: new Date(),
      },
    });
    return [result, false];
  }
}
