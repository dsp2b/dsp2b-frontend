// app/services/auth.server.ts
import { Prisma } from "@prisma/client";
import { Authenticator } from "remix-auth";
import User from "~/models/user";
import { sessionStorage } from "./session.server";

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export let authenticator = new Authenticator<User>(sessionStorage);
