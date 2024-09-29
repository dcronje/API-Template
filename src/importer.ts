

import 'reflect-metadata'
import path from 'path'
// @ts-ignore
global.__basedir = path.resolve(__dirname, '../')
import './env'
import fs from "fs"
import moment from 'moment'
import { AppDataSource } from '@root/data-source'
import { GenderEnum } from './enums'
import { Citizen, Constituency, District, LocalAuthority, PollingStation, Province, Ward } from '@models/index'

// enum GenderEnum {
//   MALE = 'MALE',
//   FEMALE = 'FEMALE',
// }

interface CitizenData {
  serialNumber: number
  lastName: string
  firstNames: string
  idNumber: string
  gender: GenderEnum
  dateOfBirth: string
  address: string
  pollingStation: string
  ward: string
  localAuthourity: string
  constituency: string
  district: string
  province: string
}


const provinces: { [k: string]: { id: string, districts: { [k: string]: { id: string, constituencies: { [k: string]: { id: string } } } } } } = {}
const localAuthorities: { [k: string]: { id: string, wards: { [k: string]: { id: string } } } } = {}
const pollingStaions: { [k: string]: string } = {}


const writeFile = (file: string, data: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(file, data, (err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

const getJsonData = (jsonFilePath: string): Promise<CitizenData[]> => {
  return new Promise<CitizenData[]>((resolve, reject) => {
    fs.readFile(jsonFilePath, 'utf-8', (err, data) => {
      if (err) {
        return reject(err)
      }
      resolve(JSON.parse(data))
    })
  })
}

const importProvince = async (data: CitizenData): Promise<string> => {
  if (provinces?.[data.province]) {
    return provinces[data.province].id
  }
  let province = await AppDataSource.getRepository(Province).createQueryBuilder()
    .where('"name" = :name', { name: data.province })
    .getOne()
  if (!province) {
    province = Province.create({
      name: data.province,
    })
    await province.save()
  }
  if (!province) {
    throw new Error('Province error')
  }
  provinces[data.province] = { id: province.id, districts: {} }
  return provinces[data.province].id
}

const importDistrict = async (data: CitizenData): Promise<string> => {
  if (provinces?.[data.province]?.districts?.[data.district]) {
    return provinces[data.province].districts[data.district].id
  }
  const provinceId = await importProvince(data)
  let district = await AppDataSource.getRepository(District).createQueryBuilder()
    .where('"name" = :name', { name: data.district })
    .andWhere('"provinceId" = :provinceId', { provinceId })
    .getOne()
  if (!district) {
    district = District.create({
      provinceId,
      name: data.district,
    })
    await district.save()
  }
  if (!district) {
    throw new Error('District error')
  }
  provinces[data.province].districts[data.district] = { id: district.id, constituencies: {} }
  return provinces[data.province].districts[data.district].id
}

const importConstituency = async (data: CitizenData): Promise<string> => {
  if (provinces?.[data.province]?.districts?.[data.district]?.constituencies?.[data.constituency]) {
    return provinces[data.province].districts[data.district].constituencies[data.constituency].id
  }
  const districtId = await importDistrict(data)
  let constituency = await AppDataSource.getRepository(Constituency).createQueryBuilder()
    .where('"name" = :name', { name: data.constituency })
    .andWhere('"districtId" = :districtId', { districtId })
    .getOne()
  if (!constituency) {
    constituency = Constituency.create({
      districtId,
      name: data.constituency,
    })
    await constituency.save()
  }
  if (!constituency) {
    throw new Error('Constituency error')
  }
  provinces[data.province].districts[data.district].constituencies[data.constituency] = { id: constituency.id }
  return provinces[data.province].districts[data.district].constituencies[data.constituency].id
}

const importLocalAuthority = async (data: CitizenData): Promise<string> => {
  if (localAuthorities?.[data.localAuthourity]) {
    return localAuthorities[data.localAuthourity].id
  }
  let localAuthority = await AppDataSource.getRepository(LocalAuthority).createQueryBuilder()
    .where('"name" = :name', { name: data.localAuthourity })
    .getOne()
  if (!localAuthority) {
    localAuthority = LocalAuthority.create({
      name: data.localAuthourity,
    })
    await localAuthority.save()
  }
  if (!localAuthority) {
    throw new Error('Local Authority error')
  }
  localAuthorities[data.localAuthourity] = { id: localAuthority.id, wards: {} }
  return localAuthorities[data.localAuthourity].id
}

const importWard = async (data: CitizenData): Promise<string> => {
  if (localAuthorities?.[data.localAuthourity]?.wards?.[data.ward]) {
    return localAuthorities?.[data.localAuthourity]?.wards?.[data.ward].id
  }
  const localAuthorityId = await importLocalAuthority(data)
  let ward = await AppDataSource.getRepository(Ward).createQueryBuilder()
    .where('"name" = :name', { name: data.ward })
    .andWhere('"localAuthorityId" = :localAuthorityId', { localAuthorityId })
    .getOne()
  if (!ward) {
    ward = Ward.create({
      name: data.ward,
      localAuthorityId,
    })
    await ward.save()
  }
  if (!ward) {
    throw new Error('Local Authority error')
  }
  localAuthorities[data.localAuthourity].wards[data.ward] = { id: ward.id }
  return localAuthorities[data.localAuthourity].wards[data.ward].id
}

const importPollingStation = async (data: CitizenData): Promise<string> => {
  const wardId = await importWard(data)
  const constituencyId = await importConstituency(data)
  if (pollingStaions?.[`${wardId}-${constituencyId}-${data.pollingStation}`]) {
    return pollingStaions?.[`${wardId}-${constituencyId}-${data.pollingStation}`]
  }
  let pollingStation = await AppDataSource.getRepository(PollingStation).createQueryBuilder()
    .where('"name" = :name', { name: data.pollingStation })
    .andWhere('"wardId" = :wardId', { wardId })
    .andWhere('"constituencyId" = :constituencyId', { constituencyId })
    .getOne()
  if (!pollingStation) {
    pollingStation = PollingStation.create({
      name: data.pollingStation,
      wardId,
      constituencyId,
    })
    await pollingStation.save()
  }
  if (!pollingStation) {
    throw new Error('Polling Staion error')
  }
  pollingStaions[`${wardId}-${constituencyId}-${data.pollingStation}`] = pollingStation.id
  return pollingStaions[`${wardId}-${constituencyId}-${data.pollingStation}`]
}

const trimItem = (item: CitizenData): CitizenData => {
  const newItem = { ...item } as { [k: string]: any }
  Object.keys(newItem).map((key) => {
    if (typeof newItem[key] === 'string') {
      newItem[key] = (newItem[key] as string).trim().toUpperCase()
    }
  })
  return newItem as CitizenData
}

const importFile = async (fileName: string) => {
  console.log(`IMPORTING: ${fileName}`)
  var jsonFilePath = path.resolve(__dirname, `./importer/${fileName}`)
  const jsonData = await getJsonData(jsonFilePath)
  // console.log(jsonData)
  for (let f = 0; f < jsonData.length; f++) {
    const item = trimItem(jsonData[f])
    console.log(`${item.serialNumber}: ${item.firstNames} ${item.lastName}`)
    const pollingStationId = await importPollingStation(item)
    let citizen = await AppDataSource.getRepository(Citizen).createQueryBuilder()
      .where('"idNumber" = :idNumber', { idNumber: item.idNumber })
      .andWhere('"pollingStationId" = :pollingStationId', { pollingStationId })
      .andWhere('"serialNumber" = :serialNumber', { serialNumber: item.serialNumber })
      .getOne()
    if (!citizen) {
      citizen = Citizen.create({
        serialNumber: item.serialNumber,
        lastName: item.lastName,
        firstNames: item.firstNames,
        idNumber: item.idNumber,
        gender: item.gender,
        dateOfBirth: moment(item.dateOfBirth, "DD/MM/YYYY").toDate(),
        address: item.address,
        pollingStationId,
      })
      await citizen.save()
      console.log('ADDED')
    } else {
      console.log('SKIPPED')
    }
  }

}


export const go = async (): Promise<void> => {
  console.log('STARTING IMPORT')
  const files = ['BULAWAYO_CENTRAL.json', 'EMKHANDENI_LUVEVE.json', 'PUMULA.json', 'TSHOLOTSHO.json']
  // const files = ['TSHOLOTSHO.pdf']
  for (let f = 0; f < files.length; f++) {
    await importFile(files[f])
  }
}

// go()