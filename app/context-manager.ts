import { createContext } from "react";
import { UserAuth } from "./services/user.server.ts";

export type UserContextData = {
  user?: UserAuth;
  darkMode?: "light" | "dark";
  styleMode?: "light" | "dark" | "auto";
  locale?: string;
};

export const UserContext = createContext<UserContextData>({});
