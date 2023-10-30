
import { useApi, configApiRef } from '@backstage/core-plugin-api';


export interface EsConfig {
    cerebro_link: string | undefined;
    kibana_link: string | undefined;
    regions: string[] | undefined;
    cluster_links: string[] | undefined;
}

export function getEsConfig(): EsConfig {
    const config = useApi(configApiRef);
    
    if (config.has("elasticsearch-clusters")) {
        console.log("has elasticsearch-clusters config")
        return {
            cerebro_link: config.getOptionalString("elasticsearch-clusters.cerebro_link"),
            kibana_link: config.getOptionalString("elasticsearch-clusters.kibana_link"),
            cluster_links: config.getOptionalStringArray("elasticsearch-clusters.cluster_links"),
            regions: config.getOptionalStringArray("elasticsearch-clusters.regions"),
        }
    } else {
        return {
            cerebro_link: undefined,
            kibana_link: undefined,
            cluster_links: undefined,
            regions: undefined,
        }
    }
}
