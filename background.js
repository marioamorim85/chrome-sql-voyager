
// Background script for SQL Client Chrome Extension
// Minimal implementation required for Manifest V3

chrome.runtime.onInstalled.addListener(() => {
  console.log('SQL Client extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // The popup will open automatically due to manifest configuration
  console.log('SQL Client icon clicked');
});

// Listen for messages from popup if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);
  
  // Handle any background tasks here if needed
  if (request.action === 'log') {
    console.log('Log from popup:', request.data);
  }
  
  sendResponse({ success: true });
});
