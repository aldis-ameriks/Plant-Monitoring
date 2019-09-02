import gql from 'graphql-tag';

gql`
  query GetReadings($nodeId: String!, $date: String!) {
    readings(nodeId: $nodeId, date: $date) {
      moisture {
        time
        value
      }
      temperature {
        time
        value
      }
      batteryVoltage {
        time
        value
      }
      watered
    }
  }
`;