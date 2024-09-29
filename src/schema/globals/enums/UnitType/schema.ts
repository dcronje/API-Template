import { APIRegistry } from '@simple/api-registry'
import gql from 'graphql-tag'

const unitTypeEnum = gql`
  enum UnitTypeEnum {
    "Kilogram"
    KG
    "Gram"
    G
    "Milligram"
    MG
    "Litre"
    L
    "Milliliter"
    ML
    "Portion"
    PORTION
    "Pinch"
    PINCH
    "Unit"
    UNIT
    "Table Spoon"
    TBSP
    "Tea Spoon"
    TSP
    "Piece"
    PIECE
    "Drained Gram"
    DG
  }
`

const registry = APIRegistry.shared()
registry.registerType({
  typeDefinitions: unitTypeEnum,
})
