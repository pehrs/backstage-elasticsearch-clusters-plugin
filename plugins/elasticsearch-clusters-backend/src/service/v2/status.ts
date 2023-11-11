
import { EsConfig } from '../config'
import { CatalogApi } from '@backstage/catalog-client';
import { esSizeStrToFloat, getEsCat } from '../util/escat';

async function getEsEndpointFromSvr(srv: string, httpSchems: string) {
    var dns = require('dns');
    // console.log(`srv: ${srv}`)
    const srvLookup = new Promise((resolve, reject) => {
        dns.resolveSrv(srv, function (err, addresses) {
            if (err !== undefined) {
                // console.log('addresses: ' + JSON.stringify(addresses));
                resolve(addresses);
            }
        });
    })

    const srvResult: any = await srvLookup;
    // console.log("SRV RESULT", srvResult);

    if (srvResult === undefined) {
        return "";
    }
    const addr = srvResult[0];

    return `${httpSchems}://${addr.name}:${addr.port}`
}

function getMetadataLabel(metadata: any | undefined, labelName: string, defaultValue: string | undefined) {
    if (metadata === undefined) {
        return defaultValue;
    }
    const labels = metadata.label;
    if (labels === undefined) {
        return defaultValue;
    }
    const value = labels.filter((label) => labelName in label)
        .map((label) => label[labelName])
        .shift();
    if (value) {
        return value;
    }
    return defaultValue;
}

function replaceReferences(linkPattern: string, endpoint: string, region_override: string) {

    const endpointUrl = new URL(endpoint);

    return linkPattern?.replace("{region}", region_override)
        .replace("{es-endpoint}", endpoint)
        .replace("{es-endpoint.hostname}", endpointUrl.hostname)
        .replace("{es-endpoint.host}", endpointUrl.host)
        .replace("{es-endpoint.port}", endpointUrl.port)
        .replace("{es-endpoint.protocol}", endpointUrl.protocol)
        .replace("{es-endpoint.scheme}", endpointUrl.protocol.replace(":", ""))
        ;
}

function lookupEndpoint(regions: string[], metadata: any): Promise<any>[] {
    const clusterName = metadata.name;
    const description = metadata.description;

    const endpointPattern = getMetadataLabel(metadata, "elasticsearch-plugin/es-endpoint", undefined)
    const scheme = getMetadataLabel(metadata, "elasticsearch-plugin/srv-scheme", "http")
    const region_override = getMetadataLabel(metadata, "elasticsearch-plugin/region", "details")
    const kibanaPattern = getMetadataLabel(metadata, "elasticsearch-plugin/kibana-endpoint", undefined)
    const cerebroPattern = getMetadataLabel(metadata, "elasticsearch-plugin/cerebro-endpoint", undefined)
    if (endpointPattern.startsWith("srv:")) {
        // SRV lookup
        const srv_pattern = endpointPattern.replace("srv:", "");
        // Iterate over all defined regions
        if (endpointPattern.indexOf("{region}") == -1) {
            return [getEsEndpointFromSvr(srv_pattern, scheme)
                .then(endpoint => {
                    return {
                        name: clusterName,
                        region: region_override,
                        kibana: replaceReferences(kibanaPattern, endpoint, region_override),
                        cerebro: replaceReferences(cerebroPattern, endpoint, region_override),
                        description: description,
                        // srv: srv_pattern,
                        endpoint: endpoint,
                    }
                })
                .catch((err) => { })];
        } else {
            return regions.map((region) => {
                const srv = srv_pattern.replace("{region}", region);
                // const scheme = getSrvEndpointScheme(item);
                return getEsEndpointFromSvr(srv, scheme)
                    .then(endpoint => {
                        return {
                            name: clusterName,
                            region: region,
                            kibana: replaceReferences(kibanaPattern, endpoint, region),
                            cerebro: replaceReferences(cerebroPattern, endpoint, region),
                            description: description,
                            // srv: srv,
                            endpoint: endpoint,
                        }
                    })
                    .catch((err) => { });
            });
        }
    } else {
        if (endpointPattern.indexOf("{region}") == -1) {
            return [new Promise(function (resolve, reject) {
                resolve({
                    name: clusterName,
                    region: region_override,
                    kibana: replaceReferences(kibanaPattern, endpointPattern, region_override),
                    cerebro: replaceReferences(cerebroPattern, endpointPattern, region_override),
                    description: description,
                    endpoint: endpointPattern,
                })
            })];
        } else {
            // HTTP
            // Iterate over all defined regions
            return regions.map((region) => {
                return new Promise(function (resolve, reject) {
                    const endpoint = endpointPattern.replace("{region}", region);
                    resolve({
                        name: clusterName,
                        region: region,
                        kibana: replaceReferences(kibanaPattern, endpoint, region),
                        cerebro: replaceReferences(cerebroPattern, endpoint, region),
                        description: description,
                        endpoint: endpoint,
                    })
                });
            });
        }
    }
}

