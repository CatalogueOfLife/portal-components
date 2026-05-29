// import axiosInstance from './util/axiosInstance';
import client from "./client";
import config from "../config";

export const getFrequency = () => {
  return client(`${config.dataApi}vocab/frequency`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getDatasetType = () => {
  return client(`${config.dataApi}vocab/datasettype`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getDataFormatType = () => {
  return client(`${config.dataApi}vocab/dataformat`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getDatasetOrigin = () => {
  return client(`${config.dataApi}vocab/datasetorigin`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getRank = () => {
  return client(`${config.dataApi}vocab/rank`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getTaxonomicStatus = () => {
  return client(`${config.dataApi}vocab/taxonomicstatus`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getIssue = () => {
  return client(`${config.dataApi}vocab/issue`).then(res =>
    res.data
  );
};

export const getNameType = () => {
  return client(`${config.dataApi}vocab/nametype`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getNameField = () => {
  return client(`${config.dataApi}vocab/namefield`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getNomStatus = () => {
  return client(`${config.dataApi}vocab/nomstatus`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getLicense = () => {
  return client(`${config.dataApi}vocab/license`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getNomCode = () => {
  return client(`${config.dataApi}vocab/nomcode`).then(res =>
    res.data
  );
};

export const getImportState = () => {
  return client(`${config.dataApi}vocab/importstate`).then(res =>
    res.data
  );
};

export const getLifezones = () => {
  return client(`${config.dataApi}vocab/lifezone`).then(res =>
    res.data
  );
};

export const getSectorImportState = () => {
  return client(`${config.dataApi}vocab/sectorimport$state`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getCountries = () => {
  return client(`${config.dataApi}vocab/country`).then(res =>
    res.data
  );
};

export const getTaxGroup = () => {
  return client(`${config.dataApi}vocab/taxgroup`).then(res =>
    res.data
  );
};




