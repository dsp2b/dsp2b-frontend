import prisma from "~/db.server";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import i18next from "~/i18next.server";
import { success } from "~/utils/httputils";
import { errBadRequest } from "~/utils/errcode";
import { ErrUser } from "~/code/user";
import { user } from "@prisma/client";
import validator from "validator";

export interface UserAuth {
  id: string;
  username: string;
}
const allowEmailSuffix = ["qq.com", "gmail.com", "outlook.com", "163.com"];

export class UserSvc {
  static hashPassword(password: string) {
    return bcrypt.hashSync(password, 10);
  }
  static isUsernameValid(username: string) {
    return validator.isByteLength(username, { min: 4, max: 20 });
  }
  static isStrongPassword(password: string) {
    return validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 0,
      minUppercase: 0,
      returnScore: false,
    });
  }
  static checkPassword(user: user, password: string) {
    return bcrypt.compareSync(password, user.password);
  }

  static async requestRegisterEmail(req: Request, email: string) {
    // 邮箱必须以常用邮箱结尾
    let flag = false;
    for (const suffix of allowEmailSuffix) {
      if (email.endsWith(suffix)) {
        flag = true;
        break;
      }
    }
    if (!flag) {
      return errBadRequest(req, ErrUser.RequestRegisterEmailSuffixNotAllow);
    }
    // 检查邮箱是否已经注册
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (user) {
      return errBadRequest(req, ErrUser.RequestRegisterEmailAlreadyRegister);
    }
    // 查询是否在60秒内请求过验证码
    const record = await prisma.email_verify_code.findUnique({
      where: {
        email,
      },
    });
    // 生成验证码 6位数字
    const code = Math.floor(Math.random() * 899999 + 100000).toString();
    if (record) {
      if (record.createtime.getTime() > Date.now() - 60 * 1000) {
        return errBadRequest(req, ErrUser.RequestRegisterEmailTooOften);
      }
      await prisma.email_verify_code.update({
        where: {
          email,
        },
        data: {
          code,
          createtime: new Date(),
        },
      });
    } else {
      await prisma.email_verify_code.create({
        data: {
          email,
          code,
        },
      });
    }
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        // replace `user` and `pass` values from <https://forwardemail.net>
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const t = await i18next.getFixedT(req);

    const info = await transporter.sendMail({
      from: '"DSP2B" <' + process.env.EMAIL_USER + ">", // sender address
      to: email, // list of receivers
      subject: t("request_register_email_title"), // Subject line
      text: t("request_register_email_content", {
        code: code,
      }),
    });

    return success({});
  }
}
