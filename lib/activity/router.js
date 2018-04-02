const { Subscription, SlackUser, GitHubUser } = require('../models');
const { ReEnableSubscription } = require('../messages/flow');
const avoidReplicationLag = require('../github/avoid-replication-lag');
const cache = require('../cache');

// Temporary "middleware" hack to look up routing before delivering event
module.exports = function route(callback) {
  return async (context) => {
    if (context.payload.repository) {
      const repo = context.payload.repository;
      const subscriptions = await Subscription.lookupEither(repo.id, repo.owner.id);
      context.log.debug({ subscriptions }, 'Delivering to subscribed channels');

      return Promise.all(subscriptions.map(async (subscription) => {
        if (!subscription.isEnabledForGitHubEvent(context.event)) {
          return;
        }

        const eventType = `${context.event}.${context.payload.action}`;

        // Create clack client with workspace token
        const slack = subscription.SlackWorkspace.client;

        if (subscription.creatorId && eventType !== 'repository.deleted') {
          // Verify that subscription creator still has access to the resource
          const creator = await SlackUser.findById(subscription.creatorId, {
            include: [GitHubUser],
          });

          const hasRepoAccess = await cache.fetch(
            subscription.cacheKey('creator-access'),
            () => creator.GitHubUser.hasRepoAccess(context.payload.repository.id),
            10 * 60 * 1000,
          );

          if (!hasRepoAccess) {
            context.log.debug({
              subscription: {
                channelId: subscription.channelId,
                creatorId: subscription.creatorId,
                githubId: context.payload.repository.id,
                workspaceId: subscription.SlackWorkspace.slackId,
              },
            }, 'User lost access to resource. Deleting subscription.');

            await Promise.all([
              // @todo: deactive this subscription instead of deleting the db record
              await subscription.destroy(),
              await slack.chat.postMessage({
                channel: subscription.channelId,
                ...new ReEnableSubscription(context.payload.repository, creator.slackId).toJSON(),
              }),
            ]);
            return;
          }
        }

        // Delay GitHub API calls to avoid replication lag
        context.github.hook.before('request', avoidReplicationLag());

        return callback(context, subscription, slack);
      }));
    }
  };
};