async function getClusterStatus(lookupRes: any): Promise<any> {

    const region = lookupRes.region;
    const name = lookupRes.name;
    const endpoint = lookupRes.endpoint;
    const description = lookupRes.description;
    const kibana = lookupRes.kibana;
    const cerebro = lookupRes.cerebro;

    const catPromises: Promise<any>[] = [
        getEsCat("health", endpoint),
        getEsCat("indices", endpoint),
        getEsCat("aliases", endpoint),
    ];
    const catResults: any[] = await Promise.all(catPromises);

    return new Promise(function (resolve, reject) {
        const response = {
            // lookupRes: lookupRes,
            name: name,
            region: region,
            description: description,
            kibana: kibana,
            cerebro: cerebro,
        }
        catResults.forEach(catRes => {
            if (catRes.state == "ok") {
                response[catRes.cat_name] = catRes.response;
            }
        })
        resolve(response);
    });
}

function getAliasesOrg(name: string, statusResults: any): string[] {
    const setOfAliases: Set<string> = new Set(statusResults
        .filter(statusRes => statusRes.name === name)
        .flatMap(statusRes => {
            const aliases = statusRes.aliases;
            if (aliases) {
                // console.log("ALIASES", aliases);
                return aliases
                    .filter(alias => !alias.alias.startsWith("."))
                    .map(alias => alias.alias)
            }
            return [];
        }));
    return Array.from(setOfAliases.values());
}


function getAliases(aliases: any[]): string[] {
    const setOfAliases: Set<string> = new Set(aliases
        .flatMap(alias => {
            // console.log("ALIASES", aliases);
            if (alias.alias.startsWith(".")) {
                return [];
            }
            return alias.alias;
        })
    );
    return Array.from(setOfAliases.values());
}

function getSum(indices: any, fieldName: string): number {
    return indices.map(index => {
        return parseInt(index[fieldName]);
    })
        .reduce((sum, current) => sum + current, 0);
}

function getSumOfSizes(indices: any, fieldName: string): number {
    return indices.map(index => {
        return esSizeStrToFloat(index[fieldName]);
    })
        .reduce((sum, current) => sum + current, 0.0);
}

export async function getStatus(catalogApi: CatalogApi, esConfig: EsConfig | undefined, response: any) {

    const esClusters = await catalogApi.getEntities({
        // The filter is a logical OR operation
        filter: [
            { 'metadata.tags': 'elasticsearch' }
        ],
    })

    // elasticsearch-plugin/kibana-endpoint: "{es-endpoint.scheme}://{es-endpoint.host}:5601"

    var regions: string[] = esConfig?.regions ? esConfig?.regions : [""];

    const lookupPromises: Promise<any>[] = esClusters.items.flatMap(item => {
        return lookupEndpoint(regions, item.metadata)
    });
    const lookupResults = (await Promise.all(lookupPromises));

    const statusPromises: Promise<any>[] = lookupResults.flatMap(lookupRes => {
        if (lookupRes.endpoint === "") {
            return [];
        } else {
            return [getClusterStatus(lookupRes)];
        }
    })
    const statusResults = (await Promise.all(statusPromises));

    // statusResult => list of:
    // {
    //   "name": "sample",
    //   "region": "gew1",
    //   "health": [],
    //   "indices": [],
    //   "aliases": [],
    // }

    const clusterStatus: any = {}

    statusResults.forEach(statusRes => {
        const name = statusRes.name;
        const region = statusRes.region;
        const description = statusRes.description;
        const health = statusRes.health;
        const indices = statusRes.indices;
        const aliases = statusRes.aliases;

        const kibana = statusRes.kibana;
        const cerebro = statusRes.cerebro;

        var clusterRes = {};
        if (name in clusterStatus) {
            clusterRes = clusterStatus[name];
        }
        clusterStatus[name] = clusterRes;
        clusterRes["description"] = description;
        clusterRes["aliases"] = getAliases(aliases)
        var regionRes = {};
        if (region in clusterRes) {
            regionRes = clusterRes[region];
        }
        clusterRes[region] = regionRes;
        regionRes["status"] = health[0].status;
        regionRes["kibana"] = kibana;
        regionRes["cerebro"] = cerebro;

        // "docCount": 19929,
        regionRes["docCount"] = getSum(indices, "docs.count");
        
        // "totalStorage": 2928383,
        regionRes["totalStorage"] = getSumOfSizes(indices, "store.size");
        // "primaryStorage": 9292882,
        regionRes["primaryStorage"] = getSumOfSizes(indices, "pri.store.size");

    });

    response.json({
        status: 'ok',
        regions: esConfig?.regions,
        clusterStatus: clusterStatus,
    });
}