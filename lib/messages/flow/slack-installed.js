const { Message } = require('..');

module.exports = class SlackInstalled extends Message {
  constructor() {
    super({});
  }
  toJSON() {
    const subscribe = 'You\'ve successfully installed Touchlab GitHub on this Slack workspace :tada:\n' +
    'To subscribe a channel to a repository use the following slash command:\n' +
    '/touchlab subscribe owner/repository\n';
    const help = 'Looking for additional help? Try /touchlab help';
    return {
      attachments: [
        {
          ...this.getBaseMessage(),
          text: subscribe,
          fallback: subscribe,
        },
        {
          ...this.getBaseMessage(),
          text: help,
          fallback: help,
        },
      ],
    };
  }
};
