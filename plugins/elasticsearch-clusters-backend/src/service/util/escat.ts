
export function getEsCat(cat_name: string, clusterEndpoint: string): Promise<any> {
    return fetch(new URL(`${clusterEndpoint}/_cat/${cat_name}?format=json`))
        .then(response => response.json())
        .then(theJson => {
            return {
                cat_name: cat_name,
                state: "ok",
                cluster_link: clusterEndpoint,
                // region: region,
                response: theJson,
            }
        })
        .catch(reason => {
            return {
                cat_name: cat_name,
                state: "ERROR",
                cluster_link: clusterEndpoint,
                // region: region,
                reason: reason,
            }
        })
}


export function esSizeStrToFloat(es: string): number {

    var clean = es.replace("b", "");
    var multiplier = 1.0;
    if (clean.endsWith("k")) {
        multiplier = 1000.0;
        clean = clean.replace("k", "");
    }
    if (clean.endsWith("m")) {
        multiplier = 1000000.0;
        clean = clean.replace("m", "");
    }
    if (clean.endsWith("g")) {
        multiplier = 1000000000.0;
        clean = clean.replace("g", "");
    }

    const base = parseFloat(clean);

    return base * multiplier;
}
