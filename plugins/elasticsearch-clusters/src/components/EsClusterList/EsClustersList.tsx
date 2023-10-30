import React, { useEffect, useState } from 'react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { Link, Progress } from '@backstage/core-components';
import { EsClusterTable } from './EsClustersTable';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
    pre: {
        fontFamily: "courier",
        color: "#229922",
    },
});

export const ExClustersList = () => {

    const classes = useStyles();
    const [clusterInfo, setClusterInfo] = useState(null)
    const config = useApi(configApiRef)
    const backendUrl = config.getString('backend.baseUrl');

    console.log("backendUrl", backendUrl)

    useEffect(() => {
        console.log("before fetch")
        fetch(`${backendUrl}/api/elasticsearch-clusters/v1/status`)
            .then((result) => result.json())
            .then((data) => {
                console.log("data", data);
                setClusterInfo(data)
                // setLoading(false)
            })
    }, [])
    if (clusterInfo == null) {
        return (<Progress />)
    }
    // console.log("clusterInfo", clusterInfo)
    if (clusterInfo && clusterInfo["status"] === "ok") {
        return (<EsClusterTable key={crypto.randomUUID()} clusterInfo={clusterInfo} />)
    } else {
        return (<span>No <span className={classes.pre}>elasticsearch-clusters</span> 
        &nbsp;config found in <span className={classes.pre}>/app-config.yaml</span><br/>
        Please update your <span className={classes.pre}>app-config.yaml</span><br/>
        <br/>
        More details on how to configure this plugin can be found at&nbsp;
        <Link to="https://github.com/pehrs/backstage-elasticsearch-plugin/README.md">https://github.com/pehrs/backstage-elasticsearch-plugin/README.md</Link>
        </span>)
    }
}
