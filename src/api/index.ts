import { injectable, inject, optional } from 'inversify';
import HiveStore from '@hummhive/state/hive';
import appendProvider from '../utils/appendProvider';
import packageJson from '../../package.json';
import StateStore from '@hummhive/state';

@injectable()
export default class HoneyworksSendGridAPI {
  connectionDefinition;
  jobId: string;
  _baseURL: string = 'https://api.sendgrid.com/v3';
  // _baseURL: string = 'http://127.0.0.1:8787';

  _notifications;
  _hive;
  _publisher;
  _groupAPI;
  _blobAPI;
  _cellApi;
  _memberAPI;
  _cryptoUtilsAPI;
  _eventsAPI;
  _connectionAPI;
  _utilApi;

  constructor(
    @inject(Symbol.for('notification')) notifications,
    @inject(Symbol.for('hive')) hive,
    @inject(Symbol.for('@honeyworks/publisher')) @optional() publisher,
    @inject(Symbol.for('blob')) blobAPI,
    @inject(Symbol.for('group')) groupAPI,
    @inject(Symbol.for('member')) memberAPI,
    @inject(Symbol.for('event')) events,
    @inject(Symbol.for('crypto-util')) cryptoUtilsAPI,
    @inject(Symbol.for('cell')) cell,
    @inject(Symbol.for('connection')) connectionAPI,
    @inject(Symbol.for('event')) eventsAPI,
    @inject(Symbol.for('util')) utilApi
  ) {
    this._notifications = notifications;
    this._hive = hive;
    this._publisher = publisher;
    this._utilApi = utilApi;
    this._groupAPI = groupAPI;
    this._blobAPI = blobAPI;
    this._memberAPI = memberAPI;
    this._cellApi = cell;
    this._cryptoUtilsAPI = cryptoUtilsAPI;
    this._connectionAPI = connectionAPI;
    this._eventsAPI = eventsAPI;
    this.connectionDefinition =
      connectionAPI.packageJsonToConnectionDefinition(packageJson);

    this.registerForEvents();
  }

  async getUI(dirName: string): Promise<any> {
    const ui = await import(`../userInterfaces/${dirName}`);
    return ui.default;
  }

  async getConfigUI(): Promise<any> {
    const ui = await import(`../userInterfaces/Config`);
    return ui.default;
  }

  registerForEvents() {
    this._eventsAPI.on('memberAdded', this.handleMembersSyncEvent.bind(this));
    this._eventsAPI.on(
      'memberAddedBatch',
      this.handleMembersSyncEvent.bind(this)
    );
    this._eventsAPI.on(
      'memberAddedToGroup',
      this.handleMembersSyncEvent.bind(this)
    );
    this._eventsAPI.on(
      'memberAddedToGroupBatch',
      //this.handleMembersSyncEvent.bind(this)
      () => {}
    );
    this._eventsAPI.on('memberRemoved', this.handleMembersSyncEvent.bind(this));
    this._eventsAPI.on(
      'memberRemovedBatch',
      this.handleMembersSyncEvent.bind(this)
    );
    this._eventsAPI.on(
      'memberRemovedFromGroup',
      this.handleMembersSyncEvent.bind(this)
    );
    this._eventsAPI.on(
      'memberRemovedFromGroupBatch',
      this.handleMembersSyncEvent.bind(this)
    );
  }

  async isConfigured() {
    const config = await this._connectionAPI.getConfig(
      this.connectionDefinition.connectionId
    );

    return !!config;
  }

  async handleMembersSyncEvent() {
    await this.syncContacts();
  }

