export enum ErrUser {
  UsernameIsRequire = 1001,
  UserNotExist,
  PasswordIsWrong,
  RequestRegisterEmailTooOften,
  RequestRegisterEmailSuffixNotAllow,
  PasswordNotMatch,
  PasswordTooSimple,
  EmailInvalid,
  UsernameInvalid,
  UsernameExist,
  UploadTooMany,
}

export enum ErrBuleprint {
  FilenameInvalid = 2001,
}
