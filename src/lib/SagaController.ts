
export class SagaController {

  locked: { type: string, id: string }[] = []

  constructor(locked: { type: string, id: string }[] = []) {
    this.locked = locked
  }

}