  async setup(sendGridKeyId: string, sendGridKey: string) {
    const res = await fetch(`${this._baseURL}/api_keys/` + sendGridKeyId, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sendGridKey,
      },
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error(
          'Unauthorized: Double check that your API ID and Key are correct!'
        );
      }
      return await res.json();
    });

    return res;
  }

  async checkVerifiedSenders(sendGridKeyId: string, sendGridKey: string) {
    const res = await fetch(
      `${this._baseURL}/verified_senders/steps_completed`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + sendGridKey,
        },
      }
    ).then(async (res) => {
      if (!res.ok) {
        throw new Error(
          'Unauthorized: Double check that your API ID and Key are correct!'
        );
      }
      return await res.json();
    });

    return res;
  }

  async syncContacts() {
    const hiveId = this._utilApi.activeHiveId;

    const getGroups = await this._groupAPI.list();

    const getMembersAndGroups = await Promise.all(
      getGroups.map(async (group) => {
        let groupMembers = await this._memberAPI.listByGroups([
          group.header.id,
        ]);
        const membersEmails = groupMembers
          .filter((member) => !!member.content.email)
          .map((str) => ({ email: str.content.email }));
        return {
          list_name: group.content.name,
          list_ids: [`${hiveId}_${group.header.id}`],
          contacts: membersEmails,
        };
      })
    );

    const members = await this._memberAPI.list();
    const membersEmails = members
      .filter((x) => !!x.content.email)
      .map((str) => ({ email: str.content.email }));

    if (membersEmails.length === 0) {
      return null;
    }
    const config = await this._connectionAPI.getConfig(
      this.connectionDefinition.connectionId
    );
    const apiKey = config.content.api_key;

    const syncAllContacts = await fetch(`${this._baseURL}/marketing/contacts`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        contacts: membersEmails,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        return data;
      })
      .catch((error) => {
        return error;
      });

    const createList = await Promise.all(
      getMembersAndGroups.map(async (group) => {
        return await fetch(`${this._baseURL}/marketing/lists`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + apiKey,
          },
          body: JSON.stringify({
            name: `${group.list_ids[0]}`,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            return data;
          })
          .catch((error) => {
            return error;
          });
      })
    );

    const getLists = await fetch(`${this._baseURL}/marketing/lists`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        return data;
      })
      .catch((error) => {
        return error;
      });

    const syncGroupsAndMembers = await Promise.all(
      getMembersAndGroups
        .filter((group) => group.contacts.length !== 0)
        .map(async (group) => {
          const getList = await getLists.result.find(
            (list) => list.name === `${group.list_ids[0]}`
          );
          if (!getList) return;
          return await fetch(`${this._baseURL}/marketing/contacts`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + apiKey,
            },
            body: JSON.stringify({
              list_ids: [getList.id],
              contacts: group.contacts,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              return data;
            })
            .catch((error) => {
              return error;
            });
        })
    );

    return {
      jobs_id: [...syncGroupsAndMembers, syncAllContacts],
    };
  }

  async contactStatus(jobId) {
    const config = await this._connectionAPI.getConfig(
      this.connectionDefinition.connectionId
    );
    const apiKey = config.content.api_key;
    const res = await fetch(
      `${this._baseURL}/marketing/contacts/imports/` + jobId[0].job_id,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey,
        },
      }
    ).then(async (res) => {
      if (!res.ok) {
        return;
      }
      return res.json();
    });

    return res;
  }

  async createSuppressionGroup(sendGridKeyId: string, sendGridKey: string) {
    const groups = await this.getSuppressionGroups(sendGridKey);
    const supressionGroup = groups.find(
      (group) => group.name === 'HummHive Supression Group'
    );
    if (supressionGroup)
      await this.deleteSuppressionGroups(supressionGroup, sendGridKey);
    const res = await fetch(`${this._baseURL}/asm/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sendGridKey,
      },
      body: JSON.stringify({
        name: 'HummHive Supression Group',
        description: 'Default Supression Group for your Humm Hive',
        is_default: true,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        return;
      }
      return await res.json();
    });

    return res;
  }

  async getSuppressionGroups(sendGridKey) {
    const res = await fetch(`${this._baseURL}/asm/groups`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sendGridKey,
      },
    }).then(async (res) => {
      if (!res.ok) {
        return;
      }
      return res.json();
    });

    return res;
  }

  async deleteSuppressionGroups(group, sendGridKey) {
    const res = await fetch(`${this._baseURL}/asm/groups/${group.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sendGridKey,
      },
    }).then(async (res) => {
      if (!res.ok) {
        return;
      }
      return;
    });

    return res;
  }

  async getVerifiedSenders() {
    const config = await this._connectionAPI.getConfig(
      this.connectionDefinition.connectionId
    );
    const apiKey = config.content.api_key;
    const res = await fetch(`${this._baseURL}/verified_senders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
    }).then(async (res) => {
      if (!res.ok) {
        return;
      }
      return await res.json();
    });

    return res;
  }

  async sendSchedule(id) {
    const config = await this._connectionAPI.getConfig(
      this.connectionDefinition.connectionId
    );
    const apiKey = config.content.api_key;
    const res = await fetch(
      `${this._baseURL}/marketing/singlesends/${id}/schedule`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          send_at: 'now',
        }),
      }
    ).then(async (res) => {
      if (!res.ok) {
        throw new Error('Error');
      }
      return await res.json();
    });

    return res;
  }

  async send({ title, content, groups, types }) {
    const hiveStore = StateStore.getStore(HiveStore.STORE_IDENTIFIER);
    const hive = hiveStore.all[0];
    const config = await this._connectionAPI.getConfig(
      this.connectionDefinition.connectionId
    );
    if (!content) throw new Error("Newsletter can't be sent without content!");
    const apiKey = config.content.api_key;
    const getLists = await fetch(`${this._baseURL}/marketing/lists`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        return data;
      })
      .catch((error) => {
        return error;
      });
    const groupsIds = getLists.result
      .filter((list) => groups.includes(list.name.split('_').pop()))
      .map((list) => list.id);

    const res = await fetch(`${this._baseURL}/marketing/singlesends`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        name: title,
        send_to: {
          list_ids: groupsIds,
          all: false,
        },
        email_config: {
          subject: title,
          suppression_group_id: config.content.unsubscribe_group_id,
          sender_id: config.content.verified_sender_id,
          html_content: appendProvider(content, hive.content.name),
        },
      }),
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error('Error');
      }
      const response = await res.json();
      await this.sendSchedule(response.id);
      return response;
    });

    return res;
  }

  async sendAll(title: string, content: string, types: string[]) {
    const hiveStore = StateStore.getStore(HiveStore.STORE_IDENTIFIER);

    const hive = hiveStore.all[0];
    if (!content) throw new Error("Newsletter can't be sent without content!");
    const config = await this._connectionAPI.getConfig(
      this.connectionDefinition.connectionId
    );
    const apiKey = config.content.api_key;
    const res = await fetch(`${this._baseURL}/marketing/singlesends`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        name: title,
        send_to: {
          list_ids: [],
          all: true,
        },
        email_config: {
          subject: title,
          suppression_group_id: config.content.unsubscribe_group_id,
          sender_id: config.content.verified_sender_id,
          html_content: appendProvider(content, hive.content.name),
        },
      }),
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error('Error');
      }
      const response = await res.json();
      await this.sendSchedule(response.id);
      return response;
    });

    return res;
  }
}
