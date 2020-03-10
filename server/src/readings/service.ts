import { knex } from '../common/db';

type ReadingInput = {
  device_id: string;
  timestamp: Date;
  moisture: number;
  moisture_raw: number;
  moisture_min: number;
  moisture_max: number;
  temperature: number;
  light: number | null;
  battery_voltage: number;
  signal: number;
};

export class ReadingService {
  public async getReadings(deviceId = '99', date) {
    const time = getTimestamp(date);
    const result = await knex.raw(
      `
      SELECT * FROM (
        SELECT
          device_id,
          TIME_BUCKET_GAPFILL('1 day'::INTERVAL, timestamp, :time, NOW()) AS time,
          LOCF(AVG(moisture)) AS moisture,
          LOCF(AVG(temperature)) AS temperature,
          LOCF(AVG(light)) AS light,
          LOCF(AVG(battery_voltage)) AS battery_voltage
        FROM readings
        WHERE device_id = :deviceId and timestamp > :time
        GROUP BY time, device_id
        ORDER BY time ASC
        ) AS readings
      WHERE moisture IS NOT NULL; -- Exclude entries with non-null readings that can occur when period is before first readings. 
    `,
      { time, deviceId }
    );
    return result.rows;
  }

  public async getLastReading(deviceId) {
    return knex('readings')
      .select('device_id', knex.ref('timestamp').as('time'), 'moisture', 'temperature', 'light', 'battery_voltage')
      .where('device_id', deviceId)
      .orderBy('time', 'desc')
      .limit(1)
      .first();
  }

  public async getLastWateredTime(deviceId) {
    const result = await knex.raw(
      `
      SELECT * FROM (
        SELECT 
          device_id,
          timestamp AS time,
          moisture - LEAD(moisture) OVER (ORDER BY timestamp DESC) AS moisture_increase
        FROM readings
        WHERE device_id = :deviceId
      ) AS readings
      WHERE moisture_increase > 10;
    `,
      { deviceId }
    );
    return result && result.rows[0] ? result.rows[0].time : null;
  }

  public async saveReading(deviceId: string, reading: ReadingInput) {
    await knex('readings').insert(reading);
  }
}

function getTimestamp(date?: string) {
  if (date) {
    return new Date(date);
  }

  const now = new Date();
  now.setDate(now.getDate() - 90);
  return now;
}