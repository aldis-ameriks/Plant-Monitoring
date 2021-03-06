import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-fastify';
import fastify from 'fastify';
import { fieldExtensionsEstimator, getComplexity, simpleEstimator } from 'graphql-query-complexity';
import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';

import { authChecker } from 'common/authChecker';
import { isDevelopment } from 'common/config';
import { knex } from 'common/db';
import { executor } from 'common/graphqlExecutor';
import { createRequestContext } from 'common/helpers/createRequestContext';
import { shutdown } from 'common/helpers/shutdown';
import { initJsonSchema } from 'common/jsonSchema';
import { DeviceResolver } from 'devices/resolver';
import { devicesRoutes } from 'devices/routes';
import { NotificationsCron } from 'notifications/cron';
import { NotificationsResolver } from 'notifications/resolver';
import { notificationRoutes } from 'notifications/routes';
import { ReadingResolver } from 'readings/resolver';
import { readingsRoutes } from 'readings/routes';
import { UserResolver } from 'user/resolver';
import { userRoutes } from 'user/routes';

(async () => {
  const schema = await buildSchema({
    authChecker,
    resolvers: [ReadingResolver, DeviceResolver, NotificationsResolver, UserResolver],
    emitSchemaFile: isDevelopment
      ? {
          path: `${__dirname}/../schema.graphql`,
          commentDescriptions: true,
        }
      : false,
    container: Container,
  });

  const apolloServer = new ApolloServer({
    schema,
    context: async (req) => req.ctx,
    executor: executor(schema),
    formatError: (err) => {
      console.error(JSON.stringify(err));
      return err;
    },
    plugins: [
      {
        requestDidStart: (requestContext) => {
          requestContext.context.log.info(
            `user: ${requestContext.context.user?.id}, operationName: ${
              requestContext.request.operationName
            }, variables: ${JSON.stringify(requestContext.request.variables)}`
          );
        },
      },
      {
        requestDidStart: (_requestContext) => ({
          didResolveOperation({ request, document }) {
            const complexity = getComplexity({
              schema,
              operationName: request.operationName,
              query: document,
              variables: request.variables,
              estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
            });
            if (complexity >= 30) {
              throw new Error(
                `Sorry, too complicated query! ${complexity} is over 30 that is the max allowed complexity.`
              );
            }
          },
        }),
      },
    ],
  });

  const app = fastify({
    logger: {
      prettyPrint: isDevelopment
        ? {
            translateTime: true,
          }
        : false,
    },
  });

  Container.set('logger', app.log);
  Container.set('knex', knex);

  initJsonSchema();
  Container.get(NotificationsCron).start();

  app.decorateRequest('ctx', {});
  app.addHook('preHandler', async (req) => {
    req.ctx = await createRequestContext(req.log, req.headers, req.ip, req.hostname);
  });

  app.head('/', async () => 'head');
  app.get('/ping', async () => 'pong');

  app.register(readingsRoutes);
  app.register(devicesRoutes);
  app.register(userRoutes);
  app.register(notificationRoutes);
  app.register(apolloServer.createHandler({ path: '/graphql' }));

  const address = await app.listen(process.env.SERVER_PORT ? +process.env.SERVER_PORT : 4000, '0.0.0.0');
  console.log(`Server started, listening on ${address} for incoming requests.`);
  console.log('Using environment:', process.env.NODE_ENV);

  await shutdown(app.close);
})();
