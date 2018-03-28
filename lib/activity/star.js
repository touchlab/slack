const RepositoryWatched = require('../messages/repository-starred');

async function repositoryStarred(context, subscription, slack) {
  await slack.chat.postMessage({
    channel: subscription.channelId,
    ...new RepositoryWatched(context.payload).toJSON(),
  });
}

module.exports = {
  repositoryStarred,
};
