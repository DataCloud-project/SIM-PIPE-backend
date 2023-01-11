import logger from '../logger.js';
import * as functions from './functions.js';

export interface ContextUser {
  sub: string
  username: string
}

export interface Context {
  user?: ContextUser
}

export interface AuthenticatedContext extends Context {
  user: ContextUser
}

// Create an assertion method for TypeScript that check that user is defined
/* function assertAuthenticated(context: Context): asserts context is AuthenticatedContext {
  if (context.user === undefined) {
    throw new Error('🎌 User is not defined');
  }
} */

const resolvers = {
  Query: {
    Username(_p: unknown, _a: unknown, context: AuthenticatedContext): string {
      return context.user.username;
    },
    Ping(): string {
      return 'pong';
    },
  },
  Mutation: {
    async Create_Simulation(_p: unknown, arguments_: {
      name: string,
      pipeline_description: string
    }, context: AuthenticatedContext)
      : Promise<string> {
      try {
        const newSimId = await functions.createSimulation(
          arguments_.name, arguments_.pipeline_description, context.user.sub);
        return JSON.stringify({
          code: 200,
          message: `Simulation has been created with id ${newSimId}`,
        });
      } catch (error) {
        const errorMessage = `🎌 Error creating new simulation:
      ${(error as Error).message}`;
        logger.error(errorMessage);
        return JSON.stringify({
          code: 300,
          message: errorMessage,
        });
      }
    },
    async Create_Run_WithInput(
      _p: unknown, arguments_: {
        simulation_id: string,
        name: string,
        sampleInput: [[string, string]],
        env_list: [[string]],
        timeout_values: [number]
      },
      context: AuthenticatedContext,
    ): Promise<string> {
      let newRunId;
      try {
        newRunId = await functions.createRunWithInput(
          arguments_.simulation_id,
          arguments_.name,
          arguments_.sampleInput,
          context.user.sub,
          arguments_.env_list,
          arguments_.timeout_values);
        return JSON.stringify({
          code: 200,
          message: `Run has been created with id ${newRunId}`,
        });
      } catch (error) {
        const errorMessage = `🎌 Error creating new run:
      ${(error as Error).message}`;
        logger.error(errorMessage);
        return JSON.stringify({
          code: 300,
          message: errorMessage,
        });
      }
    },
    async Start_Run(
      _p: unknown, arguments_: { run_id: string }, context: AuthenticatedContext,
    ): Promise<string> {
      try {
        await functions.queueRun(arguments_.run_id, context.user.sub);
        return JSON.stringify({
          code: 200,
          message: 'Run has been added to queue',
        });
      } catch (error) {
        const errorMessage = `🎌 Failed! Error starting run:
      ${(error as Error).message}`;
        logger.error(errorMessage);
        return JSON.stringify({
          code: 300,
          message: errorMessage,
        });
      }
    },
    async Stop_Run(_p: unknown, arguments_: { run_id: string }, context: AuthenticatedContext): Promise<string> {
      try {
        await functions.stopRun(arguments_.run_id, context.user.sub);
        return JSON.stringify({
          code: 200,
          message: 'Successfully sent stop signal to current run',
        });
      } catch (error) {
        const errorMessage = `🎌 Error stopping run:
      ${(error as Error).message}`;
        logger.error(errorMessage);
        return JSON.stringify({
          code: 300,
          message: errorMessage,
        });
      }
    },
    async Delete_Run(
      _p: unknown, arguments_: { run_id: string }, context: AuthenticatedContext,
    ): Promise<string> {
      try {
        await functions.deleteRun(arguments_.run_id, context.user.sub);
        return JSON.stringify({
          code: 200,
          message: 'Successfully deleted run',
        });
      } catch (error) {
        const errorMessage = `🎌 Error deleting run:
      ${(error as Error).message}`;
        logger.error(errorMessage);
        return JSON.stringify({
          code: 300,
          message: errorMessage,
        });
      }
    },
    async Delete_Simulation(
      _p: unknown, arguments_: { simulation_id: string }, context: AuthenticatedContext,
    ): Promise<string> {
      try {
        await functions.deleteSimulation(arguments_.simulation_id, context.user.sub);
        return JSON.stringify({
          code: 200,
          message: 'Successfully deleted simulation',
        });
      } catch (error) {
        const errorMessage = `🎌 Error deleting simulation:
      ${(error as Error).message}`;
        logger.error(errorMessage);
        return JSON.stringify({
          code: 300,
          message: errorMessage,
        });
      }
    },
  },
};

export default resolvers;
