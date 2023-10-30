import { useApi, configApiRef } from '@backstage/core-plugin-api';


// export const getClusterInfos = async (): Promise<any> => {
//     const config = useApi(configApiRef)

//     const backendUrl = config.getString('backend.baseUrl');
//     return fetch(`${backendUrl}/api/elasticsearch-clusters/status`)
//     .then(result => result.json());
// }

export const getClusterInfos = async (): Promise<any> => {
    const config = useApi(configApiRef)

    const backendUrl = config.getString('backend.baseUrl');
    return fetch(`${backendUrl}/api/elasticsearch-clusters/status`)
    .then(result => result.json());
}
