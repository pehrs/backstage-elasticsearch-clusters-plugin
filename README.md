# backstage-elasticsearch-clusters-plugin

Welcome to the elasticsearch-clusters plugin!

The target of these plugins are orgnaizations that run multiple Elasticsearch clusters (in multiple regions) and want to quicky have an overview of their status.

This is a combination of 2 plugins (the [frontend](./plugins/elasticsearch-clusters/README.md) and the [backend](./plugins/elasticsearch-clusters-backend/README.md)) that will give an overview of your Elasticsearch clusters.

![elasticsearch-clusters plugin screenshot](screenshot.png "Screenshot")
Example screenshot: showing status of 17 es clusters in 5 regions.

If you are working with elasticsearch clusters and have not yet discovered [Cerebro](https://github.com/lmenezes/cerebro), please do. 
This plugin will optionally integrate with Cerebro.

## Installation

Make sure you have created a [backstage-app](https://backstage.io/docs/getting-started/#create-your-backstage-app) first, then:

### To install these plugins run:

   Yarn: (FIXME: This is still untested and I do not know how to publish the plugins yet)
   
   ```bash
   # From your Backstage app root directory
   cd /the/root/of/your/backstage/app
   yarn add --cwd packages/app @pehrs/backstage-elasticsearch-clusters-backend
   yarn add --cwd packages/app @pehrs/backstage-elasticsearch-clusters
   ```
   
   Alternatively, clone this repo and copy the plugins into place:
   ```bash
   cd /some/tmp/path
   git clone git@github.com:pehrs/backstage-elasticsearch-clusters-plugin.git
   cd /the/root/of/your/backstage/app
   cp -r /some/tmp/path/backstage-elasticsearch-clusters-plugin/plugins/elasticsearch-clusters \
      ./plugins/.
   cp -r /some/tmp/path/backstage-elasticsearch-clusters-plugin/plugins/elasticsearch-clusters-backend \
      ./plugins/.
   ```

### Integrate plugin with backstage-app

   *  Add to [`packages/backend/package.json`](packages/backend/package.json):

      ```tsx
	  "@pehrs/plugin-elasticsearch-clusters-backend": "^0.1.0",
      ```

   *  Add to [`packages/backend/src/index.ts`](packages/backend/src/index.ts):

      ```tsx
	  import elasticsearchClusters from './plugins/elasticsearch-clusters';
	  ...
	  const elasticsearchClustersEnv = useHotMemoize(module, () => createEnv('elasticsearchClusters'));
	  ...
	  apiRouter.use('/elasticsearch-clusters', await elasticsearchClusters(elasticsearchClustersEnv));
      ```

   *  Add the file [`packages/backend/src/plugins/elasticsearch-clusters.ts`](packages/backend/src/plugins/elasticsearch-clusters.ts):
      ```tsx
	  import { createRouter } from '@pehrs/plugin-elasticsearch-clusters-backend';
	  import { Router } from 'express';
	  import { PluginEnvironment } from '../types';
	  import { CatalogClient } from '@backstage/catalog-client';

	  export default async function createPlugin(
		env: PluginEnvironment,
	  ): Promise<Router> {
		const catalogApi = new CatalogClient({ discoveryApi: env.discovery });
		return await createRouter({
		  logger: env.logger,
		  config: env.config,
		  catalogApi,
		}
		);
	  }
	  ```

   *  Add to [`packages/app/package.json`](packages/app/package.json):

      ```tsx
      "@pehrs/plugin-elasticsearch-clusters": "^0.1.0",
      ```

   *  Add to [`packages/app/src/App.tsx`](packages/app/src/App.tsx):

      ```tsx
	  import { ElasticsearchClustersPage } from '@pehrs/plugin-elasticsearch-clusters';
	  ...
	  <Route path="/elasticsearch-clusters" element={<ElasticsearchClustersPage />} />
      ```


### Configure the plugin

   In order for the elasticsearch plugins to work you need to add a configuration to your `/app-config.yaml`
   
   Most basic configuration should just list your Elasticsearch cluster links:
   ```yaml
   elasticsearch-clusters:
     cluster_links:
       - "http://es1.europe-west1.my-domain.net:9200"
       - "http://es1.us-central1.my-domain.net:9200"
       - "http://es1.us-east1.my-domain.net:9200"
       - "http://es2.europe-west1.my-domain.net:9200"
       - "http://es2.us-central1.my-domain.net:9200"
       - "http://es2.us-east1.my-domain.net:9200"
   ```
   
   And here's a more elaborate configuration:
   
   ```yaml
   elasticsearch-clusters:
     cluster_links:
       - "http://es1.{region}.my-domain.net:9200"
       - "http://es2.{region}.my-domain.net:9200"
     # [Optional] regions will be used in the cluster_links to replace the {region} value
     regions:
       - "europe-west1"
       - "us-central1"
       - "us-west1"
     # [Optional] Link to cerebro (available variables: cluster_link)
     cerebro_link: "http://cerebro.europe-west1.my-domain.net:9000/#!/overview?host={cluster_link}"
     # [Optional] Link to kibana (available variables: cluster_host)
     kibana_link: "http://{cluster_host}:5601"
   ```

## TODO

- Figure out how to "publish" the plugins.
- Add support for elasticsearch clusters declared as components in the catalog.



## Developer notes

To start the app, run:

```sh
yarn install
yarn dev
```

```
# Add plugin (elasticsearch-clusters)
yarn new --select plugin
# Add backend plugin (Remember to use the name "elasticsearch-clusters")
yarn new --select backend-plugin

```
