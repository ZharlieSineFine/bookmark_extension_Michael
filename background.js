chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "save_tabs") {
    try {
      let tabs = await chrome.tabs.query({currentWindow: true});
      let tabUrls = tabs.map(tab => ({title: tab.title, url: tab.url}));
      let jsonContent = JSON.stringify(tabUrls, null, 2);
      let blob = new Blob([jsonContent], {type: 'application/json'});
      
      // Wasabi upload logic
      uploadToWasabi(blob);

    } catch (error) {
      console.error(error);
      sendResponse({success: false, error: error.message});
    }
    return true; // Keep the message channel open
  }
});

function uploadToWasabi(blob) {
  AWS.config.update({
    accessKeyId: 'YOUR_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
    region: 'us-east-1' // Set to your bucket's region
  });

  const s3 = new AWS.S3({
    endpoint: 's3.wasabisys.com', // Wasabi endpoint
    apiVersion: '2006-03-01'
  });

  const params = {
    Bucket: 'YOUR_BUCKET_NAME',
    Key: `tabs_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    Body: blob,
    ACL: 'public-read'
  };

  s3.upload(params, function(err, data) {
    if (err) {
      console.error("Error uploading data: ", err);
    } else {
      console.log("Successfully uploaded data to Wasabi", data.Location);
    }
  });
}