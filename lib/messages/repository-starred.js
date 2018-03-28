const {
  Message,
} = require('./index');


module.exports = class RepositoryWatched extends Message {
  constructor({ repository, sender }) {
    super({
      footer: `<${repository.html_url}|${repository.full_name}>`,
    });
    this.repository = repository;
    this.sender = sender;
  }

  getFields() {
    const fields = [
      {
        title: 'New Star Count',
        value: this.repository.stargazers_count,
      },
    ];

    return this.constructor.cleanFields(
      fields,
      1,
    );
  }

  toJSON() {
    const pretext = `:star: Repository starred by <${this.sender.html_url}|${this.sender.login}> :star:`;
    const baseMessage = {
      attachments: [{
        ...super.getBaseMessage(),
        fallback: 'New Watch',
        title: `<${this.repository.html_url}|${this.repository.full_name}>`,
        fields: this.getFields(),
        mrkdwn_in: ['text', 'fields'],
        pretext,
      }],
    };

    return baseMessage;
  }
};

