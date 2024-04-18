import React from 'react';
import Select from 'react-select'
import { PrimaryButton, SecondaryButton, WarningButton, Card, Link, Notice, TextInput } from '@hummhive/ui-elements';
import { Container, Spacer, CardContainer, TutorialImg, Row, FullscreenImg } from './styled';
import step1Img from '../../images/notify-setup/step1.png';
import step2Img from '../../images/notify-setup/step2.png';
import step3Img from '../../images/notify-setup/step3.png';
import step4Img from '../../images/notify-setup/step4.png';
import step5Img from '../../images/notify-setup/step5.png';

export default function Config({
connectSendGridAccount,
apiKeyIdInput,
confirmSenders,
getSenders,
apiKeyInput,
connectionConfig,
sendersOptions,
syncMembers,
sendersList,
isLoadingSender,
setSendersList,
deleteUsers,
isLoading,
setKeyApiIdInput,
setKeyApiInput
}) {
  const [fullscreenImage, setFullscreenImage] = React.useState(null);
  if (!connectionConfig?.content.api_key_id)
    return (
      <Container>
        <ol>
          <li>
            <h3>Connect your Hive with SendGrid2</h3>
            <span>For starters, to use this plugin, you need a valid Sendgrid account and an API key.</span>
            <span>If you don't have a SendGrind Account, <Link target="_blank" href="https://signup.sendgrid.com/">you can create one here.</Link></span>
          </li>
          <br />
          <li>
            <h3>Create a sender Email</h3>
            <span><Link href="https://mc.sendgrid.com/senders" target="_blank">Go to Marketing/Sender</Link> in order to create an email that will be used to send newsletters. Once you are in the page, click on "Create new Sender" fill the form and you will get an email verification.</span>
            <TutorialImg onClick={() => setFullscreenImage(step1Img)} src={step1Img} alt="step two" />
          </li>
          <li>
            <h3>Step 3: Create an API Key</h3>
            <span>Now that you have created an email that you can use you need to create an API key that can be used on the app. The next step is going to <Link href="https://app.sendgrid.com/settings/api_keys" target="_blank">Settings/API Key</Link> and click on "Create API Key"</span>
            <TutorialImg onClick={() => setFullscreenImage(step2Img)} src={step2Img} alt="step two" />
          </li>
          <li>
            <h3>The API Key Details</h3>
            <span>Here you can name the API key using a name that you can easily recognize, make sure to give "Full Access" before clicking o the "Create & View" button</span>
            <TutorialImg onClick={() => setFullscreenImage(step3Img)} src={step3Img} alt="step two" />
          </li>
          <li>
            <h3>The API Key Details</h3>
            <span>The next screen will give you the API Key, please store it on a safe place and then click on "Done" Note: Once you click on "Done" you won't be able to recover it, so please make sure to store it on a safe place!</span>
            <TutorialImg onClick={() => setFullscreenImage(step5Img)} src={step5Img} alt="step two" />
          </li>
        </ol>
        <h3>Last Step: Add the API Key ID and API Key Below!</h3>
      <Spacer height={24} /><Row>
          <TextInput
            placeholder="API Key ID"
            value={apiKeyIdInput}
            onChange={(e) => setKeyApiIdInput(e.target.value)} />
        </Row><Spacer height={24} /><Row>
          <TextInput
            placeholder="API Key"
            value={apiKeyInput}
            type='password'
            onChange={(e) => setKeyApiInput(e.target.value)} />
        </Row>
        <Spacer height={24} />
          <Row>
          <PrimaryButton loading={isLoading} disabled={!apiKeyInput && !apiKeyIdInput} onClick={() => connectSendGridAccount()}>
            Connect my Hive with SendGrid
          </PrimaryButton>
        </Row>
      </Container>
    );

if (connectionConfig?.content.stepCompleted === 1)
  return (
    <Container>
    <h3>Step 2: Send your first emails with SendGrid</h3>
    <span>Before sending email you’ll need to create at least one sender identity. If you haven't done it, you can do it <a href="https://mc.sendgrid.com/senders/new" target="_blank">here.</a></span>
    <Spacer height={14} />
    <Row>
        {sendersOptions?.length > 0 ? (
        <Select className="select-component" placeholder="Please chose an email" options={sendersOptions} value={sendersList} onChange={(e) => setSendersList(e)} />
        ) : (
        <span>No Senders found! <a href="https://mc.sendgrid.com/senders/new" target="_blank"></a>please go here and make sure you have at least one Sender available!</span>
        )}
    </Row>
  <Spacer height={24} />
  <Row>
    <SecondaryButton loading={isLoadingSender} onClick={() => getSenders()}>
    Check for new Senders...
    </SecondaryButton>
        </Row>
          <Spacer height={14} />
          <Row>
    <PrimaryButton loading={isLoading} disabled={!sendersList} onClick={() => confirmSenders()}>
    Continue
    </PrimaryButton>
    </Row>
    </Container>
  );

  if (connectionConfig?.content.stepCompleted === 2)
    return (
      <Container>
        <strong>Your Sendgrid account is now connected!</strong>
        <Row>
      <span>You are sending emails as: {connectionConfig.content.verified_sender_email}</span>
      </Row>
      <Spacer height={24} />
      <Row>
      <PrimaryButton loading={isLoading} onClick={() => syncMembers()}>
        {isLoading ? "Syncing Hive Members with SendGrid" : "Sync Hive Members with SendGrid"}
      </PrimaryButton>
    </Row>
    <Spacer height={12} />
    <Row>
    <WarningButton onClick={() => deleteUsers()}>Disconnect Account from SendGrid</WarningButton>
  </Row>
  {fullscreenImage && (
        <FullscreenImg onClick={() => setFullscreenImage(null)}>
          <img src={fullscreenImage} />
        </FullscreenImg>
      )}
      </Container>
    );

    return  <WarningButton onClick={() => deleteUsers()}>Disconnect Account from SendGrid</WarningButton>
};