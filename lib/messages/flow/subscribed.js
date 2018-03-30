const { Message, getChannelString } = require('..');

module.exports = class Subscribed extends Message {
  constructor({ channelId, source, unsubscribed }) {
    super({});
    this.channelId = channelId;
    this.sourceUrl = source.data.html_url;
    if (source.type === 'repo') {
      this.sourceName = source.data.full_name;
    } else {
      this.sourceName = source.data.login;
    }
    this.unsubscribed = unsubscribed;
  }

  toJSON() {
    const predicate = this.unsubscribed ? 'Unsubscribed' : 'Subscribed';
    const preposition = this.unsubscribed ? 'from' : 'to';
    return {
      response_type: 'in_channel',
      attachments: [{
        ...this.getBaseMessage(),
        text: `${predicate} ${getChannelString(this.channelId)}${preposition} <${this.sourceUrl}|${this.sourceName}>`,
      }],
    };
  }
};
