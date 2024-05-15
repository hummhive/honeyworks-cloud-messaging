// @ts-nocheck
import React from 'react';
import Select from 'react-select';
import { useApi } from '@hummhive/api-react-utils';
import {
  PrimaryButton,
  SecondaryButton,
  WarningButton,
  TextInput,
} from '@hummhive/ui-elements';
import { observer } from 'mobx-react-lite';
import { Container, Spacer, TutorialImg, Row, FullscreenImg } from './styled';
import step1Img from '../../images/notify-setup/step1.png';
import step2Img from '../../images/notify-setup/step2.png';
import step3Img from '../../images/notify-setup/step3.png';
import step5Img from '../../images/notify-setup/step5.png';
import {
  useUpdateConnectionConfig,
  useAddConnectionConfig,
  useConnectionConfig,
} from '@hummhive/state/connectionConfig';

function Config() {
  //const api = useApi(Symbol.for('hummhive-notify'));
  const [fullscreenImage, setFullscreenImage] = React.useState(null);
  const connectionId = 'hummhive-notify';
  const connectionConfig = useConnectionConfig(connectionId);
  const honeyworksSendGridAPI = useApi(Symbol.for('notify'), connectionId);
  const backgroundTasksApi = useApi(Symbol.for('background-task'));
  const updateconnectionConfig = useUpdateConnectionConfig();
  const addConnectionConfig = useAddConnectionConfig();
  const jobId = localStorage.getItem('hummhive-notify-jobid');
  const stepCompleted = localStorage.getItem('hummhive-notify-stepCompleted');
  const [apiKeyIdInput, setKeyApiIdInput] = React.useState('');
  const [apiKeyInput, setKeyApiInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [sendersList, setSendersList] = React.useState(null);
  const [sendersOptions, setSendersOptions] = React.useState(null);
  const [isLoadingSender, setIsLoadingSender] = React.useState(false);
  console.log(stepCompleted);

  React.useEffect(() => {
    if (stepCompleted == 1 && sendersOptions === null) {
      getSenders();
    }
  }, [stepCompleted]);

  const connectSendGridAccount = async () => {
    try {
      setIsLoading(true);
      const data = await honeyworksSendGridAPI.setup(
        apiKeyIdInput,
        apiKeyInput
      );
      const senders = await honeyworksSendGridAPI.checkVerifiedSenders(
        apiKeyIdInput,
        apiKeyInput
      );
      const supressionGroup =
        await honeyworksSendGridAPI.createSuppressionGroup(
          apiKeyIdInput,
          apiKeyInput
        );
      const config = {
        api_key_id: data.api_key_id,
        api_key: apiKeyInput,
        sender_verified: senders.results.sender_verified,
        members_synced: false,
        verified_sender_id: null,
        verified_sender_email: null,
        unsubscribe_group_id: supressionGroup.id,
      };
      if (!connectionConfig) {
        await addConnectionConfig(connectionId, config);
        localStorage.setItem('hummhive-notify-stepCompleted', 1);
      } else {
        await updateconnectionConfig(connectionId, config);
        localStorage.setItem('hummhive-notify-stepCompleted', 1);
      }
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  };

  const getSenders = async () => {
    try {
      setIsLoadingSender(true);
      const getSenders = await honeyworksSendGridAPI.getVerifiedSenders();
      const senderList = getSenders.results.map((sender) => ({
        value: sender.id,
        label: sender.from_email,
      }));
      setSendersOptions(senderList);
      setIsLoadingSender(false);
      return getSenders.results;
    } catch (err) {
      setIsLoading(false);
    }
  };

  const confirmSenders = async () => {
    try {
      setIsLoading(true);
      const getSenders = await honeyworksSendGridAPI.getVerifiedSenders();
      const getVerifiedSender = getSenders.results.find(
        (sender) => sender.id === sendersList.value
      );
      if (getVerifiedSender)
        await updateconnectionConfig(connectionId, {
          ...connectionConfig.content,
          verified_sender_id: getVerifiedSender.id,
          verified_sender_email: getVerifiedSender.from_email,
        });
      localStorage.setItem('hummhive-notify-stepCompleted', 2);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  };

  const syncMembers = async () => {
    try {
      setIsLoading(true);
      const getJob = await honeyworksSendGridAPI.syncContacts();
      if (!getJob) {
        setIsLoading(false);
      }
      await updateconnectionConfig(connectionId, {
        ...connectionConfig.content,
        members_synced: false,
        jobId: getJob.jobs_id,
      });
    } catch (err) {
      setIsLoading(false);
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
      });
      localStorage.removeItem('hummhive-notify-jobid');
      localStorage.removeItem('hummhive-notify-stepCompleted');
    } catch (err) {}
  };

  const syncStatus = async () => {
    try {
      if (connectionConfig?.content.jobId === undefined) {
        await updateconnectionConfig(connectionId, {
          ...connectionConfig.content,
          jobId: null,
        });
      }
      let interval;
      watchSyncStatusInterval();
      const bgTasks = await backgroundTasksApi.add({
        title: 'Syncing Members',
        message: 'Please wait until your hive members are synced',
      });
      async function watchSyncStatusInterval() {
        const prevJobId = [...getItem('hummhive-notify-jobid')];
        const jobStage = await honeyworksSendGridAPI.contactStatus(
          localStorage.getItem('hummhive-notify-jobid')
        );
        if (!interval) {
          interval = setInterval(watchSyncStatusInterval, 5000);
          setIsLoading(true);
        } else if (jobStage.status === 'completed') {
          prevJobId.shift();
          updateconnectionConfig(connectionId, {
            ...connectionConfig.content,
            members_synced: true,
          });
          localStorage.setItem(
            'hummhive-notify-jobid',
            prevJobId.length === 0 ? null : prevJobId
          );
          setIsLoading(false);
          await backgroundTasksApi.remove(bgTasks);
          clearInterval(interval);
        }
      }
    } catch (err) {
      await backgroundTasksApi.remove(bgTasks);
    }
  };

  if (!connectionConfig?.content.api_key_id)
    return (
      <Container>
        <ol>
          <li>
            <h3>Connect your Hive with SendGrid2</h3>
            <span>
              For starters, to use this plugin, you need a valid Sendgrid
              account and an API key.
            </span>
            <span>
              If you don't have a SendGrind Account,{' '}
              <a target="_blank" href="https://signup.sendgrid.com/">
                you can create one here.
              </a>
            </span>
          </li>
          <br />
          <li>
            <h3>Create a sender Email</h3>
            <span>
              <a href="https://mc.sendgrid.com/senders" target="_blank">
                Go to Marketing/Sender
              </a>{' '}
              in order to create an email that will be used to send newsletters.
              Once you are in the page, click on "Create new Sender" fill the
              form and you will get an email verification.
            </span>
            <TutorialImg
              onClick={() => setFullscreenImage(step1Img)}
              src={step1Img}
              alt="step two"
            />
          </li>
          <li>
            <h3>Step 3: Create an API Key</h3>
            <span>
              Now that you have created an email that you can use you need to
              create an API key that can be used on the app. The next step is
              going to{' '}
              <a
                href="https://app.sendgrid.com/settings/api_keys"
                target="_blank"
              >
                Settings/API Key
              </a>{' '}
              and click on "Create API Key"
            </span>
            <TutorialImg
              onClick={() => setFullscreenImage(step2Img)}
              src={step2Img}
              alt="step two"
            />
          </li>
          <li>
            <h3>The API Key Details</h3>
            <span>
              Here you can name the API key using a name that you can easily
              recognize, make sure to give "Full Access" before clicking o the
              "Create & View" button
            </span>
            <TutorialImg
              onClick={() => setFullscreenImage(step3Img)}
              src={step3Img}
              alt="step two"
            />
          </li>
          <li>
            <h3>The API Key Details</h3>
            <span>
              The next screen will give you the API Key, please store it on a
              safe place and then click on "Done" Note: Once you click on "Done"
              you won't be able to recover it, so please make sure to store it
              on a safe place!
            </span>
            <TutorialImg
              onClick={() => setFullscreenImage(step5Img)}
              src={step5Img}
              alt="step two"
            />
          </li>
        </ol>
        <h3>Last Step: Add the API Key ID and API Key Below!</h3>
        <Spacer height={24} />
        <Row>
          <TextInput
            placeholder="API Key ID"
            value={apiKeyIdInput}
            onChange={(e) => setKeyApiIdInput(e.target.value)}
          />
        </Row>
        <Spacer height={24} />
        <Row>
          <TextInput
            placeholder="API Key"
            value={apiKeyInput}
            type="password"
            onChange={(e) => setKeyApiInput(e.target.value)}
          />
        </Row>
        <Spacer height={24} />
        <Row>
          <PrimaryButton
            loading={isLoading}
            disabled={!apiKeyInput && !apiKeyIdInput}
            onClick={() => connectSendGridAccount()}
          >
            Connect my Hive with SendGrid
          </PrimaryButton>
        </Row>
      </Container>
    );

  if (stepCompleted == 1)
    return (
      <Container>
        <h3>Step 2: Send your first emails with SendGrid</h3>
        <span>
          Before sending email you’ll need to create at least one sender
          identity. If you haven't done it, you can do it{' '}
          <a href="https://mc.sendgrid.com/senders/new" target="_blank">
            here.
          </a>
        </span>
        <Spacer height={14} />
        <Row>
          {sendersOptions?.length > 0 ? (
            <Select
              className="select-component"
              placeholder="Please chose an email"
              options={sendersOptions}
              value={sendersList}
              onChange={(e) => setSendersList(e)}
            />
          ) : (
            <span>
              No Senders found!{' '}
              <a href="https://mc.sendgrid.com/senders/new" target="_blank"></a>
              please go here and make sure you have at least one Sender
              available!
            </span>
          )}
        </Row>
        <Spacer height={24} />
        <Row>
          <SecondaryButton
            loading={isLoadingSender}
            onClick={() => getSenders()}
          >
            Check for new Senders...
          </SecondaryButton>
        </Row>
        <Spacer height={14} />
        <Row>
          <PrimaryButton
            loading={isLoading}
            disabled={!sendersList}
            onClick={() => confirmSenders()}
          >
            Continue
          </PrimaryButton>
        </Row>
      </Container>
    );

  if (stepCompleted == 2 || !stepCompleted)
    return (
      <Container>
        <strong>Your Sendgrid account is now connected!</strong>
        <Row>
          <span>
            You are sending emails as:{' '}
            {connectionConfig.content.verified_sender_email}
          </span>
        </Row>
        <Spacer height={24} />
        <Row>
          <PrimaryButton loading={isLoading} onClick={() => syncMembers()}>
            {isLoading
              ? 'Syncing Hive Members with SendGrid'
              : 'Sync Hive Members with SendGrid'}
          </PrimaryButton>
        </Row>
        <Spacer height={12} />
        <Row>
          <WarningButton onClick={() => deleteUsers()}>
            Disconnect Account from SendGrid
          </WarningButton>
        </Row>
        {fullscreenImage && (
          <FullscreenImg onClick={() => setFullscreenImage(null)}>
            <img src={fullscreenImage} />
          </FullscreenImg>
        )}
      </Container>
    );
  console.log(stepCompleted);
}

export default observer(Config);
