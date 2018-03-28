const moment = require('moment');

const {
  Message,
} = require('./index');


module.exports = class RepositoryForked extends Message {
  constructor({ forkee, repository, sender }) {
    super({
      footer: `<${repository.html_url}|${repository.full_name}>`,
    });
    this.forkee = forkee;
    this.original = repository;
    this.sender = sender;
  }

  getFields() {
    const fields = [
      {
        title: 'New Fork Count',
        value: this.original.forks_count,
      },
    ];

    return this.constructor.cleanFields(
      fields,
      1,
    );
  }

  toJSON() {
    const pretext = `:fork_and_knife: Repository forked by <${this.sender.html_url}|${this.sender.login}> :fork_and_knife:`;
    const baseMessage = {
      attachments: [{
        ...super.getBaseMessage(),
        fallback: 'New Fork',
        title: `<${this.forkee.html_url}|${this.forkee.full_name}>`,
        fields: this.getFields(),
        mrkdwn_in: ['text', 'fields'],
        ts: moment(this.forkee.created_at).unix(),
        pretext,
      }],
    };

    return baseMessage;
  }
};
