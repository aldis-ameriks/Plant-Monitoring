import React from 'react';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import { differenceInMinutes, subDays } from 'date-fns';
import { Text } from 'react-native';

const query = gql`
    query($nodeid: Int, $date: DateTime) {
        readings(nodeid: $nodeid, date: $date) {
            nodeid
            time
            moisture_precentage
            temperature
        }
    }
`;

const DataProvider = ({ date, nodeid, render }) => (
  <Query pollInterval={30000} variables={{ date, nodeid }} query={query}>
    {({ loading, error, data }) => {
      if (loading) {
        return <Text>Loading</Text>;
      }

      if (error) {
        return <Text>Error :(</Text>;
      }

      const { readings } = data;
      if (!readings || readings.length < 1) {
        return <Text>No readings for past 7 days.</Text>;
      }

      const moistures = readings.map(d => d.moisture_precentage).reverse();
      const temperatures = readings.map(d => d.temperature).reverse();
      const labels = readings.map(d => d.time).reverse();
      const lastReadingTime = new Date(readings[0].time);

      const lastReadings = {
        moisture: Number(readings[0].moisture_precentage).toFixed(),
        temperature: readings[0].temperature,
        time: lastReadingTime.toLocaleString(),
        minutesSinceLastReading: differenceInMinutes(new Date(), lastReadingTime)
      };

      return render({ moistures, temperatures, labels, lastReadings });
    }}
  </Query>
);

DataProvider.propTypes = {
  render: PropTypes.func.isRequired,
  date: PropTypes.instanceOf(Date),
  nodeid: PropTypes.number,
};

DataProvider.defaultProps = {
  nodeid: 3,
  date: subDays(new Date(), 7),
};

export default DataProvider;
