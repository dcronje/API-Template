import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const chronologyEnums = gql`
  "Chronological Period Type"
  enum ChronologicalPeriodTypeEnum {
    "Daily"
    DAILY
    "Weekly"
    WEEKLY
    "Monthly"
    MONTHLY
    "Yearly"
    YEARLY
  }

  "Chronological Unit Type"
  enum ChronologicalUnitTypeEnum {
    "Minute(s)"
    MINUTE
    "Hour(s)"
    HOUR
    "Day(s)"
    DAY
    "Week(s)"
    WEEK
    "Month(s)"
    MONTH
    "Year(s)"
    YEAR
  }

  "Week Days"
  enum WeekDayEnum {
    "Monday"
    MONDAY
    "Tuesday"
    TUESDAY
    "Wednesday"
    WEDNESDAY
    "Thursday"
    THURSDAY
    "Friday"
    FRIDAY
    "Saturday"
    SATURDAY
    "Sunday"
    SUNDAY
  }

  "Month Weeks"
  enum MonthWeekEnum {
    "1st"
    FIRST
    "2nd"
    SECOND
    "3rd"
    THIRD
    "4th"
    FOURTH
  }

  "YearMonths"
  enum YearMonthsEnum {
    "January"
    JANUARY
    "February"
    FEBRUARY
    "March"
    MARCH
    "April"
    APRIL
    "May"
    MAY
    "June"
    JUNE
    "July"
    JULY
    "August"
    AUGUST
    "September"
    SEPTEMBER
    "October"
    OCTOBER
    "November"
    NOVEMBER
    "December"
    DECEMBER
  }
`

const registry = APIRegistry.shared()
registry.registerType({
  typeDefinitions: chronologyEnums,
})
