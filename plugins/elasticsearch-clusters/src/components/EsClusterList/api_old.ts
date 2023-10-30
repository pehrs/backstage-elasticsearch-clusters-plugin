import { EsClusterConfig, elasticsearch_clusters_config } from "./config";
import { DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';


export type EsCluster = {
    name: string;
    health_status: string; // red, yellow or green
    version: string;
    cerebro_link: string;
    kibana_link: string;
};

export const getEsUrls = function (esConfig: EsClusterConfig): string[] {
    return esConfig.clusters.flatMap(cluster_link => {
        return esConfig.region.map(region => {
            const link = cluster_link.replace("{region}", region)
            return link;
        })
    })
}


export const getClusterInfosOld = async (): Promise<EsCluster[]> => {

    const esConfig = elasticsearch_clusters_config;
    const esUrls: string[] = getEsUrls(esConfig);
    // console.log("esUrls", esUrls)
    const getRootPromises = esUrls.map(esUrl => {
        return fetch(new URL(esUrl),
            {
                mode: 'no-cors',

                // method: 'GET',
                // headers: new Headers({
                //   Accept: "application/json",
                // })
            })
            .then(response => {
                console.log("OK", response);
                return {
                    state: "OK",
                    es_url: esUrl,
                    response: response.json(),
                }
            }).catch(reason => {
                return {
                    state: "ERROR",
                    es_url: esUrl,
                    reason: reason,
                }
            })
    })
    const results = await Promise.all(getRootPromises)
    const esClusters = results.flatMap(res => {
        console.log("res", res);
        return [];
    })
    console.log("esClusters", esClusters)
    return [];
}


////////////////////

export class EsBackendClient implements EsBackendApi {
    private readonly discoveryApi: DiscoveryApi;
    private readonly identityApi: IdentityApi;
    constructor(options: {
        discoveryApi: DiscoveryApi;
        identityApi: IdentityApi;
    }) {
        this.discoveryApi = options.discoveryApi;
        this.identityApi = options.identityApi;
    }
    private async handleResponse(response: Response): Promise<any> {
        if (!response.ok) {
            throw new Error();
        }
        return await response.json();
    }
    async getHealth(): Promise<{ status: string; }> {
        const url = `${await this.discoveryApi.getBaseUrl('plugin-elasticsearch-clusters-backend')}/health`;
        const { token: idToken } = await this.identityApi.getCredentials();
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...(idToken && { Authorization: `Bearer ${idToken}` }),
            },
        });
        return await this.handleResponse(response);
    }
}