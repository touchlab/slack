const {
  Subscribed, NotFound, AlreadySubscribed, NotSubscribed, UpdatedSettings,
} = require('../messages/flow');

/**
 * Subscribes a slack channel to activity from an Organization or Repository
 *
 * Usage:
 *   /github subscribe https://github.com/org/repo
 */
module.exports = async (req, res) => {
  const {
    robot, resource, installation, gitHubUser, slackWorkspace, slackUser,
  } = res.locals;
  const { Subscription, LegacySubscription } = robot.models;
  const { command } = res.locals;

  req.log.debug({ installation, resource }, 'Lookup respository to subscribe');

  // look up the resource
  const from = {};
  from.type = resource.type;
  try {
    if (resource.type === 'repo') {
      from.data = (await gitHubUser.client.repos
        .get({ owner: resource.owner, repo: resource.repo })).data;
    } else {
      from.data = (await gitHubUser.client.users.getForUser({ username: resource.owner })).data;
    }
  } catch (err) {
    req.log.debug({ err }, 'Could not find repository');
    return command.respond(new NotFound(command.args[0]).toJSON());
  }
  const to = command.channel_id;

  let subscription =
    await Subscription.lookupOne(from.data.id, to, slackWorkspace.id, installation.id);
  const settings = command.args.slice(1);

  if (command.subcommand === 'subscribe') {
    if (subscription) {
      if (settings.length > 0) {
        req.log.debug({ settings }, 'Subscription already exists, updating settings');
        subscription.enable(settings);
        await subscription.save();
        return command.respond(new UpdatedSettings({ subscription, source: from }).toJSON());
      }
      req.log.debug('Subscription already exists');
      return command.respond(new AlreadySubscribed(command.args[0]).toJSON());
    }
    req.log.debug('Subscription does not exist, creating.');
    subscription = await Subscription.subscribe({
      channelId: to,
      creatorId: slackUser.id,
      githubId: from.data.id,
      installationId: installation.id,
      settings,
      slackWorkspaceId: slackWorkspace.id,
    });

    await LegacySubscription.migrate(subscription);

    return command.respond(new Subscribed({ channelId: to, source: from }).toJSON());
  } else if (command.subcommand === 'unsubscribe') {
    if (subscription) {
      if (settings.length > 0) {
        subscription.disable(settings);
        await subscription.save();

        return command.respond(new UpdatedSettings({ subscription, source: from }).toJSON());
      }
      await Subscription.unsubscribe(from.data.id, to, slackWorkspace.id);
      return command.respond(new Subscribed({
        channelId: to,
        source: from,
        unsubscribed: true,
      }).toJSON());
    }
    return command.respond(new NotSubscribed(command.args[0]).toJSON());
  }
};
