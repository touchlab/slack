const { Message, getChannelString } = require('..');

module.exports = class UpdatedSettings extends Message {
  constructor({ subscription, source }) {
    super({});
    this.subscription = subscription;
    this.sourceUrl = source.data.html_url;
    if (source.type === 'repo') {
      this.sourceName = source.data.full_name;
    } else {
      this.sourceName = source.data.login;
    }
  }

  get channel() {
    return getChannelString(this.subscription.channelId);
  }

  get enabledSettings() {
    return this.subscription.getEnabledSettings().map(setting => `\`${setting}\``).join(', ');
  }

  get repositoryLink() {
    return `<${this.sourceUrl}|${this.sourceName}>`;
  }

  toJSON() {
    return {
      response_type: 'in_channel',
      attachments: [{
        ...this.getBaseMessage(),
        text: `${this.channel}will get notifications from ${this.repositoryLink} for: \n` +
          `${this.enabledSettings}`,
        footer: '<https://github.com/integrations/slack#configuration|Learn More>',
        mrkdwn_in: ['text', 'footer'],
      }],
    };
  }
};
