const RepositoryForked = require('../messages/repository-forked');

async function repositoryForked(context, subscription, slack) {
  await slack.chat.postMessage({
    channel: subscription.channelId,
    ...new RepositoryForked(context.payload).toJSON(),
  });
}

module.exports = {
  repositoryForked,
};
