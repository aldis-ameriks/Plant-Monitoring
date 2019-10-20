import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useParams } from 'react-router-dom';
import Info from '../components/Info';
import InfoToggle from '../components/InfoToggle';
import LineChart from '../components/LineChart';
import { useReadingsQuery } from '../graphql';
import SensorReadings from '../components/SensorReadings';
import { LeftArrow } from '../components/LeftArrow';

export const CardWrapper = styled.div`
  margin: 2em 0;
  display: flex;
  justify-content: center;
`;

export const Card = styled.div`
  position: relative;
  box-shadow: 0px 15px 25px 0px rgba(0, 0, 0, 0.25);
  background-color: #ededed;
  width: 600px;
  border-radius: 30px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  transition: all 500ms ease;
  padding: 1em 0 2em 0;

  @media (min-width: 500px) {
    padding: 1em 1em 2em 1em;
  }

  @media (min-width: 1300px) {
    width: 1200px;
    height: 1250px;
  }
`;

export const CardSection = styled.div`
  transition: all 500ms ease;
  width: 300px;

  @media (min-width: 500px) {
    width: 400px;
  }

  @media (min-width: 700px) {
    width: 600px;
  }
`;

export const CardTitle = styled.h3`
  text-align: center;
`;

const LineChartsWrapper = styled.div`
  @media (max-width: 700px) {
    margin-left: -3em; // workaround for the excessive left space for apex charts in mobile layout
  }
`;

const ImageWrapper = styled.div`
  text-align: center;
`;

const Image = styled.img`
  width: 70%;
  @media (min-width: 1300px) {
    width: 80%;
  }
`;

const BackLinkWrapper = styled(Link)`
  position: absolute;
  cursor: pointer;
  top: 5px;
  left: 10px;
  z-index: 3000;
  background-color: transparent;
  padding: 0.5em;
  font-size: 1.5em;
  border: 3px solid transparent;
`;

const SensorDetails = () => {
  const { id = '4' } = useParams();
  const [isInfoVisible, setInfoVisibility] = useState(false);
  const { data, loading, error } = useReadingsQuery({ variables: { nodeIds: [id] } });

  if (loading) {
    return null;
  }

  if (error) {
    return <p>Error loading sensor data: {error.message}</p>;
  }

  if (!data || !data.readings || !data.readings[0]) {
    return <p>No readings. Check your sensors.</p>;
  }

  const readings = data.readings[0];

  return (
    <CardWrapper>
      <Card>
        <BackLinkWrapper to="/">
          <LeftArrow color="#8c8c8d" />
        </BackLinkWrapper>
        <InfoToggle isVisible={isInfoVisible} setVisibility={setInfoVisibility} />
        <Info isVisible={isInfoVisible} />
        <CardSection>
          <CardTitle>Rubber tree</CardTitle>
          <ImageWrapper>
            <Image src="/plant.jpg" alt="" width="100%" />
          </ImageWrapper>
          <SensorReadings nodeId={id} />
        </CardSection>

        <CardSection>
          <LineChartsWrapper>
            <LineChart data={readings} title="Moisture" field="moisture" />
            <LineChart data={readings} title="Average Temperature" field="temperature" />
            <LineChart min={2.0} max={4.3} data={readings} title="Battery voltage" field="battery_voltage" />
          </LineChartsWrapper>
        </CardSection>
      </Card>
    </CardWrapper>
  );
};

export default SensorDetails;