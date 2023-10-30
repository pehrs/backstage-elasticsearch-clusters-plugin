import { errorHandler } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import express, { response } from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { getStatus as getStatusV1 } from './v1/status'
import { EsConfig } from './config'

export interface RouterOptions {
  config: Config;
  logger: Logger;
}


export const getEsUrls = function (esConfig: EsConfig | undefined): string[] {
  if (!esConfig) {
    return [];
  }
  if (esConfig.cluster_links) {
    return esConfig.cluster_links?.flatMap(cluster_link => {
      if (esConfig.regions) {
        return esConfig.regions?.map(region => {
          return cluster_link.replace("{region}", region)
        })
      } else {
        return cluster_link;
      }
    });
  } else {
    return [];
  }
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { config, logger } = options;
  var esConfig: EsConfig | undefined = undefined

  if (config.has("elasticsearch-clusters")) {
    esConfig = {
      cerebro_link: config.getOptionalString("elasticsearch-clusters.cerebro_link"),
      kibana_link: config.getOptionalString("elasticsearch-clusters.kibana_link"),
      cluster_links: config.getOptionalStringArray("elasticsearch-clusters.cluster_links"),
      regions: config.getOptionalStringArray("elasticsearch-clusters.regions"),
    }
  } else {
    logger.error("No elasticsearch-clusters config found in app-config.yaml")
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
  router.use('/v1/status', async (req, res) => {
    if (esConfig) {
      await getStatusV1(esConfig, res);
    } else {
      res.status(200).json({
        status: "no-config",
        esConfig: undefined,
        clusterStatus: undefined,
      })
    }
  });
  router.use(errorHandler());
  return router;
}




