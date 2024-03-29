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
  LimitTooMany,
  RequestRegisterEmailAlreadyRegister,
  UserNotLogin,
  BindDiscord,
  BindQQ,
}


export enum ErrBuleprint {
  FilenameInvalid = 2001,
  TitleInvalid,
  DescriptionInvalid,
  BlueprintInvalid,
  PicListInvalid,
  NotFound,
  CollectionInvalid,
  CollectionCountLimit
}

export enum ErrCollection {
  TitleInvalid = 3001,
  DescriptionInvalid,
  ParentInvalid,
  HasCycle,
  TitleDuplicate,
  NotFound,
}
