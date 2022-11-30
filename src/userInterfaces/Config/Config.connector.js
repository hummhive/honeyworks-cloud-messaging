import React from 'react';
import { useApi } from '@hummhive/api-react-utils';
import { useRecoilValueLoadable } from 'recoil';
import { withActiveHive } from '@hummhive/state/hive';
import {
  useUpdateConnectionConfig,
  withConnectionConfig,
} from '@hummhive/state/connection';
import propsMapper from '../../utils/propsMapper';
import Config from './Config';
import packageJson from '../../../package.json';

const path = window.require('path');
const connectionId = 'hummhive-notify';
const mapProps = () => {
  const honeyworksSendGridAPI = useApi(Symbol.for('notify'), connectionId);
  const notificationsAPI = useApi(Symbol.for('notification'));
  const backgroundTasksApi = useApi(Symbol.for('background-task'));
  const hive = useRecoilValueLoadable(withActiveHive).valueMaybe();
  const updateconnectionConfig = useUpdateConnectionConfig();
  const connectionConfig = useRecoilValueLoadable(
    withConnectionConfig(connectionId)
  ).valueMaybe();
  const [apiKeyIdInput, setKeyApiIdInput] = React.useState('');
  const [jobId, setJobId] = React.useState(null);
  const [apiKeyInput, setKeyApiInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [sendersList, setSendersList] = React.useState(null);
  const [sendersOptions, setSendersOptions] = React.useState(null);
  const [senderVerified, setSendersVerified] = React.useState(null);
  const [isLoadingSender, setIsLoadingSender] = React.useState(false);

  React.useEffect(() => {
    if (connectionConfig && connectionConfig?.content.jobId !== null)
      syncStatus();
  }, [connectionConfig]);

  React.useEffect(() => {
    if (connectionConfig && connectionConfig?.content.stepCompleted === 1){
      getSenders();
    }
  }, [connectionConfig]);

  const connectSendGridAccount = async () => {
    try {
      setIsLoading(true);
      const data = await honeyworksSendGridAPI.setup(apiKeyIdInput, apiKeyInput);
      const senders = await honeyworksSendGridAPI.checkVerifiedSenders(apiKeyIdInput, apiKeyInput);
      const supressionGroup = await honeyworksSendGridAPI.createSuppressionGroup(apiKeyIdInput, apiKeyInput);
      const config = {
        api_key_id: data.api_key_id,
        api_key: apiKeyInput,
        sender_verified: senders.results.sender_verified,
        members_synced: false,
        verified_sender_id: null,
        verified_sender_email: null,
        unsubscribe_group_id: supressionGroup.id,
        jobId: null,
        stepCompleted: 1
      };
      await updateconnectionConfig(connectionId, config);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      notificationsAPI.add(err, 'error');
    }
  };

  const getSenders = async () => {
    try {
      setIsLoadingSender(true);
      const getSenders = await honeyworksSendGridAPI.getVerifiedSenders();
      const senderList = getSenders.results.map(sender => ({value: sender.id, label: sender.from_email}));
      setSendersOptions(senderList);
      setIsLoadingSender(false);
      return getSenders.results;
    } catch (err) {
      setIsLoading(false);
      notificationsAPI.add(err, 'error');
    }
  };

  const confirmSenders = async () => {
    try {
      setIsLoading(true);
      const getSenders = await honeyworksSendGridAPI.getVerifiedSenders();
      const getVerifiedSender = getSenders.results.find(sender => sender.id === sendersList.value);
      if(getVerifiedSender)
      await updateconnectionConfig(connectionId, {
        ...connectionConfig.content,
        verified_sender_id: getVerifiedSender.id,
        verified_sender_email: getVerifiedSender.from_email,
        stepCompleted: 2
      });
      setIsLoading(false);
      if(!getVerifiedSender)
      notificationsAPI.add("This email has not been verified with SendGrid", 'error');
    } catch (err) {
      setIsLoading(false);
      notificationsAPI.add(err, 'error');
    }
  };

  const syncMembers = async () => {
    try {
      setIsLoading(true);
      const getJob = await honeyworksSendGridAPI.syncContacts();
      if(!getJob){
      setIsLoading(false);
      return notificationsAPI.add('No Hive Members with Email Address to Sync!', 'alert');
      }
      await updateconnectionConfig(connectionId, {
        ...connectionConfig.content,
        members_synced: false,
        jobId: getJob.jobs_id
      });
    } catch (err) {
      setIsLoading(false);
      notificationsAPI.add(err, 'error');
    }
  };

  const deleteUsers = async () => {
    try {
      await updateconnectionConfig(connectionId, {
        ...connectionConfig.content,
        api_key_id: null,
        members_synced: null,
        verified_sender_email: null,
        verified_sender_id: null,
        sender_verified: null,
        domain_verified: null,
        unsubscribe_group_id: null,
        jobId: null,
        stepCompleted: null
      });
    } catch (err) {
      notificationsAPI.add(err, "You don't have an account");
    }
  };

  const syncStatus = async () => {
    try {
      if(connectionConfig?.content.jobId === undefined){
        await updateconnectionConfig(connectionId, {
          ...connectionConfig.content,
          jobId: null
        });
        return notificationsAPI.add('No Job ID', 'error');
      }
      let interval;
      watchSyncStatusInterval();
      const bgTasks = await backgroundTasksApi.add({title: "Syncing Members", message: "Please wait until your hive members are synced"})
      async function watchSyncStatusInterval() {
      const prevJobId = [...connectionConfig.content.jobId];
      const jobStage = await honeyworksSendGridAPI.contactStatus(connectionConfig.content.jobId);
      if (!interval){
          interval = setInterval(watchSyncStatusInterval, 5000);
          setIsLoading(true);
       } else if (jobStage.status === "completed") {
           prevJobId.shift()
           await updateconnectionConfig(connectionId, {
             ...connectionConfig.content,
             members_synced: true,
             jobId: prevJobId.length === 0 ? null : prevJobId,
           });
           setIsLoading(false);
           await backgroundTasksApi.remove(bgTasks);
           clearInterval(interval);
    }
  }
    } catch (err) {
      notificationsAPI.add(err, 'error');
      await backgroundTasksApi.remove(bgTasks);
    }
  };

  return {
    connectSendGridAccount,
    apiKeyIdInput,
    isLoading,
    confirmSenders,
    isLoadingSender,
    sendersOptions,
    getSenders,
    connectionConfig,
    deleteUsers,
    sendersList,
    setSendersList,
    syncStatus,
    syncMembers,
    apiKeyInput,
    setKeyApiIdInput,
    setKeyApiInput,
    isLoadingSender
  };
};

export default propsMapper(mapProps)(Config);
