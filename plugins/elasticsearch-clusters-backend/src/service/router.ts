import { errorHandler } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import express, { response } from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { getStatus as getStatusV2 } from './v2/status'
import { EsConfig } from './config'
import { CatalogApi } from '@backstage/catalog-client';

export interface RouterOptions {
  config: Config;
  logger: Logger;
  catalogApi: CatalogApi;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { config, logger, catalogApi } = options;

  var esConfig: EsConfig | undefined = undefined

  if (config.has("elasticsearch-clusters")) {
    esConfig = {
      regions: config.getOptionalStringArray("elasticsearch-clusters.regions"),
      cacheControl: config.getOptionalString("elasticsearch-clusters.cache-control"),
    }
  } else {
    esConfig = {
      regions: [],
      cacheControl: undefined,
    }
  }

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    if (config.has("elasticsearch-clusters")) {
      logger.info('/health called :-)');
      response.json({
        status: 'ok',
        esConfig: esConfig,
      });
    } else {
      logger.warn('no configuration!');
      response.json({ status: 'no-config' });
    }
  });
  router.use('/v2/status', async (req, res) => {
      await getStatusV2(catalogApi, esConfig, res);
  });
  router.use(errorHandler());
  return router;
}




