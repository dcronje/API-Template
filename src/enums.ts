export enum ApiScalarDataTypeEnum {  
  /** Boolean */
  Boolean = 'BOOLEAN',
  /** Color */
  Color = 'COLOR',
  /** Date */
  Date = 'DATE',
  /** Date Time */
  DateTime = 'DATE_TIME',
  /** Double */
  Double = 'DOUBLE',
  /** Email */
  Email = 'EMAIL',
  /** Float */
  Float = 'FLOAT',
  /** Hyper Text */
  Hypertext = 'HYPERTEXT',
  /** Integer */
  Int = 'INT',
  /** Month */
  Month = 'MONTH',
  /** Phone */
  Phone = 'PHONE',
  /** String */
  String = 'STRING',
  /** Text */
  Text = 'TEXT',
  /** Time */
  Time = 'TIME',
  /** Link */
  Uri = 'URI',
  /** Week */
  Week = 'WEEK',
  /** Year */
  Year = 'YEAR'
  
}

export enum CacheControlScope {  
  Private = 'PRIVATE',
  Public = 'PUBLIC'
  
}

export enum ChronologicalPeriodTypeEnum {  
  /** Daily */
  Daily = 'DAILY',
  /** Monthly */
  Monthly = 'MONTHLY',
  /** Weekly */
  Weekly = 'WEEKLY',
  /** Yearly */
  Yearly = 'YEARLY'
  
}

export enum ChronologicalUnitTypeEnum {  
  /** Day(s) */
  Day = 'DAY',
  /** Hour(s) */
  Hour = 'HOUR',
  /** Minute(s) */
  Minute = 'MINUTE',
  /** Month(s) */
  Month = 'MONTH',
  /** Week(s) */
  Week = 'WEEK',
  /** Year(s) */
  Year = 'YEAR'
  
}

export enum FileCategoryOrderEnum {  
  /** Created At */
  CreatedAt = 'CREATED_AT',
  /** Name */
  Name = 'NAME',
  /** Updated At */
  UpdatedAt = 'UPDATED_AT'
  
}

export enum FileOrderEnum {  
  /** Created At */
  CreatedAt = 'CREATED_AT',
  /** Name */
  Name = 'NAME',
  /** Updated At */
  UpdatedAt = 'UPDATED_AT'
  
}

export enum ImageEncodingEnum {  
  /** JPEG */
  Jpeg = 'JPEG',
  /** PNG */
  Png = 'PNG',
  /** SVG */
  Svg = 'SVG',
  /** WebP */
  Webp = 'WEBP'
  
}

export enum ImageOrderEnum {  
  /** Created At */
  CreatedAt = 'CREATED_AT',
  /** Name */
  Name = 'NAME',
  /** Updated At */
  UpdatedAt = 'UPDATED_AT'
  
}

export enum ImageScaleEnum {  
  /** Scale to Contain */
  Contain = 'CONTAIN',
  /** Scale to Cover */
  Cover = 'COVER',
  /** Scale to Fit */
  Fit = 'FIT'
  
}

export enum ImageTransformTypeEnum {  
  /** Blur */
  Blur = 'BLUR',
  /** CMYK Color Space */
  Cmyk = 'CMYK',
  /** Gaussian Blur */
  GaussianBlur = 'GAUSSIAN_BLUR',
  /** Grey Scale */
  GreyScale = 'GREY_SCALE',
  /** Opacity */
  Opacity = 'OPACITY',
  /** Pixelate */
  Pixelate = 'PIXELATE',
  /** Posterize */
  Posterize = 'POSTERIZE',
  /** Sepia */
  Sepia = 'SEPIA'
  
}

export enum MonthWeekEnum {  
  /** 1st */
  First = 'FIRST',
  /** 4th */
  Fourth = 'FOURTH',
  /** 2nd */
  Second = 'SECOND',
  /** 3rd */
  Third = 'THIRD'
  
}

export enum OrderDirectionEnum {  
  /** Order Ascending */
  Asc = 'ASC',
  /** Order Descending */
  Desc = 'DESC'
  
}

export enum PermissionOrderEnum {  
  Module = 'MODULE',
  /** Name */
  Name = 'NAME',
  ObjectType = 'OBJECT_TYPE',
  Type = 'TYPE'
  
}

export enum PermissionTypeEnum {  
  /** Dynamic Permission (Specified in Schema) */
  DynamicPermission = 'DYNAMIC_PERMISSION',
  /** Static Permission (Specified in Code) */
  StaticPermission = 'STATIC_PERMISSION'
  
}

export enum RegisteredDeviceTypeEnum {  
  /** Android */
  Android = 'ANDROID',
  /** Browser */
  Browser = 'BROWSER',
  /** iOS */
  Ios = 'IOS'
  
}

export enum RoleOrderEnum {  
  /** Created At */
  CreatedAt = 'CREATED_AT',
  /** Name */
  Name = 'NAME',
  /** Updated At */
  UpdatedAt = 'UPDATED_AT'
  
}

export enum TitleEnum {  
  /** Mr */
  Mr = 'MR',
  /** Mrs */
  Mrs = 'MRS',
  /** Ms */
  Ms = 'MS'
  
}

export enum UnitTypeEnum {  
  /** Drained Gram */
  Dg = 'DG',
  /** Gram */
  G = 'G',
  /** Kilogram */
  Kg = 'KG',
  /** Litre */
  L = 'L',
  /** Milligram */
  Mg = 'MG',
  /** Milliliter */
  Ml = 'ML',
  /** Piece */
  Piece = 'PIECE',
  /** Pinch */
  Pinch = 'PINCH',
  /** Portion */
  Portion = 'PORTION',
  /** Table Spoon */
  Tbsp = 'TBSP',
  /** Tea Spoon */
  Tsp = 'TSP',
  /** Unit */
  Unit = 'UNIT'
  
}

export enum UserOrderEnum {  
  /** Created At */
  CreatedAt = 'CREATED_AT',
  Email = 'EMAIL',
  /** First Name */
  FirstName = 'FIRST_NAME',
  /** Last Name */
  LastName = 'LAST_NAME',
  /** Name */
  Name = 'NAME',
  /** Updated At */
  UpdatedAt = 'UPDATED_AT'
  
}

export enum UserRoleOrderEnum {  
  /** Created At */
  CreatedAt = 'CREATED_AT',
  /** Name */
  Name = 'NAME',
  /** Updated At */
  UpdatedAt = 'UPDATED_AT'
  
}

export enum WeekDayEnum {  
  /** Friday */
  Friday = 'FRIDAY',
  /** Monday */
  Monday = 'MONDAY',
  /** Saturday */
  Saturday = 'SATURDAY',
  /** Sunday */
  Sunday = 'SUNDAY',
  /** Thursday */
  Thursday = 'THURSDAY',
  /** Tuesday */
  Tuesday = 'TUESDAY',
  /** Wednesday */
  Wednesday = 'WEDNESDAY'
  
}

export enum YearMonthsEnum {  
  /** April */
  April = 'APRIL',
  /** August */
  August = 'AUGUST',
  /** December */
  December = 'DECEMBER',
  /** February */
  February = 'FEBRUARY',
  /** January */
  January = 'JANUARY',
  /** July */
  July = 'JULY',
  /** June */
  June = 'JUNE',
  /** March */
  March = 'MARCH',
  /** May */
  May = 'MAY',
  /** November */
  November = 'NOVEMBER',
  /** October */
  October = 'OCTOBER',
  /** September */
  September = 'SEPTEMBER'
  
}

