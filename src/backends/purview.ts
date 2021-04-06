import * as core from '@actions/core'
import { createWriteStream, readFileSync, writeFileSync } from 'fs'
import { PurviewConfig, SQLConfig } from '../config'
import * as path from 'path'
import stringify from 'csv-stringify'
import * as msRest from "@azure/ms-rest-js";
import fs from 'fs'

import { ClientSecretCredential } from "@azure/identity";

export interface PurviewTerm {
  guid: string;
  qualifiedName: string;
  name: string;
  lastModifiedTS: string;
  createdBy: string;
  updatedBy: string;
  createTime: number;
  updateTime: number;
  status: string;
  anchor: Anchor;
  assignedEntities?: (AssignedEntitiesEntity)[] | null;
}
export interface Anchor {
  glossaryGuid: string;
  relationGuid: string;
}
export interface AssignedEntitiesEntity {
  guid: string;
  typeName: string;
  entityStatus: string;
  displayText: string;
  relationshipType: string;
  relationshipGuid: string;
  relationshipStatus: string;
  relationshipAttributes: RelationshipAttributes;
}
export interface RelationshipAttributes {
  typeName: string;
  attributes: Attributes;
}
export interface Attributes {
  expression?: null;
  createdBy?: null;
  steward?: null;
  confidence?: null;
  description?: null;
  source?: null;
  status?: null;
}

export default async function fetchPurview(config: PurviewConfig): Promise<string> {
  core.info('Connecting to Purview')

  const credential = new ClientSecretCredential(
    config.azure_tenant_id,    // The tenant ID in Azure Active Directory
    config.azure_client_id,    // The application (client) ID registered in the AAD tenant
    config.azure_client_secret, // The client secret for the registered application
  );

  const token = await credential.getToken(`https://purview.azure.net/.default`);
  const tokenString = token?.token!

  const creds = new msRest.TokenCredentials(tokenString);
  const client = new msRest.ServiceClient(creds);
  let req: msRest.RequestPrepareOptions = {
    url: `https://${config.purview_endpoint}/api/atlas/v2/glossary/term/${config.purview_term_id}`,
    method: "GET",
  };


  // const logMsg = term!.assignedEntities?.map(a => JSON.stringify(a)).join(',')
  // core.info(`Assigned entities ${logMsg}`)
  // const entities = term!.assignedEntities[0].guid
  // core.info(entities)

  // `https://${config.purview_endpoint}/api/atlas/v2/entity/guid/${term.assignedEntities?[0].guid}`

  // @ts-ignore
  let term: PurviewTerm = await client
    .sendRequest(req)
    .then((res: msRest.HttpOperationResponse) => {
      console.log('*** bodyAsText: ', res.bodyAsText)
      return JSON.parse(res.bodyAsText!)
    }) as PurviewTerm
  core.debug(JSON.stringify(term))
  if (typeof term.assignedEntities === 'undefined') {
    core.setFailed('No assigned entities found!')
    throw new Error('No assigned entities found!')
  }

  // @ts-ignore
  const guid = term.assignedEntities[0].guid
  const tableMetadataUrl = `https://${config.purview_endpoint}/api/atlas/v2/entity/guid/${guid}`
  core.debug(`Getting table metadata from ${tableMetadataUrl}`)
  let req2: msRest.RequestPrepareOptions = {
    url: tableMetadataUrl,
    method: "GET",
  };

  let resp
  await client.sendRequest(req2).then(function (res: msRest.HttpOperationResponse) {
    resp = JSON.parse(res.bodyAsText!)
  })

  const outfile = `${config.outfile_basename}.json`
  const writer = fs.createWriteStream(outfile)
  await writeFileSync(outfile, JSON.stringify(resp))
  return outfile

  /*
  const outfile = `${config.outfile_basename}.${config.sql_format}`
  try {
    switch (config.sql_format) {
      case 'csv':
        core.info('Writing CSV')
        const writer = createWriteStream(outfile, { encoding: 'utf8' })
        stringify(result, {
          header: true,
        }).pipe(writer)
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve)
          writer.on('error', reject)
        })
        break
 
      default:
        core.info('Writing JSON')
        await writeFileSync(outfile, JSON.stringify(result))
    }
    return outfile
  } catch (error) {
    core.setFailed(`Unable to write results to ${outfile}: ${error.message}`)
    throw error
  }
  */
}
