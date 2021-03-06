import { Arg, Authorized, Ctx, ID, Mutation, Query, Resolver } from 'type-graphql';
import { Inject, Service } from 'typedi';

import { Reading, ReadingInput } from './models';
import { ReadingService } from './service';

import { Context } from 'common/types/context';
import { validate } from 'common/validate';
import { DeviceService } from 'devices/service';

@Service()
@Resolver(Reading)
export class ReadingResolver {
  @Inject()
  private readonly readingService: ReadingService;

  @Inject()
  private readonly deviceService: DeviceService;

  @Query((_returns) => [Reading])
  @Authorized()
  async readings(
    @Ctx() ctx: Context,
    @Arg('deviceId', (_type) => ID) deviceId: string,
    @Arg('date', { nullable: true }) date?: string
  ): Promise<Reading[]> {
    const userId = ctx.user.id;
    await this.deviceService.verifyUserOwnsDevice(deviceId, userId);
    const readings = await this.readingService.getReadings(deviceId, date);
    return readings.map((reading) => Reading.fromTimeBucketedReading(reading));
  }

  @Query((_returns) => Reading, { nullable: true })
  @Authorized()
  async lastReading(@Ctx() ctx: Context, @Arg('deviceId', (_type) => ID) deviceId: string): Promise<Reading> {
    const userId = ctx.user.id;
    await this.deviceService.verifyUserOwnsDevice(deviceId, userId);
    const result = await this.readingService.getLastReading(deviceId);
    return Reading.from(result);
  }

  @Query((_returns) => Date, { nullable: true })
  @Authorized()
  async lastWateredTime(@Ctx() ctx: Context, @Arg('deviceId', (_type) => ID) deviceId: string): Promise<Date> {
    const userId = ctx.user.id;
    await this.deviceService.verifyUserOwnsDevice(deviceId, userId);
    return this.readingService.getLastWateredTime(deviceId);
  }

  @Mutation((_returns) => String)
  @Authorized('HUB')
  async saveReading(@Ctx() ctx: Context, @Arg('input') input: string): Promise<string> {
    ctx.log.info('Received input:', input);
    const parsedInput = input.split(';');
    const device_id = parsedInput[0];
    const moisture_raw = Number(parsedInput[1]);
    const moisture = Number(parsedInput[2]);
    const moisture_min = Number(parsedInput[3]);
    const moisture_max = Number(parsedInput[4]);
    const temperature = Number(parsedInput[5]);
    const light = Number(parsedInput[6]) || null; // Some of the devices have their light sensor covered and send 0
    const battery_voltage = Number(parsedInput[7]);
    const signal = Number(parsedInput[8]);
    const reading_id = Number(parsedInput[9]) || 100;
    const firmware = `${Number(parsedInput[10])}`;

    const readingInput = new ReadingInput();
    readingInput.device_id = device_id;
    readingInput.reading_id = reading_id;
    readingInput.moisture = moisture;
    readingInput.moisture_raw = moisture_raw;
    readingInput.moisture_min = moisture_min;
    readingInput.moisture_max = moisture_max;
    readingInput.temperature = temperature;
    readingInput.battery_voltage = battery_voltage;
    readingInput.light = light;
    readingInput.signal = signal;
    readingInput.firmware = firmware;
    await validate(readingInput);

    const userId = ctx.user.id;
    await this.deviceService.verifyUserOwnsDevice(device_id, userId);
    await this.readingService.saveReading(readingInput);
    return 'success';
  }
}
