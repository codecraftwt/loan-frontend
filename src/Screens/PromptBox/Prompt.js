// src/Screens/PromptBox/Prompt.js
// Backward-compatible alias for the new centralized FinWise CustomAlertModal
import React from 'react';
import CustomAlertModal from '../../Components/common/CustomAlertModal';

const PromptBox = props => {
  return <CustomAlertModal {...props} />;
};

export default PromptBox;
