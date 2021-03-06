import { FastifyInstance } from 'fastify';
import Knex from 'knex';

import { Container } from 'typedi';

import { DeviceStatus, DeviceVersion } from 'common/types/entities';
import { formatSuccessResponse } from 'devices/helpers/formatSuccessResponse';

export function devicesRoutes(fastify: FastifyInstance, opts, done) {
  const knex: Knex = Container.get('knex');

  fastify.post(
    '/discover',
    {
      schema: {
        body: {
          type: 'string',
        },
        response: {
          200: {
            type: 'string',
          },
          400: {
            type: 'string',
          },
        },
      },
    },
    async (req, reply) => {
      const deviceId = req.body;
      req.log.info('Discover request', deviceId);

      const device = await knex('devices')
        .select('devices.*', 'users_devices.user_id')
        .leftJoin('users_devices', 'users_devices.device_id', 'devices.id')
        .where('devices.id', deviceId)
        .first();

      if (!device) {
        req.log.error('Unknown device tried to discover itself, deviceId:', deviceId);
        return reply.code(400).send('failed');
      }

      if (req.ctx.user.id === device.user_id) {
        return reply.send(formatSuccessResponse(device.type, 'paired'));
      }

      if (device.status === DeviceStatus.paired && device.user_id) {
        // Have to remove device from app first to enable re-pairing
        req.log.error('Device that is already paired tried to discover itself');
        return reply.code(400).send('failed');
      }

      if (device.status === DeviceStatus.pairing && device.user_id) {
        if (device.version === DeviceVersion.hub_10) {
          const accessKey = await knex('users_access_keys')
            .select('access_key')
            .innerJoin('users_devices', 'users_devices.user_id', 'users_access_keys.user_id')
            .whereRaw("'HUB' = ANY(roles)")
            .andWhere('users_devices.device_id', deviceId)
            .first();

          if (accessKey) {
            req.log.info('Successfully paired hub, returning access key');
            return reply.send(accessKey.access_key);
          }
        }

        if (device.version === DeviceVersion.sensor_10) {
          req.log.info('Successfully paired sensor');
          await knex('devices').update('status', DeviceStatus.paired).where('id', deviceId);
          return reply.send(formatSuccessResponse(device.type, 'paired'));
        }
      }

      const address = req.ctx.isLocal ? '127.0.0.1' : req.ip;
      await knex('devices')
        .update({ address, last_seen_at: new Date(), status: DeviceStatus.pairing })
        .where('id', deviceId);
      return reply.send(formatSuccessResponse(device.type, 'discover'));
    }
  );

  fastify.post(
    '/confirm-pairing',
    {
      schema: {
        body: {
          type: 'string',
        },
        response: {
          200: {
            type: 'string',
          },
          400: {
            type: 'string',
          },
        },
      },
    },
    async (req, reply) => {
      req.log.info('Pairing confirm request', req.body);
      if (!req.ctx.user) {
        return reply.code(400).send('failed');
      }

      const device = await knex('devices')
        .innerJoin('users_devices', 'users_devices.device_id', 'devices.id')
        .where('users_devices.user_id', req.ctx.user.id)
        .andWhere('devices.id', req.body)
        .first();

      if (!device) {
        return reply.code(400).send('failed');
      }

      const deviceId = req.body;
      await knex('devices').update('status', DeviceStatus.paired).where('id', deviceId);
      return reply.send(formatSuccessResponse(device.type, 'paired'));
    }
  );

  done();
}
