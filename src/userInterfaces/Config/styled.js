import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  h3 {
    color: rgba(0, 0, 0, 0.7);
    font-size: 14px;
    font-weight: 600;
    margin: 0;
  }
  p {
    color: rgba(0, 0, 0, 0.7);
    font-size: 12px;
    font-weight: 400;
    margin: 0;
  }
  ol {
    color: rgba(0, 0, 0, 0.7);
    font-size: 14px;
    font-weight: 400;
    padding-inline-start: 16px;
    line-height: 1.7em;
  }
`;

export const Spacer = styled.div`
  height: ${props => props.height || 8}px;
`;

export const Row = styled.div`
  display: flex;
  .select-component{
    width: 100%;
  }
`;

export const CardContainer = styled.div`
  width: 33%;
  margin: 0 8px;

  :first-child {
    margin-left: 0;
  }
  :last-child {
    margin-right: 0;
  }
`;

export const TutorialImg = styled.img`
  border-radius: 16px;
  width: ${props => props.isPortrait ? 'auto' : '100%'};
  height: ${props => props.isPortrait ? '400px' : 'auto'};
  object-fit: contain;
  border: 2px solid ${props => props.theme.main.textVariant};
  cursor: zoom-in;
  margin: 32px 0;
`;

export const FullscreenImg = styled.div`
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 16px;
  position: fixed;
  background: rgba(0, 0, 0, 0.7);
  z-index: 10;
  cursor: zoom-out;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;