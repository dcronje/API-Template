export class ColumnFloat {

  to(data: number | null): number | null {
    return data
  }

  from(data: string | null): number | null {
    if (data !== null) {
      return parseFloat(data)
    }
    return null
  }

}
