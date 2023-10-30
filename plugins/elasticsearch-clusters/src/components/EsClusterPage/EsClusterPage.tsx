/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { 
  // Typography, 
  Grid, 
  // Link 
} from '@material-ui/core';
import {
  // InfoCard,
  Header,
  Page,
  Content,
  // ContentHeader,
  HeaderLabel,
  // SupportButton,
} from '@backstage/core-components';
import { ExampleFetchComponent } from '../EsClusterList';
import { ExampleFetchComponent2 } from '../EsClusterList/ExampleFetchComponent';
import { ExClustersList } from '../EsClusterList/EsClustersList';


export const EsClusterPage = () => (
  <Page key={crypto.randomUUID()} themeId="tool">
    <Header key={crypto.randomUUID()} title="Elasticsearch Clusters" subtitle="Manage your ES clusters.">
      <HeaderLabel url="https://github.com/pehrs" label="Owner" value="@pehrs" />
      <HeaderLabel label="Lifecycle" value="Alpha" />
    </Header>
    <Content key={crypto.randomUUID()}>
      {/* <ContentHeader title="Plugin title">
        <SupportButton>Manage your Elasticsearch clusters.</SupportButton>
      </ContentHeader> */}
      <Grid key={crypto.randomUUID()} container spacing={3} direction="column">
        {/* <Grid item>
          <InfoCard title="Information card">
            <Typography variant="body1">
              All content should be wrapped in a card like this.
            </Typography>
          </InfoCard>
        </Grid> */}
        <Grid key={crypto.randomUUID()} item>
          <ExClustersList key={crypto.randomUUID()}/>
        </Grid>
      </Grid>
    </Content>
  </Page>
);
